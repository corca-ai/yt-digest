# YouTube Digest - 개인 유튜브 시청 기록 트래커

## 핵심 문제

유튜브 영상 시청이 1회성 소비로 흘러감. "내가 뭘 봤지?"가 기록되고 인사이트가 나오면 덜 아깝게 느껴질 것.

## 목표

**"컨트롤이 아닌 인지"** - 영상 시청 시간을 줄이려는 게 아니라, 내가 뭘 하고 있는지 선명하게 보고 싶음.

### 원하는 경험

1. **기억 되살리기**: "아맞아, 이런 내용 있었지" - 불빛이 반짝이는 듯한 느낌
2. **솔직한 회고**: "의미없는 영상 많이 봤구나" - 자기 성찰

## 제품 형태

### 인터페이스

| 구분 | 형태 | 설명 |
|------|------|------|
| 메인 (Push) | 주간 이메일 | 매주 월요일 오전, 대시보드 링크만 포함 |
| 보조 (Pull) | 대시보드 | 같은 데이터를 상시 접근 가능 |

### 대시보드 뷰

1. **타임라인 뷰**: 날짜/시간순 나열, 각 영상에 카테고리 태그
2. **카테고리 뷰**: 주제별로 그룹핑

### 카테고리

YouTube 기본 카테고리가 아닌, **LLM이 세밀하게 분류** (경제지식, 신제품리뷰, 저축팁 등)

## 기술 구현

### 중요: Data Portability API 사용 불가

> **2026-04-16 테스트 결과**: Data Portability API는 한국에서 사용할 수 없음.
> "거주 중인 국가에서 사용할 수 없는 기능입니다" 오류 발생.
> 
> **대안**: Google Takeout + Playwriter 자동화

### 아키텍처 (수정됨)

```
/youtube-digest (Claude Code 스킬 실행)
    │
    ├─ 1. Playwriter로 Google Takeout 자동화
    │      ├─ takeout.google.com 접속 (로그인 세션 재사용)
    │      ├─ YouTube 시청 기록만 선택
    │      ├─ JSON 형식으로 내보내기 요청
    │      └─ 다운로드 완료 대기 & 파일 이동
    │
    ├─ 2. watch-history.json 파싱
    │
    ├─ 3. Claude가 영상 분석/카테고리 분류 (API 비용 없이 스킬로 처리)
    │
    ├─ 4. JSON 파일로 데이터 저장
    │
    └─ 5. HTML 대시보드가 JSON 읽어서 렌더링
```

### Playwriter 설정

- **Playwriter**: `npm i -g playwriter`
- **Chrome 확장**: [Playwriter Extension](https://chromewebstore.google.com/detail/playwriter-mcp/jfeammnjpkecdekppnclgkkfahahnfhe)
- **세션 유지**: `storageState`로 Google 로그인 세션 재사용
- **주의**: Google 봇 감지 가능 → `playwright-stealth` 사용 권장

### 데이터 수집 방식 (2가지)

#### 방식 1: Google Takeout (참고용 - 실사용 안 함)

- **용도**: 전체 시청 기록 백업 (필요시)
- **단점**: 시간 오래 걸림 (몇 시간 ~ 며칠), 날짜 필터 없음, 실시간 불가
- **상태**: 테스트만 완료, 실제 구현에서는 방식 2 사용

```javascript
// Takeout 자동화 스크립트 (테스트 완료: 2026-04-16)
await page.goto("https://takeout.google.com");
await page.getByRole("button", { name: "모두 선택 해제" }).click();
await page.getByRole("checkbox", { name: "YouTube 및 YouTube Music 선택" }).click();
await page.getByRole("button", { name: /YouTube.*형식/ }).click();
await page.getByRole("combobox", { name: "기록" }).click();
await page.getByRole("option", { name: "JSON" }).click();
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "다음 단계" }).click();
await page.getByRole("button", { name: "내보내기 생성" }).click();
// → 완료되면 이메일로 다운로드 링크 전송됨
```

#### 방식 2: 히스토리 + My Activity 병합 스크래핑 (실제 사용) ✅

두 데이터 소스를 병합하여 완전한 시청 기록 구성:

| 소스 | URL | 제공 데이터 |
|------|-----|-------------|
| **히스토리** (원본) | youtube.com/feed/history | 제목, 채널, 영상길이, 진행률 |
| **My Activity** (보조) | myactivity.google.com/product/youtube | 정확한 시청 시각 |

- **스크립트**: `src/scrape-history.js`
- **테스트 완료**: 2026-04-16 (197개 영상, 114개 시간 매칭)

```bash
# 실행 방법
npx playwriter session new  # 세션 생성 (Chrome 확장 필요)
npx playwriter -s <session> -e "$(cat src/scrape-history.js)" --timeout 180000
```

**최종 데이터 형식:**
```json
{
  "date": "2026-04-16",
  "time": "08:01",            // My Activity에서 병합 (없으면 null)
  "title": "영상 제목",
  "url": "https://youtube.com/watch?v=...",
  "channel": "채널명",
  "videoId": "XXX",
  "isShort": false,
  "duration": "25:31",        // 영상 전체 길이
  "progressPercent": 23,      // 시청 진행률 (%)
  "lastPositionSec": 355      // 마지막 재생 위치 (초)
}
```

**주의사항:**
- YouTube UI가 두 가지 컴포넌트 사용: `yt-lockup-view-model` (새 UI), `ytd-video-renderer` (기존 UI)
- My Activity에서 광고는 자동 필터링
- My Activity는 "일부 활동이 표시되지 않을 수 있음" → 시간 매칭률 ~60%

### 배포

- **Localhost만**: 항상 컴퓨터에 띄워둔다고 가정
- **이메일 링크**: `localhost:xxxx`
- **모바일**: 후순위 (배포 복잡)

### 데이터 흐름

```
[1. 히스토리 스크래핑] → youtube.com/feed/history
        ↓                 (제목, 채널, 진행률, 영상길이)
[2. My Activity 스크래핑] → myactivity.google.com
        ↓                   (정확한 시청 시각)
[3. 데이터 병합] → videoId + date로 매칭
        ↓
[4. 저장] → /data/history-YYYY-MM-DD.json
        ↓
[5. Claude 분석] → 카테고리 분류
        ↓
[6. HTML 대시보드] → 정적 HTML이 JSON 읽어서 렌더링
        ↓
[7. 주간 이메일] → 대시보드 링크 발송
```

### Google Takeout watch-history.json 형식

```json
[
  {
    "header": "YouTube",
    "title": "Watched 영상 제목",
    "titleUrl": "https://www.youtube.com/watch?v=...",
    "subtitles": [{"name": "채널명", "url": "..."}],
    "time": "2026-04-15T10:30:00.000Z",
    "products": ["YouTube"]
  }
]
```

### 필수 데이터

| 필드 | 출처 | 설명 |
|------|------|------|
| 시청 날짜 | 히스토리 페이지 | 날짜별 섹션 헤더 |
| 시청 시각 | My Activity | "오전 8:01" → "08:01" 변환 |
| 영상 제목 | 히스토리 페이지 | h3 요소에서 추출 |
| 영상 URL | 히스토리 페이지 | videoId 포함 |
| 채널명 | 히스토리 페이지 | 메타데이터 영역 |
| 영상 길이 | 히스토리 페이지 | 썸네일 배지 (25:31) |
| 진행률 | 히스토리 페이지 | 진행률 바 width (23%) |
| 마지막 위치 | URL 파라미터 | t=355s → 355초 |
| 카테고리 | LLM 분류 | 제목 기반으로 분류 (TODO) |

## 제약사항

- 나 혼자 쓰고 나만 볼 것 → 프라이버시 걱정 없음
- 모든 영상 정보를 가져와야 함 (필터링 X, 전체 O)
- 부끄럽거나 의미없는 영상도 포함 → 솔직한 회고 가능

## Google Cloud 설정 (참고용 - 사용 불가)

> Data Portability API는 한국에서 사용 불가. 아래 설정은 참고용.

- **프로젝트**: openclaw-project (ninth-botany-490702-a7)
- **API**: Data Portability API 활성화됨
- **OAuth**: 데스크톱 앱 클라이언트 생성됨
- **인증 파일**: `client_secret.json`
- **테스트 사용자**: sungji9200@naver.com

## 구현 순서

### Phase 1: 데이터 수집 (Playwriter + Takeout)

1. Playwriter로 Google Takeout 자동화 스크립트 구현
2. YouTube 시청 기록 JSON 다운로드 자동화
3. watch-history.json 파싱 및 저장

### Phase 2: 데이터 분석

1. Claude Code 스킬로 영상 카테고리 분류
2. 주간 요약 생성

### Phase 3: 대시보드

1. HTML/CSS/JS 정적 대시보드
2. 타임라인 뷰 구현
3. 카테고리 뷰 구현

### Phase 4: 자동화

1. 주간 데이터 수집 스킬
2. 이메일 발송 (localhost 링크)

## 파일 구조 (예상)

```
youtube-digest/
├── client_secret.json      # OAuth 인증 정보 (gitignore)
├── token.json              # 저장된 토큰 (gitignore)
├── SPEC.md                 # 이 문서
├── src/
│   ├── auth.py             # Google OAuth 인증
│   ├── fetch.py            # Data Portability API 호출
│   ├── analyze.py          # 데이터 분석 (스킬용)
│   └── email.py            # 이메일 발송
├── data/
│   ├── raw/                # API에서 받은 원본 데이터
│   ├── videos.json         # 가공된 영상 데이터
│   └── weekly/             # 주간 리포트 데이터
├── dashboard/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── skills/
    └── youtube-digest.md   # Claude Code 스킬 정의
```

## 참고 자료

- [Data Portability API](https://developers.google.com/data-portability)
- [My Activity Schema](https://developers.google.com/data-portability/schema-reference/my_activity)
- [OAuth Scopes](https://developers.google.com/data-portability/user-guide/scopes)

---

**다음 세션에서 "SPEC.md 보고 구현해줘" 하면 됨**
