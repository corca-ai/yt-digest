/**
 * 채널 페이지에서 메타데이터를 수집하는 스크립트.
 *
 * 입력:
 *   - 전역 `__INPUT_CHANNELS`: [{ channelId, channelUrl }]
 *   - 전역 `__INPUT_OUTPUT_DIR`: 채널 JSON이 저장될 절대 경로
 *
 * 출력:
 *   각 채널당 `${__INPUT_OUTPUT_DIR}/${channelId}.json`
 */

const fs = require('fs');
const path = require('path');

const channels = typeof __INPUT_CHANNELS !== 'undefined' ? __INPUT_CHANNELS : [];
const outputDir = typeof __INPUT_OUTPUT_DIR !== 'undefined'
  ? __INPUT_OUTPUT_DIR
  : 'data/channels';

fs.mkdirSync(outputDir, { recursive: true });

async function scrapeOne({ channelId, channelUrl }) {
  console.log(`[channel] ${channelId} <- ${channelUrl}`);
  const base = channelUrl.replace(/\/$/, '');

  await page.goto(base);
  await page.waitForTimeout(2500);

  const name = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null);
  const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);

  const subscriberText = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const match = text.match(/([0-9.,]+\s*(?:만|천|million|thousand|K|M)?\s*명?\s*(?:구독자|subscribers))/i);
    return match ? match[1].trim() : null;
  }).catch(() => null);

  await page.goto(`${base}/videos`);
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await page.waitForTimeout(1500);

  const recentVideoTitles = await page.$$eval(
    'ytd-rich-item-renderer #video-title, ytd-grid-video-renderer #video-title, a#video-title-link yt-formatted-string',
    els => {
      const seen = new Set();
      const out = [];
      for (const el of els) {
        const text = (el.getAttribute('title') || el.textContent || '').trim();
        if (!text || seen.has(text)) continue;
        seen.add(text);
        out.push(text);
        if (out.length >= 20) break;
      }
      return out;
    }
  ).catch(() => []);

  return {
    channelId,
    channelUrl: base,
    name,
    description,
    subscriberText,
    recentVideoTitles,
    fetchedAt: new Date().toISOString()
  };
}

for (const channel of channels) {
  try {
    const info = await scrapeOne(channel);
    const file = path.join(outputDir, `${channel.channelId}.json`);
    fs.writeFileSync(file, JSON.stringify(info, null, 2));
    console.log(`  saved ${file} (titles: ${info.recentVideoTitles.length})`);
  } catch (err) {
    console.log(`  failed ${channel.channelId}: ${err && err.message ? err.message : err}`);
  }
}

console.log(`Done. ${channels.length} channels processed.`);
