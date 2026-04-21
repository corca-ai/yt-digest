/**
 * YouTube 시청 기록 스크래핑 스크립트
 *
 * 데이터 소스:
 *   1. youtube.com/feed/history - 원본 (진행률, 영상 길이)
 *   2. myactivity.google.com - 보조 (정확한 시각)
 *
 * 사용법:
 *   npm run yt:doctor
 *   PLAYWRITER_SESSION=<session> npm run yt:scrape
 */

const fs = require('fs');
const path = require('path');

// 상대적 날짜를 절대 날짜로 변환
function parseRelativeDate(dateStr) {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const koreanDays = {
    '일요일': 0, '월요일': 1, '화요일': 2, '수요일': 3,
    '목요일': 4, '금요일': 5, '토요일': 6
  };

  if (dateStr === '오늘') {
    return formatDate(today);
  }

  if (dateStr === '어제') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return formatDate(yesterday);
  }

  if (koreanDays[dateStr] !== undefined) {
    const targetDay = koreanDays[dateStr];
    let daysAgo = dayOfWeek - targetDay;
    if (daysAgo <= 0) daysAgo += 7;
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return formatDate(date);
  }

  const monthDayMatch = dateStr.match(/(\d+)월\s*(\d+)일/);
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]) - 1;
    const day = parseInt(monthDayMatch[2]);
    const date = new Date(today.getFullYear(), month, day);
    if (date > today) {
      date.setFullYear(date.getFullYear() - 1);
    }
    return formatDate(date);
  }

  return dateStr;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractVideoId(url) {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/\/shorts\/([^?&]+)/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

function deriveChannelId(channelUrl) {
  if (!channelUrl) return null;
  const match = channelUrl.match(/youtube\.com(\/(?:@|channel\/|c\/|user\/)[^/?&#]+)/);
  if (!match) return null;
  return match[1].replace(/^\//, '').replace(/\//g, '_');
}

// 한국어 시간을 24시간 형식으로 변환
function parseKoreanTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!match) return null;

  let hour = parseInt(match[2]);
  const minute = match[3];

  if (match[1] === '오후' && hour !== 12) {
    hour += 12;
  } else if (match[1] === '오전' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

// ========== 1. 히스토리 페이지 스크래핑 ==========
async function scrapeHistoryPage(maxScrolls = 5) {
  console.log('[1/2] Scraping YouTube History page...');
  await page.goto('https://www.youtube.com/feed/history');
  await page.waitForTimeout(3000);

  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
  }

  const sections = await page.$$('ytd-item-section-renderer');
  const videos = [];

  for (const section of sections) {
    const dateEl = await section.$('#title');
    const rawDate = dateEl ? (await dateEl.textContent()).trim() : 'Unknown';
    if (rawDate === 'Shorts') continue;
    const date = parseRelativeDate(rawDate);

    // yt-lockup-view-model (새 UI)
    const lockups = await section.$$('yt-lockup-view-model');
    for (const lockup of lockups) {
      const url = await lockup.$eval('a[href*=watch], a[href*=shorts]', el => el.href).catch(() => null);
      const title = await lockup.$eval('h3 span', el => el.textContent.trim()).catch(() => null);
      const metaSpans = await lockup.$$eval(
        'yt-lockup-metadata-view-model span.ytAttributedStringHost',
        els => els.map(el => el.textContent.trim())
      ).catch(() => []);
      const channel = metaSpans.length > 1 ? metaSpans[1] : null;
      const channelUrl = await lockup.$eval(
        'yt-lockup-metadata-view-model a[href^="/@"], yt-lockup-metadata-view-model a[href^="/channel/"], yt-lockup-metadata-view-model a[href^="/c/"], yt-lockup-metadata-view-model a[href^="/user/"]',
        el => el.href
      ).catch(() => null);
      const duration = await lockup.$eval('.ytBadgeShapeText', el => el.textContent.trim()).catch(() => null);
      const progressPercent = await lockup.$eval(
        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
        el => {
          const match = el.style.width.match(/(\d+)/);
          return match ? parseInt(match[1]) : null;
        }
      ).catch(() => null);
      const lastPositionMatch = url?.match(/t=(\d+)s/);
      const lastPositionSec = lastPositionMatch ? parseInt(lastPositionMatch[1]) : null;

      if (url && title) {
        videos.push({
          date,
          time: null, // My Activity에서 채울 예정
          title,
          url: url.split('&')[0], // 파라미터 정리
          channel,
          channelUrl,
          channelId: deriveChannelId(channelUrl),
          videoId: extractVideoId(url),
          isShort: url.includes('/shorts/'),
          duration,
          progressPercent,
          lastPositionSec
        });
      }
    }

    // ytd-video-renderer (기존 UI)
    const renderers = await section.$$('ytd-video-renderer');
    for (const renderer of renderers) {
      const url = await renderer.$eval('#video-title', el => el.href).catch(() => null);
      const title = await renderer.$eval('#video-title', el => el.textContent.trim()).catch(() => null);
      const channel = await renderer.$eval('#channel-name a', el => el.textContent.trim()).catch(() => null);
      const channelUrl = await renderer.$eval('#channel-name a', el => el.href).catch(() => null);
      const duration = await renderer.$eval(
        'span.ytd-thumbnail-overlay-time-status-renderer',
        el => el.textContent.trim()
      ).catch(() => null);
      const progressPercent = await renderer.$eval('#progress', el => {
        const match = el.style.width.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
      }).catch(() => null);
      const lastPositionMatch = url?.match(/t=(\d+)s/);
      const lastPositionSec = lastPositionMatch ? parseInt(lastPositionMatch[1]) : null;

      if (url && title) {
        videos.push({
          date,
          time: null,
          title,
          url: url.split('&')[0],
          channel,
          channelUrl,
          channelId: deriveChannelId(channelUrl),
          videoId: extractVideoId(url),
          isShort: url.includes('/shorts/'),
          duration,
          progressPercent,
          lastPositionSec
        });
      }
    }
  }

  console.log(`[1/2] Found ${videos.length} videos from History page`);
  return videos;
}

// ========== 2. My Activity 페이지 스크래핑 ==========
async function scrapeMyActivity(maxScrolls = 5) {
  console.log('[2/2] Scraping My Activity page...');
  await page.goto('https://myactivity.google.com/product/youtube?hl=ko');
  await page.waitForTimeout(3000);

  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
  }

  const activities = await page.evaluate(() => {
    const items = [];
    const links = document.querySelectorAll('a[href*="youtube.com/watch"]');

    links.forEach(link => {
      const url = link.href;
      const videoIdMatch = url.match(/[?&]v=([^&]+)/);
      if (!videoIdMatch) return;

      // 시간과 날짜 찾기 - 부모 요소 탐색
      let el = link;
      let timeText = null;
      let dateText = null;

      for (let i = 0; i < 15; i++) {
        el = el?.parentElement;
        if (!el) break;

        // 시간 먼저 찾기
        if (!timeText) {
          const timeMatch = el.innerText?.match(/(오전|오후)\s*\d+:\d+/);
          if (timeMatch) timeText = timeMatch[0];
        }

        // 날짜 헤더 찾기 (h2.rp10kf)
        const h2 = el.querySelector('h2.rp10kf');
        if (h2) {
          dateText = h2.textContent.trim();
          break;
        }

        // 이전 형제에서 h2 찾기
        let prev = el.previousElementSibling;
        while (prev) {
          const h2InPrev = prev.querySelector('h2.rp10kf') ||
            (prev.tagName === 'H2' && prev.classList.contains('rp10kf') ? prev : null);
          if (h2InPrev) {
            dateText = h2InPrev.textContent?.trim() || prev.textContent?.trim();
            break;
          }
          prev = prev.previousElementSibling;
        }
        if (dateText) break;
      }

      items.push({
        videoId: videoIdMatch[1],
        dateRaw: dateText,
        timeRaw: timeText
      });
    });

    // 중복 제거
    const unique = [];
    const seen = new Set();
    items.forEach(item => {
      const key = `${item.videoId}_${item.dateRaw}_${item.timeRaw}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique;
  });

  // 시간/날짜 변환
  const result = activities.map(a => ({
    videoId: a.videoId,
    time: parseKoreanTime(a.timeRaw),
    date: parseRelativeDate(a.dateRaw || '')
  }));

  console.log(`[2/2] Found ${result.length} unique activities`);
  return result;
}

// ========== 3. 데이터 병합 ==========
function mergeData(historyVideos, activityData) {
  // videoId + date로 매핑 (같은 영상을 다른 날 볼 수 있음)
  const activityMap = new Map();
  activityData.forEach(a => {
    if (a.videoId) {
      const key = `${a.videoId}_${a.date}`;
      if (!activityMap.has(key)) {
        activityMap.set(key, a.time);
      }
    }
  });

  // 히스토리 데이터에 시간 추가
  const merged = historyVideos.map(video => {
    const key = `${video.videoId}_${video.date}`;
    const time = activityMap.get(key);
    return {
      ...video,
      time: time || null
    };
  });

  const withTime = merged.filter(v => v.time).length;
  console.log(`[Merge] ${withTime}/${merged.length} videos matched with exact time`);

  return merged;
}

// ========== 실행 ==========
const historyVideos = await scrapeHistoryPage(5);
const activityData = await scrapeMyActivity(5);
const mergedData = mergeData(historyVideos, activityData);

// 저장
const envOutput = typeof process !== 'undefined' && process.env ? process.env.YT_DIGEST_OUTPUT : null;
const filename = envOutput || `data/history/history-${formatDate(new Date())}.json`;
fs.mkdirSync(path.dirname(filename), { recursive: true });
fs.writeFileSync(filename, JSON.stringify(mergedData, null, 2));
console.log(`\nSaved to ${filename}`);

// 통계
console.log('\n--- Summary ---');
console.log('Total videos:', mergedData.length);
console.log('With exact time:', mergedData.filter(v => v.time).length);
console.log('Completed (100%):', mergedData.filter(v => v.progressPercent === 100).length);
console.log('Shorts:', mergedData.filter(v => v.isShort).length);
