---
name: yt
description: YouTube 시청 기록 수집, 분석, 인사이트 생성
user_invocable: true
arguments:
  - name: command
    description: "scrape | enrich | digest | (없으면 전체 실행)"
    required: false
---

# YouTube Digest 스킬

시청 기록을 수집하고 분석하여 주간 인사이트를 생성합니다.

## 사용법

- `/yt` - 전체 파이프라인 실행 (scrape → enrich → digest)
- `/yt scrape` - 시청 기록 스크래핑만
- `/yt enrich` - 영상별 상세 정보 추가 (카테고리, 요약)
- `/yt digest` - 주간 인사이트 생성

## 실행 지침

### 인자 파싱

args가 있으면 command로 사용. 없으면 전체 실행.

### command: scrape

1. playwriter 세션 확인 (`npx playwriter session list`)
2. 세션 없으면 사용자에게 `npx playwriter session new` 실행 요청
3. 세션 있으면 스크래핑 스크립트 실행:
   ```bash
   npx playwriter -s <session> -e "$(cat src/scrape-history.js)" --timeout 180000
   ```
4. 결과: `data/history-YYYY-MM-DD.json` 생성

### command: enrich

1. 가장 최근 `data/history-*.json` 파일 찾기
2. 각 영상에 대해:
   - `category` 없으면 → 제목+채널 기반으로 카테고리 분류
   - `summary` 없으면 → 제목 기반 1줄 요약 생성
   - (선택) YouTube Data API로 description 가져오기
3. JSON 파일 업데이트

**카테고리 목록** (LLM이 판단):
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

### command: digest

1. 가장 최근 `data/history-*.json` 파일 읽기
2. enrich가 안 되어 있으면 먼저 enrich 실행
3. 주간 인사이트 생성:
   - 총 시청 시간 계산
   - 카테고리별 분포
   - 완료율 통계
   - 인사이트 문장 생성
4. `data/weekly-YYYY-WNN.json` 저장

### command: (없음) - 전체 실행

1. scrape 실행
2. enrich 실행
3. digest 실행

## 데이터 파일 위치

- 스크래핑 결과: `data/history-YYYY-MM-DD.json`
- 주간 인사이트: `data/weekly-YYYY-WNN.json`
- 스크래핑 스크립트: `src/scrape-history.js`

## 주의사항

- scrape는 playwriter 세션이 필요 (Chrome 확장 프로그램)
- enrich/digest는 세션 없이 실행 가능
- 이미 처리된 영상은 스킵 (category/summary 있으면)
