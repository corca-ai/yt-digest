# Data Schema

## History File

위치: `data/history/history-YYYY-MM-DD.json`

```json
[
  {
    "date": "2026-04-21",
    "time": "17:12",
    "title": "영상 제목",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "채널명",
    "channelUrl": "https://www.youtube.com/@handle",
    "channelId": "@handle",
    "videoId": "...",
    "isShort": false,
    "duration": "25:31",
    "progressPercent": 100,
    "lastPositionSec": 355,
    "category": "기술/개발",
    "summary": "한 줄 요약"
  }
]
```

- `channelUrl`은 `/@handle`, `/channel/UC...`, `/c/...`, `/user/...` 중 하나를 정규화한 전체 URL
- `channelId`는 `channelUrl`에서 유도된 슬러그(`@handle`, `channel_UCxxx`, `c_Foo`)
- `category`/`summary`는 스크랩·enrich 직후엔 `null`. 스킬이 채널 캐시를 보고 채운다.

## Channel Cache

위치: `data/channels/<channelId>.json` (TTL 7일)

```json
{
  "channelId": "@handle",
  "channelUrl": "https://www.youtube.com/@handle",
  "name": "채널명",
  "description": "채널 메타 설명 (og/meta description)",
  "subscriberText": "1.2만명 구독자",
  "recentVideoTitles": ["최근 영상 1", "최근 영상 2"],
  "fetchedAt": "2026-04-21T08:30:00.000Z"
}
```

## Weekly File

위치: `data/weekly/weekly-YYYY-WNN.json`

```json
{
  "week": "2026-W16",
  "sourceHistory": "history/history-2026-04-16.json",
  "generatedAt": "2026-04-16T07:00:00.000Z",
  "summary": {
    "total_videos": 42,
    "total_watched_hours": 8.4,
    "completion_rate": 57,
    "shorts_count": 9,
    "category_distribution": {
      "기술/개발": 12
    }
  },
  "insights": [
    "이번 주에는 기술/개발 영상을 가장 많이 봤습니다."
  ]
}
```

## Index

위치: `data/index.json`

```json
{
  "latestHistory": "history/history-2026-04-21.json",
  "latestWeekly": "weekly/weekly-2026-W17.json"
}
```
