// YouTube Digest Dashboard

let historyData = [];
let weeklyData = null;
let currentMonth = new Date();
let selectedDate = null;
let videosGroupedByDate = {};

// 초기화
async function init() {
  await loadData();
  groupVideosByDate();
  renderWeeklySummary();
  renderCalendar();
  renderTimeline();
  renderCategories();
  setupTabs();
  setupCalendar();
}

// 날짜별 그룹핑
function groupVideosByDate() {
  videosGroupedByDate = {};
  historyData.forEach(video => {
    const date = video.date;
    if (!videosGroupedByDate[date]) videosGroupedByDate[date] = [];
    videosGroupedByDate[date].push(video);
  });
}

// 데이터 로드
async function loadData() {
  try {
    // 인덱스 파일에서 최신 파일명 가져오기
    const indexRes = await fetch('../data/index.json');
    const index = await indexRes.json();

    const historyRes = await fetch(`../data/${index.latestHistory}`);
    historyData = await historyRes.json();

    if (index.latestWeekly) {
      const weeklyRes = await fetch(`../data/${index.latestWeekly}`);
      weeklyData = await weeklyRes.json();
    }
  } catch (e) {
    console.error('데이터 로드 실패:', e);
    console.log('data/index.json 파일이 필요합니다. README 참고.');
  }
}

// 주간 요약 렌더링
function renderWeeklySummary() {
  if (!weeklyData) return;

  const { summary, insights } = weeklyData;

  document.getElementById('total-videos').textContent = summary.total_videos + '개';
  document.getElementById('watch-time').textContent = formatHours(summary.total_watched_hours);
  document.getElementById('completion-rate').textContent = summary.completion_rate + '%';

  const insightsEl = document.getElementById('insights');
  insightsEl.innerHTML = insights
    .map(text => `<div class="insight">${text}</div>`)
    .join('');
}

// 시간 포맷
function formatHours(hours) {
  if (hours >= 1) {
    return Math.round(hours) + '시간';
  }
  return Math.round(hours * 60) + '분';
}

// 캘린더 렌더링
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // 헤더 업데이트
  document.getElementById('calendar-month').textContent = `${year}년 ${month + 1}월`;

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date().toISOString().split('T')[0];

  let html = '';

  // 빈 칸 (이전 달)
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // 날짜
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const videos = videosGroupedByDate[dateStr] || [];
    const hasVideos = videos.length > 0;
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;

    let classes = 'calendar-day';
    if (hasVideos) classes += ' has-videos';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';

    html += `
      <div class="${classes}" data-date="${dateStr}">
        <span>${day}</span>
        ${hasVideos ? `<span class="video-count">${videos.length}</span>` : ''}
      </div>
    `;
  }

  document.getElementById('calendar-days').innerHTML = html;
}

// 캘린더 이벤트 설정
function setupCalendar() {
  // 이전/다음 달 버튼
  document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  });

  // 날짜 클릭
  document.getElementById('calendar-days').addEventListener('click', (e) => {
    const dayEl = e.target.closest('.calendar-day');
    if (!dayEl || dayEl.classList.contains('empty')) return;

    const date = dayEl.dataset.date;
    selectDate(date);
  });

  // 전체 보기 버튼
  document.getElementById('show-all-dates').addEventListener('click', () => {
    selectedDate = null;
    renderCalendar();
    renderTimeline();
    document.getElementById('selected-date-info').classList.remove('active');
  });
}

// 날짜 선택
function selectDate(date) {
  selectedDate = date;
  renderCalendar();
  renderTimeline(date);

  const videos = videosGroupedByDate[date] || [];
  const infoEl = document.getElementById('selected-date-info');
  if (videos.length > 0) {
    infoEl.textContent = `${formatDate(date)} - ${videos.length}개 영상`;
    infoEl.classList.add('active');
  } else {
    infoEl.textContent = `${formatDate(date)} - 시청 기록 없음`;
    infoEl.classList.add('active');
  }
}

// 타임라인 렌더링
function renderTimeline(filterDate = null) {
  const container = document.getElementById('timeline-content');

  // 필터링
  let datesToShow;
  if (filterDate) {
    datesToShow = [filterDate];
  } else {
    datesToShow = Object.keys(videosGroupedByDate).sort().reverse();
  }

  let html = '';
  datesToShow.forEach(date => {
    const videos = videosGroupedByDate[date] || [];
    if (videos.length === 0) return;

    // 시간순 정렬 (있는 경우)
    videos.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return b.time.localeCompare(a.time);
    });

    html += `
      <div class="date-group">
        <div class="date-header">${formatDate(date)} (${videos.length}개)</div>
        ${videos.map(v => renderVideoItem(v)).join('')}
      </div>
    `;
  });

  if (!html) {
    html = '<div style="text-align:center;padding:40px;color:#999">이 날짜에 시청 기록이 없습니다</div>';
  }

  container.innerHTML = html;
}

// 날짜 포맷
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) {
    return '오늘';
  }
  if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '어제';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];

  return `${month}월 ${day}일 (${weekday})`;
}

// 비디오 아이템 렌더링
function renderVideoItem(video) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
  const progress = video.progressPercent || 0;

  return `
    <div class="video-item">
      <div class="video-thumbnail">
        <img src="${thumbnailUrl}" alt="" loading="lazy">
        <div class="video-progress" style="width: ${progress}%"></div>
        ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
      </div>
      <div class="video-info">
        <div class="video-title">
          <a href="${video.url}" target="_blank">${escapeHtml(video.title)}</a>
        </div>
        <div class="video-meta">
          ${video.time ? `<span class="time">${video.time}</span>` : ''}
          <span class="channel">${escapeHtml(video.channel || '')}</span>
        </div>
        <span class="category-tag ${video.category}">${video.category}</span>
        ${progress > 0 && progress < 100 ? `<span class="progress-text" style="margin-left:8px;font-size:0.75rem;color:#999">${progress}% 시청</span>` : ''}
      </div>
    </div>
  `;
}

// 카테고리 뷰 렌더링
function renderCategories() {
  const container = document.getElementById('category-content');

  // 카테고리별 그룹핑
  const grouped = {};
  historyData.forEach(video => {
    const cat = video.category || '기타';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(video);
  });

  // 카테고리 정렬 (개수 내림차순)
  const sortedCats = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  let html = '';
  sortedCats.forEach(cat => {
    const videos = grouped[cat];
    const totalMinutes = videos.reduce((sum, v) => {
      const duration = parseDuration(v.duration);
      const progress = (v.progressPercent || 0) / 100;
      return sum + duration * progress;
    }, 0);

    html += `
      <div class="category-group">
        <div class="category-header" onclick="toggleCategory(this)">
          <span class="category-name">${cat}</span>
          <span class="category-stats">${videos.length}개 · ${formatMinutes(totalMinutes)}</span>
        </div>
        <div class="category-videos" style="display:none">
          ${videos.map(v => renderVideoItem(v)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 카테고리 토글
function toggleCategory(header) {
  const videos = header.nextElementSibling;
  const isHidden = videos.style.display === 'none';
  videos.style.display = isHidden ? 'block' : 'none';
}

// 유틸리티
function parseDuration(d) {
  if (!d) return 0;
  const parts = d.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

function formatMinutes(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 탭 설정
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // 탭 활성화
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 뷰 전환
      const viewName = tab.dataset.view;
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`${viewName}-view`).classList.add('active');
    });
  });
}

// 시작
init();
