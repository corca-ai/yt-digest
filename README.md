# yt-digest

개인 YouTube 시청 기록을 수집하고 분석하여 인사이트를 제공합니다.

## 주요 기능

- YouTube 시청 기록 자동 스크래핑 (시청 시간, 진행률 포함)
- 카테고리 자동 분류 및 요약
- 주간 인사이트 생성
- 대시보드로 시각화

## 요구사항

- Node.js 18+
- [playwriter](https://github.com/nicobao/playwriter) (Chrome 확장 프로그램)
- Claude Code (enrich/digest 단계)

## 설치

```bash
# 저장소 클론
git clone https://github.com/corca-ai/yt-digest.git
cd yt-digest

# playwriter 설치
npm install -g playwriter

# data 폴더 생성
mkdir -p data
```

## 사용법

### 1. 시청 기록 스크래핑

```bash
# playwriter 세션 생성 (최초 1회, Chrome 로그인 필요)
npx playwriter session new

# 스크래핑 실행
npx playwriter -s <session-name> -e "$(cat src/scrape-history.js)" --timeout 180000
```

결과: `data/history-YYYY-MM-DD.json`

### 2. 대시보드 보기

```bash
# 인덱스 파일 생성
echo '{"latestHistory": "history-YYYY-MM-DD.json"}' > data/index.json

# 로컬 서버 실행
npx serve .
# 또는
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/dashboard/` 접속

### 3. Claude Code로 분석 (선택)

Claude Code에서 `/yt` 명령어 사용:

```
/yt           # 전체 실행 (scrape → enrich → digest)
/yt scrape    # 시청 기록 스크래핑
/yt enrich    # 카테고리/요약 추가
/yt digest    # 주간 인사이트 생성
```

## 프로젝트 구조

```
yt-digest/
├── src/
│   └── scrape-history.js    # 스크래핑 스크립트
├── data/                    # 시청 기록 (gitignore)
│   ├── index.json           # 최신 파일 인덱스
│   ├── history-YYYY-MM-DD.json
│   └── weekly-YYYY-WNN.json
├── dashboard/               # 정적 대시보드
│   ├── index.html
│   ├── style.css
│   └── app.js
└── .claude/skills/          # Claude Code 스킬
```

## 데이터 형식

### history-YYYY-MM-DD.json

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
    "category": "기술/개발",
    "summary": "영상 요약"
  }
]
```

### 카테고리

- 기술/개발
- 비즈니스/경제
- 엔터테인먼트
- 음악/예배
- 뷰티/패션
- 먹방/요리
- 브이로그/일상
- 교육/자기계발
- 뉴스/시사
- 기타

## 라이선스

MIT
