import { enrichVideos } from './lib/categories.mjs';
import {
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

const history = readJson(latestHistoryFile);
const { videos, changed } = enrichVideos(history);

writeJson(latestHistoryFile, videos);
updateIndex({
  latestHistory: relativeDataPath(latestHistoryFile)
});

console.log(`Enriched ${relativeDataPath(latestHistoryFile)} (${changed} field updates)`);
