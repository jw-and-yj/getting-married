const calendarRoot = document.querySelector('.calendar-container');

if (calendarRoot) {
  const monthLabel = calendarRoot.querySelector('.calendar__month');
  const yearLabel = calendarRoot.querySelector('.calendar__year');
  const daysContainer = calendarRoot.querySelector('.calendar__days');
  const prevButton = calendarRoot.querySelector('.btn__wrapper.prev');
  const nextButton = calendarRoot.querySelector('.btn__wrapper.next');
const seasonsSvg = calendarRoot.querySelector('#seasons');
const seasonGroups = {
  winter: seasonsSvg?.querySelector('#winter'),
  spring: seasonsSvg?.querySelector('#spring'),
  summer: seasonsSvg?.querySelector('#summer'),
  fall: seasonsSvg?.querySelector('#fall')
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

  const SEASON_BY_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];

  const today = new Date(2026, 2, 8); // 예식 날짜로 고정
  let current = new Date(today.getFullYear(), today.getMonth(), 1);

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function buildDayCell(day, { muted = false, isToday = false } = {}) {
    const link = document.createElement('a');
    link.href = '#';
    link.addEventListener('click', (event) => event.preventDefault());
    if (muted) link.classList.add('is-muted');
    if (isToday) link.classList.add('today');

    const wrapper = document.createElement('span');
    wrapper.className = 'calendar__day';

    const number = document.createElement('span');
    number.className = 'calendar__day__number';
    number.textContent = day;

    wrapper.appendChild(number);
    link.appendChild(wrapper);

    return link;
  }

  function clearSeasonState() {
    if (!seasonsSvg) return;
    seasonsSvg.querySelectorAll('.season-active').forEach((node) => {
      node.classList.remove('season-active');
    });
  }

  function activateSeason(monthIndex) {
    if (!seasonsSvg) return;
    clearSeasonState();
  const seasonKey = SEASON_BY_MONTH[((monthIndex % 12) + 12) % 12];
  const target = seasonGroups[seasonKey];
  if (target) {
    target.classList.add('season-active');
  }
}

  function renderCalendar() {
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevMonthDays = getDaysInMonth(year, month - 1);

    monthLabel.textContent = MONTH_NAMES[month];
    yearLabel.textContent = String(year);

    const fragment = document.createDocumentFragment();

    // leading muted days
    for (let i = firstDayIndex; i > 0; i -= 1) {
      fragment.appendChild(buildDayCell(prevMonthDays - i + 1, { muted: true }));
    }

    // current month days
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      fragment.appendChild(buildDayCell(day, { isToday }));
    }

    // trailing muted days to complete grid
    const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    const trailing = totalCells - (firstDayIndex + daysInMonth);
    for (let day = 1; day <= trailing; day += 1) {
      fragment.appendChild(buildDayCell(day, { muted: true }));
    }

    daysContainer.innerHTML = '';
    daysContainer.appendChild(fragment);

    activateSeason(month);
  }

  function changeMonth(step) {
    current.setMonth(current.getMonth() + step, 1);
    renderCalendar();
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => changeMonth(-1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => changeMonth(1));
  }

  renderCalendar();
  calendarRoot.classList.add('calendar-ready');
}
