# YouTube Digest

개인 YouTube 시청 기록을 수집하고 분석하여 주간 인사이트를 제공하는 프로젝트.

## 작업 방식

- 유의미한 작업을 완료할 때마다 커밋한다

## 스킬

### /yt [command]

YouTube 시청 기록 수집 및 분석.

```
/yt           # 전체 실행 (scrape → enrich → digest)
/yt scrape    # 시청 기록 스크래핑
/yt enrich    # 영상별 카테고리/요약 추가
/yt digest    # 주간 인사이트 생성
```

스킬 원본은 `.agents/skills/yt/`에 있고, `.claude/skills/yt`는 그 디렉터리를 가리키는 심링크다. (파일이 아닌 디렉터리 심링크여야 Claude Code 로더가 `SKILL.md`와 `references/`, `assets/`를 함께 인식한다.)

## 프로젝트 구조

```
youtube-digest/
├── .agents/
│   └── skills/
│       └── yt/
│           ├── SKILL.md
│           ├── assets/
│           └── references/
├── scripts/
│   ├── yt-scrape.mjs              # playwriter 실행 래퍼
│   ├── yt-enrich.mjs              # 카테고리/요약 보강
│   ├── yt-digest.mjs              # 주간 인사이트 생성
│   ├── yt-doctor.mjs              # 로컬 환경 점검
│   └── playwriter/
│       └── collect-watch-history.js
├── data/
│   ├── history/                   # 일별 시청 기록
│   ├── weekly/                    # 주간 인사이트
│   └── index.json                 # 최신 파일 인덱스 (생성물)
├── dashboard/                     # 정적 대시보드
├── docs/
│   ├── spec.md                    # 상세 스펙
│   └── discovery/
├── AGENTS.md
└── CLAUDE.md                      # AGENTS.md 심링크
```

## 데이터 흐름

1. **scrape**: Playwriter로 YouTube 히스토리 + My Activity 스크래핑
2. **enrich**: 영상별 카테고리와 한 줄 요약 추가
3. **digest**: 시청 시간, 카테고리 분포, 주간 인사이트 생성
4. **dashboard**: `data/index.json` 기준으로 최신 결과 시각화

## 의존성

- Node.js 18+
- `npm install`
- Chrome + Playwriter 확장 프로그램
- Google 계정 로그인 상태

## 카테고리

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
