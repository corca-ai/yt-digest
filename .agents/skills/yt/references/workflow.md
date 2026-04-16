# Workflow

1. `npm install`
2. `npm run yt:doctor`
3. `npx playwriter session new`로 Chrome 로그인 세션 생성
4. `PLAYWRITER_SESSION=<name> npm run yt:scrape`
5. `npm run yt:enrich`
6. `npm run yt:digest`
7. `npm run dashboard` 후 `http://localhost:3000/dashboard/` 확인

주의:

- Chrome 확장과 Google 로그인은 자동화 대상 밖이다.
- `yt:scrape`는 Playwriter 로컬 설치가 필요하다.
- `yt:enrich`는 현재 제목/채널 기반 규칙 분류를 수행한다.
