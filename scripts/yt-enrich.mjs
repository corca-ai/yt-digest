import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { deriveChannelId } from './lib/channels.mjs';
import {
  dataDir,
  ensureDataLayout,
  getLatestJsonFile,
  historyDir,
  readJson,
  relativeDataPath,
  updateIndex,
  writeJson
} from './lib/storage.mjs';

ensureDataLayout();

const latestHistoryFile = getLatestJsonFile(historyDir);

if (!latestHistoryFile) {
  console.error('history 파일이 없습니다. 먼저 `npm run yt:scrape`를 실행하세요.');
  process.exit(1);
}

const lookupFile = join(dataDir, 'channel-lookup.json');
const lookup = existsSync(lookupFile) ? readJson(lookupFile) : {};
let lookupDirty = false;

let oembedCalls = 0;

async function resolveChannelUrl(video) {
  const cacheKey = video.channel;
  if (cacheKey && lookup[cacheKey]) {
    return { url: lookup[cacheKey], fromCache: true };
  }

  if (!video.url) return { url: null, fromCache: false };

  oembedCalls += 1;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(video.url)}&format=json`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.warn(`  oembed ${res.status} for ${video.videoId} (${video.channel})`);
      return { url: null, fromCache: false };
    }
    const body = await res.json();
    const url = body.author_url ?? null;
    if (url && cacheKey) {
      lookup[cacheKey] = url;
      lookupDirty = true;
    }
    return { url, fromCache: false };
  } catch (err) {
    console.warn(`  oembed failed for ${video.videoId}: ${err.message}`);
    return { url: null, fromCache: false };
  }
}

const history = readJson(latestHistoryFile);

let changed = 0;
const normalized = [];

for (const video of history) {
  const next = { ...video };

  if (!next.channelUrl) {
    const { url } = await resolveChannelUrl(next);
    if (url) {
      next.channelUrl = url;
      changed += 1;
    }
  }

  if (!next.channelId && next.channelUrl) {
    next.channelId = deriveChannelId(next.channelUrl);
    changed += 1;
  }

  if (!('category' in next)) {
    next.category = null;
    changed += 1;
  }

  if (!('summary' in next)) {
    next.summary = null;
    changed += 1;
  }

  normalized.push(next);
}

if (changed > 0) {
  writeJson(latestHistoryFile, normalized);
}

if (lookupDirty) {
  writeJson(lookupFile, lookup);
}

updateIndex({
  latestHistory: relativeDataPath(latestHistoryFile)
});

const unclassified = normalized.filter((v) => !v.category).length;
const missingChannelUrl = normalized.filter((v) => !v.channelUrl).length;

console.log(
  `Normalized ${relativeDataPath(latestHistoryFile)} (${changed} field updates, ${oembedCalls} oembed lookups, ${missingChannelUrl} missing channelUrl, ${unclassified} unclassified).`
);
console.log('Classification is performed by the yt skill. Ask Claude to run `/yt enrich`.');
