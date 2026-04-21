import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { dataDir, readJson } from './storage.mjs';

export const channelsDir = join(dataDir, 'channels');
export const CHANNEL_TTL_DAYS = 7;

export function deriveChannelId(channelUrl) {
  if (!channelUrl) return null;
  const match = channelUrl.match(/youtube\.com(\/(?:@|channel\/|c\/|user\/)[^/?&#]+)/);
  if (!match) return null;
  return match[1].replace(/^\//, '').replace(/\//g, '_');
}

export function channelCachePath(channelId) {
  return join(channelsDir, `${channelId}.json`);
}

export function isChannelCacheFresh(channelId, ttlDays = CHANNEL_TTL_DAYS) {
  const file = channelCachePath(channelId);
  if (!existsSync(file)) return false;
  const ageMs = Date.now() - statSync(file).mtimeMs;
  return ageMs < ttlDays * 24 * 60 * 60 * 1000;
}

export function readChannelCache(channelId) {
  const file = channelCachePath(channelId);
  if (!existsSync(file)) return null;
  return readJson(file);
}

export function listCachedChannels() {
  if (!existsSync(channelsDir)) return [];
  return readdirSync(channelsDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));
}
