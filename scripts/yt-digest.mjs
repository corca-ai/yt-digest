import {
  ensureDataLayout,
  getIsoWeekInfo,
  getLatestJsonFile,
  historyDir,
  readJson,
  relativeDataPath,
  updateIndex,
  weeklyDir,
  writeJson
} from './lib/storage.mjs';

function parseDurationToSeconds(duration) {
  if (!duration) {
    return 0;
  }

  const parts = duration.split(':').map(Number);

  if (parts.some(Number.isNaN)) {
    return 0;
  }

  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }

  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }

  return 0;
}

function roundToSingleDecimal(value) {
  return Math.round(value * 10) / 10;
}

function buildInsights(videos, categoryDistribution, completionRate) {
  const insights = [];

  const topCategoryEntry = Object.entries(categoryDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topCategoryEntry?.[1] > 0) {
    insights.push(`이번 주에는 ${topCategoryEntry[0]} 영상을 가장 많이 봤습니다.`);
  }

  const shortsCount = videos.filter((video) => video.isShort).length;
  if (shortsCount > 0) {
    insights.push(`Shorts 비중은 ${shortsCount}개였습니다.`);
  }

  if (completionRate >= 70) {
    insights.push('완료율이 높아 긴 영상도 끝까지 보는 편이었습니다.');
  } else if (completionRate <= 30) {
    insights.push('완료율이 낮아 탐색성 시청이 많았던 주였습니다.');
  }

  const datedCounts = new Map();
  for (const video of videos) {
    datedCounts.set(video.date, (datedCounts.get(video.date) ?? 0) + 1);
  }

  const busiestDay = [...datedCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (busiestDay) {
    insights.push(`${busiestDay[0]}에 가장 많은 영상(${busiestDay[1]}개)을 봤습니다.`);
  }

  const timedVideos = videos.filter((video) => video.time);
  const lateNightVideos = timedVideos.filter((video) => {
    const hour = Number.parseInt(video.time.split(':')[0], 10);
    return hour >= 23 || hour < 2;
  }).length;

  if (lateNightVideos > 0) {
    insights.push(`늦은 밤 시청 기록이 ${lateNightVideos}개 있었습니다.`);
  }

  return insights.slice(0, 4);
}

ensureDataLayout();

const latestHistoryFile = getLatestJsonFile(historyDir);

if (!latestHistoryFile) {
  console.error('history 파일이 없습니다. 먼저 `npm run yt:scrape`를 실행하세요.');
  process.exit(1);
}

const videos = readJson(latestHistoryFile);

const categoryDistribution = {};
let totalWatchedSeconds = 0;
let completedCount = 0;

for (const video of videos) {
  const category = video.category ?? '기타';
  categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1;

  const durationSeconds = parseDurationToSeconds(video.duration);
  const progressRatio = typeof video.progressPercent === 'number'
    ? Math.min(Math.max(video.progressPercent, 0), 100) / 100
    : durationSeconds > 0
      ? 1
      : 0;

  totalWatchedSeconds += durationSeconds * progressRatio;

  if ((video.progressPercent ?? 0) >= 90) {
    completedCount += 1;
  }
}

const newestDate = videos
  .map((video) => video.date)
  .filter(Boolean)
  .sort()
  .at(-1);

const weekInfo = getIsoWeekInfo(newestDate ?? new Date());
const weeklyFilename = `weekly-${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}.json`;
const weeklyFilePath = `${weeklyDir}/${weeklyFilename}`;
const completionRate = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

const weeklyDigest = {
  week: `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`,
  sourceHistory: relativeDataPath(latestHistoryFile),
  generatedAt: new Date().toISOString(),
  summary: {
    total_videos: videos.length,
    total_watched_hours: roundToSingleDecimal(totalWatchedSeconds / 3600),
    completion_rate: completionRate,
    shorts_count: videos.filter((video) => video.isShort).length,
    category_distribution: categoryDistribution
  },
  insights: buildInsights(videos, categoryDistribution, completionRate)
};

writeJson(weeklyFilePath, weeklyDigest);
updateIndex({
  latestHistory: relativeDataPath(latestHistoryFile),
  latestWeekly: relativeDataPath(weeklyFilePath)
});

console.log(`Wrote ${relativeDataPath(weeklyFilePath)}`);
