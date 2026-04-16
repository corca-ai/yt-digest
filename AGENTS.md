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

## 프로젝트 구조

```
youtube-digest/
├── src/
│   └── scrape-history.js    # playwriter 스크래핑 스크립트
├── data/
│   ├── history-YYYY-MM-DD.json  # 일별 시청 기록
│   └── weekly-YYYY-WNN.json     # 주간 인사이트
├── dashboard/                   # 정적 대시보드 (TODO)
├── SPEC.md                      # 상세 스펙
├── AGENTS.md                    # 이 파일
└── CLAUDE.md                    # AGENTS.md 심링크
```

## 데이터 흐름

1. **scrape**: playwriter로 YouTube 히스토리 + My Activity 스크래핑
2. **enrich**: LLM이 카테고리 분류, 1줄 요약 생성
3. **digest**: 여러 영상 기반 주간 인사이트 생성
4. **dashboard**: JSON 읽어서 시각화 (별도)

## 의존성

- playwriter (npm 전역 설치)
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
