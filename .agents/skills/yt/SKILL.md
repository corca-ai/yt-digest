---
name: yt
description: YouTube 시청 기록을 수집하고 분석하는 로컬 리포 스킬. yt-digest 리포에서 npm script를 사용해 scrape, enrich, digest, doctor를 실행할 때 사용한다.
---

# YouTube Digest

이 스킬은 현재 리포를 작업공간으로 사용한다. 직접 Playwriter CLI를 길게 조합하지 말고 항상 `npm run` 진입점을 우선 사용한다.

## Commands

- `/yt` 또는 `/yt all`: `npm run yt`
- `/yt scrape`: `npm run yt:scrape`
- `/yt enrich`: `npm run yt:enrich`
- `/yt digest`: `npm run yt:digest`
- 환경 점검이 먼저 필요하면: `npm run yt:doctor`

## Workflow

1. 필요하면 `npm install`
2. Playwriter 준비 상태를 `npm run yt:doctor`로 확인
3. 세션이 없으면 `npx playwriter session new`
4. 스크래핑은 `npm run yt:scrape`
5. 메타데이터 보강은 `npm run yt:enrich`
6. 주간 인사이트 생성은 `npm run yt:digest`

`/yt`는 위 세 단계를 순서대로 실행한다.

## Session Handling

- 기본적으로 `PLAYWRITER_SESSION` 환경 변수를 우선 사용한다.
- 세션이 하나뿐이면 스크립트가 자동 선택을 시도한다.
- 세션이 여러 개면 사용자가 `PLAYWRITER_SESSION=<name> npm run yt:scrape` 형태로 지정해야 한다.

## Data Contract

- 일별 기록: `data/history/history-YYYY-MM-DD.json`
- 주간 인사이트: `data/weekly/weekly-YYYY-WNN.json`
- 최신 포인터: `data/index.json`

필드와 카테고리 정의가 더 필요하면 아래 참고 문서를 읽는다.

- 카테고리: `references/categories.md`
- 데이터 스키마: `references/data-schema.md`
- 운영 흐름: `references/workflow.md`
