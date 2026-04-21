# Workflow

1. `npm install`
2. `npm run yt:doctor`
3. `npx playwriter session new`로 Chrome 로그인 세션 생성 (필요 시)
4. `PLAYWRITER_SESSION=<name> npm run yt:scrape`
5. `npm run yt:enrich` — oEmbed로 `channelUrl`/`channelId` 보강, 필드 정규화
6. `npm run yt:channels` — 히스토리 기준으로 채널 캐시 보강 (TTL 7일)
7. **스킬이 `category`/`summary` 채움** (`SKILL.md`의 Classification Step 참조)
8. `npm run yt:digest`
9. `npm run dashboard` 후 `http://localhost:3000/dashboard/` 확인

주의:

- Chrome 확장과 Google 로그인은 자동화 대상 밖이다.
- `yt:scrape`와 `yt:channels`는 Playwriter 로컬 설치가 필요하다.
- `yt:enrich`는 키워드 분류를 더 이상 수행하지 않는다. 실제 카테고리/요약은 스킬이 채널 캐시(`data/channels/`)를 읽고 직접 기록한다.
