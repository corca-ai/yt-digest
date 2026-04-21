---
name: yt
description: YouTube 시청 기록을 수집·분류·요약하는 로컬 리포 스킬. yt-digest 리포에서 npm script로 데이터 파이프라인을 돌리고, 카테고리 분류와 한 줄 요약은 스킬(Claude)이 채널 메타데이터를 읽고 직접 수행한다.
---

# YouTube Digest

이 스킬은 현재 리포를 작업공간으로 사용한다. Playwriter CLI를 길게 조합하지 말고 항상 `npm run` 진입점을 우선 사용한다. 카테고리 분류와 요약은 LLM API가 아니라 **스킬이 직접** 채널 컨텍스트를 읽고 판단한다.

## Commands

- `/yt` 또는 `/yt all`: 전체 파이프라인 (scrape → enrich → channels → **classify(스킬)** → digest)
- `/yt scrape`: `npm run yt:scrape` — 시청 기록 수집
- `/yt channels`: `npm run yt:channels` — 히스토리에 등장한 채널 메타데이터를 `data/channels/`에 캐시 (TTL 7일)
- `/yt enrich`: `npm run yt:enrich`로 필드 정규화 후 스킬이 카테고리/요약을 채움
- `/yt digest`: `npm run yt:digest`
- 환경 점검: `npm run yt:doctor`

## Workflow

### /yt 전체 파이프라인

1. 필요하면 `npm install`
2. `npm run yt:doctor`로 세션/환경 확인. 세션이 없으면 `npx playwriter session new` 실행을 사용자에게 요청
3. `npm run yt:scrape` — 최신 `data/history/history-YYYY-MM-DD.json` 생성
4. `npm run yt:enrich` — oEmbed로 `channelUrl`/`channelId` 채우고, `category`/`summary`가 없으면 `null`로 초기화 (더 이상 키워드 매칭을 하지 않는다)
5. `npm run yt:channels` — 히스토리의 채널 중 캐시가 없거나 7일 이상 된 것을 Playwriter로 보강, `data/channels/<channelId>.json` 저장
6. **스킬이 직접 분류·요약** (아래 "Classification Step" 참조)
7. `npm run yt:digest` — 주간 인사이트 생성

### Classification Step (스킬이 수행)

1. `data/index.json`에서 `latestHistory` 경로를 확인하고 해당 파일을 읽는다
2. `category`가 `null`인 항목을 대상으로, 각 영상의 `channelId`로 `data/channels/<channelId>.json`을 읽어 채널 `description`과 `recentVideoTitles`를 함께 참고한다
3. `references/categorization.md`의 판정 가이드를 따라 카테고리 하나를 고르고, 한 줄 요약(`summary`)을 한국어로 작성한다
4. 채널 캐시가 없거나 비어 있으면 제목/채널명만으로 최선의 추정을 하고, 확신이 약하면 `기타`로 둔다
5. 같은 history 파일을 그대로 덮어쓴다(다른 필드 건드리지 말 것). `writeJson`과 동일한 포맷(2 space indent, trailing newline)을 유지한다

### 단일 단계 실행

- `/yt scrape`, `/yt channels`, `/yt digest`는 각 npm 스크립트만 실행
- `/yt enrich`는 `npm run yt:enrich` 실행 후 Classification Step까지 스킬이 수행

## Session Handling

- 기본적으로 `PLAYWRITER_SESSION` 환경 변수를 우선 사용한다
- 세션이 하나뿐이면 스크립트가 자동 선택을 시도한다
- 세션이 여러 개면 `PLAYWRITER_SESSION=<name> npm run yt:scrape` 또는 `-- --session <name>`으로 지정한다

## Data Contract

- 일별 기록: `data/history/history-YYYY-MM-DD.json`
- 채널 캐시: `data/channels/<channelId>.json` (TTL 7일)
- 주간 인사이트: `data/weekly/weekly-YYYY-WNN.json`
- 최신 포인터: `data/index.json`

세부 필드는 `references/data-schema.md`, 분류 규칙은 `references/categorization.md`, 카테고리 목록은 `references/categories.md`, 운영 흐름은 `references/workflow.md`를 참고한다.
