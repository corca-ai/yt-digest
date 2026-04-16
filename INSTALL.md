# yt-digest Agent Install Prompt

이 문서는 코딩 에이전트가 `yt-digest`를 설치하고, 환경을 준비하고, YouTube 시청 기록을 수집한 뒤, 대시보드까지 띄우도록 지시하는 실행용 프롬프트입니다.

이 문서를 읽은 에이전트는 설명만 하지 말고 실제로 실행해야 합니다. 사용자가 직접 해야 하는 단계가 있을 때만 짧고 구체적으로 요청하고, 사용자가 완료했다고 답하면 즉시 다음 단계로 진행하세요.

## 목표

다음 상태를 끝까지 만드는 것이 목표입니다.

1. `yt-digest` 리포지토리가 로컬에 준비되어 있습니다.
2. 필요한 의존성이 설치되어 있습니다.
3. Playwriter와 Chrome 확장 준비 상태가 확인되었습니다.
4. YouTube 시청 기록 수집, 보강, 주간 다이제스트 생성이 완료되었습니다.
5. `data/index.json`이 최신 산출물을 가리킵니다.
6. 대시보드 서버가 실행 중입니다.
7. 가능하면 기본 브라우저에서 `http://localhost:3000/dashboard/`를 자동으로 열었습니다.

## 반드시 따를 원칙

- 먼저 리포 안의 `AGENTS.md`가 있으면 읽고 따르세요.
- `.agents/skills/yt/SKILL.md`가 있으면 읽고 따르세요.
- Playwriter를 직접 길게 조합하지 말고, 가능하면 항상 `npm run yt:*` 진입점을 우선 사용하세요.
- 설명이나 계획만 제시하고 멈추지 마세요. 실제 명령 실행까지 진행하세요.
- 꼭 필요한 사용자 개입이 아니면 질문하지 마세요.
- 막히면 원인을 확인하고, 다른 합리적인 경로를 먼저 시도하세요.

## 리포 준비

1. 현재 작업 디렉터리에 이미 `yt-digest`가 있으면 그 위치를 사용하세요.
2. 없으면 아래 리포를 클론하세요.

```bash
git clone https://github.com/corca-ai/yt-digest.git
cd yt-digest
```

3. 리포에 들어간 뒤 `AGENTS.md`와 `.agents/skills/yt/SKILL.md`를 읽고 그 지침을 따르세요.

## 설치와 점검

다음 순서대로 실제 실행하세요.

```bash
npm install
npm run yt:doctor
```

`yt:doctor` 결과를 읽고 다음처럼 처리하세요.

- Node.js가 부족하면 Node.js 18+ 설치가 필요하다고 사용자에게 짧게 안내하고, 설치 후 다시 진행하세요.
- Chrome이 없거나 Playwriter 세션을 읽지 못하면 Chrome과 Playwriter 확장 준비 상태를 점검하세요.
- Playwriter CLI가 없으면 `npm install`이 제대로 끝났는지 확인하고 다시 시도하세요.

Playwriter Chrome 확장이 필요하면 이 링크를 사용자에게 안내하세요.

- https://chromewebstore.google.com/detail/playwriter/jfeammnjpkecdekppnclgkkffahnhfhe

## 사용자에게 요청해도 되는 최소 개입

아래 상황에서만 사용자의 도움을 요청하세요.

- Chrome에 Playwriter 확장을 설치해야 할 때
- Google 계정 로그인이 필요할 때
- 새 Playwriter 세션 생성을 위해 브라우저 상호작용이 필요할 때

이 경우에도 길게 설명하지 말고, 아래처럼 짧게 요청하세요.

```text
Playwriter 세션 준비가 필요합니다. Chrome에서 Playwriter 확장을 켜고 YouTube/Google 로그인까지 마친 뒤 알려주세요. 그러면 바로 다음 단계를 진행하겠습니다.
```

## Playwriter 세션 준비

`npm run yt:doctor` 이후 세션이 없으면 실제로 아래 명령을 실행하세요.

```bash
npx playwriter session new
```

세션이 하나뿐이면 스크립트가 자동 선택합니다. 세션이 여러 개면 적절한 세션을 고르거나 `PLAYWRITER_SESSION=<name>` 형태로 지정해서 진행하세요.

## 데이터 수집과 분석

가능하면 전체 파이프라인을 한 번에 실행하세요.

```bash
npm run yt
```

전체 실행이 실패하면 원인을 확인한 뒤 아래 단계를 순서대로 재시도하세요.

```bash
npm run yt:scrape
npm run yt:enrich
npm run yt:digest
```

실행 후에는 최소한 아래를 확인하세요.

- `data/history/` 아래 최신 `history-YYYY-MM-DD.json` 생성 여부
- `data/weekly/` 아래 최신 `weekly-YYYY-WNN.json` 생성 여부
- `data/index.json`의 `latestHistory`, `latestWeekly` 갱신 여부

## 대시보드 실행과 열기

데이터 생성까지 끝나면 실제로 대시보드를 실행하세요.

```bash
npm run dashboard
```

서버가 뜨면 `http://localhost:3000/dashboard/`를 여세요. 환경에 맞는 방법을 스스로 선택해 실행하세요.

- macOS: `open http://localhost:3000/dashboard/`
- Linux: `xdg-open http://localhost:3000/dashboard/`
- Windows: `start http://localhost:3000/dashboard/`

자동으로 열 수 없으면 그 사실을 짧게 알리고, 정확한 URL을 사용자에게 전달하세요. 가능하면 서버는 계속 유지하세요.

## 최종 보고 형식

모든 작업이 끝나면 아래 항목만 짧게 보고하세요.

- 설치 또는 준비 상태
- 실행한 핵심 명령
- 생성된 최신 데이터 파일 경로
- 대시보드 실행 여부와 접속 URL
- 사용자가 직접 해야 했던 일이 있다면 그 한 줄 요약

## 한 줄 요청 예시

사용자가 아래처럼만 말해도, 이 문서의 내용을 읽고 끝까지 실행하세요.

```text
https://github.com/corca-ai/yt-digest/blob/main/INSTALL.md 이 문서를 읽고 내용대로 끝까지 진행해줘.
```
