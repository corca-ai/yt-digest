# yt-digest

개인 YouTube 시청 기록을 수집하고 분석해 인사이트와 대시보드로 정리하는 로컬 리포지토리입니다.

## 퀵스타트

아래 프롬프트를 복사해 코딩 에이전트에게 붙여넣으세요.

```text
https://github.com/corca-ai/yt-digest/blob/main/INSTALL.md 이 문서를 읽고 내용대로 끝까지 진행해줘.
```

에이전트용 실행 문서는 [INSTALL.md](./INSTALL.md)에서 직접 확인하실 수 있습니다.

## 주요 기능

- YouTube 히스토리 + My Activity 병합 스크래핑
- 제목/채널 기반 카테고리 분류 및 한 줄 요약 보강
- 주간 인사이트 JSON 생성
- 정적 대시보드로 최신 결과 시각화

## 설치

```bash
git clone https://github.com/corca-ai/yt-digest.git
cd yt-digest
npm install
```

추가로 필요한 항목은 다음과 같습니다.

- Node.js 18+
- Chrome
- [Playwriter Chrome 확장](https://chromewebstore.google.com/detail/playwriter-mcp/jfeammnjpkecdekppnclgkkfahahnfhe)
- Google 계정 로그인 세션

## 빠른 시작

```bash
npm run yt:doctor
npx playwriter session new
PLAYWRITER_SESSION=<session-name> npm run yt
```

개별 단계는 다음과 같이 실행하실 수 있습니다.

```bash
npm run yt:scrape
npm run yt:enrich
npm run yt:digest
npm run dashboard
```

대시보드는 `http://localhost:3000/dashboard/`에서 확인하실 수 있습니다.

## 데이터 위치

- 시청 기록: `data/history/history-YYYY-MM-DD.json`
- 주간 인사이트: `data/weekly/weekly-YYYY-WNN.json`
- 최신 포인터: `data/index.json`

`data/index.json`은 스크립트가 자동으로 갱신합니다. 대시보드는 이 파일을 기준으로 최신 데이터를 읽습니다.

## 스킬 구조

- canonical skill: `.agents/skills/yt/SKILL.md`
- Claude 연결점: `.claude/skills/yt`

스킬도 동일한 `npm run yt:*` 진입점을 사용합니다.

## 프로젝트 구조

```text
yt-digest/
├── .agents/skills/yt/         # 스킬 정의, 참고 문서, 템플릿
├── scripts/                   # npm run 진입점과 Playwriter 스크립트
├── data/
│   ├── history/
│   └── weekly/
├── dashboard/                 # 정적 뷰어
├── docs/
│   ├── spec.md
│   └── discovery/
└── AGENTS.md
```

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

## 라이선스

MIT
