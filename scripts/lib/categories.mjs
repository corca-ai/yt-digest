export const categories = [
  '기술/개발',
  '비즈니스/경제',
  '엔터테인먼트',
  '음악/예배',
  '뷰티/패션',
  '먹방/요리',
  '브이로그/일상',
  '교육/자기계발',
  '뉴스/시사',
  '기타'
];

const categoryKeywords = [
  {
    name: '기술/개발',
    keywords: [
      'dev',
      'developer',
      'engineering',
      'github',
      'javascript',
      'react',
      'next.js',
      'node',
      'typescript',
      'ai',
      'llm',
      '코딩',
      '개발',
      '프로그래밍',
      '엔지니어링',
      '기술'
    ]
  },
  {
    name: '비즈니스/경제',
    keywords: [
      'business',
      'economy',
      'market',
      'finance',
      'invest',
      'stock',
      'startup',
      '경제',
      '비즈니스',
      '주식',
      '투자',
      '부동산',
      '금리',
      '창업'
    ]
  },
  {
    name: '엔터테인먼트',
    keywords: [
      'comedy',
      'funny',
      'show',
      'movie',
      'drama',
      'game',
      'gaming',
      '예능',
      '영화',
      '드라마',
      '게임',
      '웃긴',
      '리액션'
    ]
  },
  {
    name: '음악/예배',
    keywords: [
      'music',
      'worship',
      'praise',
      'choir',
      'cover',
      'concert',
      '찬양',
      '예배',
      '음악',
      'ccm',
      '연주',
      '콘서트'
    ]
  },
  {
    name: '뷰티/패션',
    keywords: [
      'beauty',
      'makeup',
      'fashion',
      'style',
      'skincare',
      '코디',
      '뷰티',
      '패션',
      '메이크업',
      '화장'
    ]
  },
  {
    name: '먹방/요리',
    keywords: [
      'recipe',
      'cooking',
      'cook',
      'food',
      'restaurant',
      '먹방',
      '요리',
      '레시피',
      '맛집',
      '식당'
    ]
  },
  {
    name: '브이로그/일상',
    keywords: [
      'vlog',
      'daily',
      'routine',
      'travel',
      'day in the life',
      '브이로그',
      '일상',
      '여행',
      '루틴',
      '하울'
    ]
  },
  {
    name: '교육/자기계발',
    keywords: [
      'study',
      'learning',
      'tutorial',
      'guide',
      'lecture',
      'book',
      '교육',
      '공부',
      '자기계발',
      '강의',
      '튜토리얼',
      '리뷰'
    ]
  },
  {
    name: '뉴스/시사',
    keywords: [
      'news',
      'breaking',
      'politics',
      'interview',
      'debate',
      '뉴스',
      '시사',
      '정치',
      '토론',
      '속보'
    ]
  }
];

function normalizeText(value) {
  return (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanTitle(title) {
  return (title ?? '').replace(/\s+/g, ' ').trim();
}

export function detectCategory(video) {
  const haystack = normalizeText(`${video.title ?? ''} ${video.channel ?? ''}`);

  for (const entry of categoryKeywords) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.name;
    }
  }

  return '기타';
}

export function buildSummary(video) {
  const title = cleanTitle(video.title);

  if (!title) {
    return video.channel ? `${video.channel} 영상` : '시청 기록';
  }

  if (video.channel && !title.toLowerCase().includes(video.channel.toLowerCase())) {
    return `${video.channel}의 ${title}`;
  }

  return title;
}

export function enrichVideos(videos) {
  let changed = 0;

  const updatedVideos = videos.map((video) => {
    let nextVideo = video;

    if (!video.category) {
      nextVideo = { ...nextVideo, category: detectCategory(video) };
      changed += 1;
    }

    if (!video.summary) {
      nextVideo = { ...nextVideo, summary: buildSummary(nextVideo) };
      changed += 1;
    }

    return nextVideo;
  });

  return { videos: updatedVideos, changed };
}
