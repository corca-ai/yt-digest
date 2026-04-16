import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(libDir, '../..');
export const dataDir = join(repoRoot, 'data');
export const historyDir = join(dataDir, 'history');
export const weeklyDir = join(dataDir, 'weekly');
export const indexFile = join(dataDir, 'index.json');
export const indexTemplateFile = join(
  repoRoot,
  '.agents/skills/yt/assets/index.json.example'
);

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getIsoWeekInfo(dateInput) {
  const sourceDate =
    typeof dateInput === 'string'
      ? parseDateString(dateInput)
      : new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  const date = new Date(sourceDate);

  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return {
    year: date.getUTCFullYear(),
    week
  };
}

export function ensureDataLayout() {
  mkdirSync(historyDir, { recursive: true });
  mkdirSync(weeklyDir, { recursive: true });

  if (!existsSync(indexFile)) {
    const template = existsSync(indexTemplateFile)
      ? JSON.parse(readFileSync(indexTemplateFile, 'utf8'))
      : { latestHistory: null, latestWeekly: null };
    writeJson(indexFile, template);
  }
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function listJsonFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => join(directory, fileName));
}

export function getLatestJsonFile(directory) {
  const files = listJsonFiles(directory);
  return files.length > 0 ? files[files.length - 1] : null;
}

export function relativeDataPath(filePath) {
  return relative(dataDir, filePath).replaceAll('\\', '/');
}

export function updateIndex(partialIndex) {
  ensureDataLayout();

  const currentIndex = existsSync(indexFile) ? readJson(indexFile) : {};
  const nextIndex = { ...currentIndex, ...partialIndex };
  writeJson(indexFile, nextIndex);
  return nextIndex;
}
