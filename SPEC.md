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

### 배포

- **Localhost만**: 항상 컴퓨터에 띄워둔다고 가정
- **이메일 링크**: `localhost:xxxx`
- **모바일**: 후순위 (배포 복잡)

### 데이터 흐름

```
[Playwriter] → Google Takeout 자동화
        ↓
[다운로드] → Takeout ZIP → watch-history.json 추출
        ↓
[Claude 분석] → 카테고리 분류, 요약 생성
        ↓
[데이터 저장] → /data/videos.json, /data/weekly/YYYY-WW.json
        ↓
[HTML 대시보드] → 정적 HTML이 JSON 읽어서 렌더링
        ↓
[주간 이메일] → 대시보드 링크 발송
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
| 시청 일시 | Takeout JSON | `time` 필드 |
| 영상 제목 | Takeout JSON | `title` 필드 ("Watched ..." 형태) |
| 영상 URL | Takeout JSON | `titleUrl` 필드 |
| 채널 정보 | Takeout JSON | `subtitles` 필드 |
| 카테고리 | LLM 분류 | 제목 기반으로 분류 |
| 요약 (optional) | LLM 생성 | 영상 내용 요약 |

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
