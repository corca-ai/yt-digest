# Data Schema

## History File

위치: `data/history/history-YYYY-MM-DD.json`

```json
[
  {
    "date": "2026-04-16",
    "time": "08:01",
    "title": "영상 제목",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "채널명",
    "videoId": "...",
    "isShort": false,
    "duration": "25:31",
    "progressPercent": 100,
    "lastPositionSec": 355,
    "category": "기술/개발",
    "summary": "채널명과 제목을 바탕으로 만든 한 줄 요약"
  }
]
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
