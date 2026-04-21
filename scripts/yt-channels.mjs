import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CHANNEL_TTL_DAYS,
  channelsDir,
  deriveChannelId,
  isChannelCacheFresh
} from './lib/channels.mjs';
import { resolvePlaywriterBin } from './lib/playwriter.mjs';
import { resolveSessionName } from './lib/session.mjs';
import {
  ensureDataLayout,
  getLatestJsonFile,
  historyDir,
  readJson,
  repoRoot
} from './lib/storage.mjs';

ensureDataLayout();
mkdirSync(channelsDir, { recursive: true });

const latestHistoryFile = getLatestJsonFile(historyDir);

if (!latestHistoryFile) {
  console.error('history 파일이 없습니다. 먼저 `npm run yt:scrape`를 실행하세요.');
  process.exit(1);
}

const history = readJson(latestHistoryFile);

const channelMap = new Map();
for (const video of history) {
  const channelUrl = video.channelUrl;
  if (!channelUrl) continue;
  const channelId = video.channelId ?? deriveChannelId(channelUrl);
  if (!channelId || channelMap.has(channelId)) continue;
  channelMap.set(channelId, { channelId, channelUrl });
}

if (channelMap.size === 0) {
  console.log('히스토리에 channelUrl 정보가 없습니다. scrape를 다시 돌리세요.');
  process.exit(0);
}

const targets = [];
for (const entry of channelMap.values()) {
  if (isChannelCacheFresh(entry.channelId)) {
    continue;
  }
  targets.push(entry);
}

if (targets.length === 0) {
  console.log(`모든 채널 캐시가 최근 ${CHANNEL_TTL_DAYS}일 이내입니다. 건너뜁니다.`);
  process.exit(0);
}

console.log(`Refreshing ${targets.length} / ${channelMap.size} channel caches...`);

const sessionName = resolveSessionName();
const playwriterBin = resolvePlaywriterBin();
const scriptPath = join(repoRoot, 'scripts/playwriter/collect-channel-info.js');
const scriptBody = readFileSync(scriptPath, 'utf8');

const prefix =
  `const __INPUT_CHANNELS = ${JSON.stringify(targets)};\n` +
  `const __INPUT_OUTPUT_DIR = ${JSON.stringify(channelsDir)};\n`;

console.log(`Using Playwriter session: ${sessionName}`);

execFileSync(
  playwriterBin,
  ['-s', sessionName, '-e', prefix + scriptBody, '--timeout', '300000'],
  { stdio: 'inherit' }
);
