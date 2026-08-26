const ICON_PATHS = {
  ai: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m19 14 .6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z"/><path d="M5 15v4M3 17h4"/>',
  test: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 9h8M8 13l1.8 1.8L13 11.5M8 17h5"/>',
  guide: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/>',
  plan: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 14l2 2 5-5"/>',
  language: '<circle cx="7" cy="4.2" r="1.1" fill="currentColor" stroke="none"/><path d="M3 7.5h8"/><path d="m4.5 15 6-6.5"/><path d="m9.5 15-6-6.5"/><path d="m14 20.5 3.5-9.5 3.5 9.5"/><path d="M15.2 16.5h4.6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/>',
  chart: '<path d="M4 19V5m0 14h16"/><path d="m7 15 3-4 3 2 5-7"/>',
  exam: '<path d="M6 3h12a2 2 0 0 1 2 2v14H4V5a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  activity: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 13h2M14 13h2M8 17h2"/>',
  community: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 17a4.5 4.5 0 0 1 6.5 3"/>',
  portfolio: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3h8v2M7 11h10M9 15h6"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 13h2M14 13h2M8 17h2"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  upload: '<path d="M12 16V4M8 8l4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  school: '<path d="m3 10 9-6 9 6-9 6-9-6Z"/><path d="M7 13v5c3 2 7 2 10 0v-5M21 10v6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  file: '<path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.1 1Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'
};

function createUiIcon(name) {
  const icon = document.createElement('span');
  icon.className = `ui-icon ui-icon-${name}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${ICON_PATHS[name] || ICON_PATHS.star}</svg>`;
  return icon;
}

document.querySelectorAll('.main-nav .nav-link').forEach((link, index) => {
  link.childNodes.forEach((node) => { if (node.nodeType === Node.TEXT_NODE) node.textContent = node.textContent.replace('⌂', ''); });
});
document.querySelectorAll('.main-nav .nav-link > span').forEach((element) => {
  element.className = 'nav-chevron';
  element.replaceChildren(createUiIcon('chevron-down'));
});

document.querySelectorAll('.main-nav .nav-link').forEach((link, index) => {
  if ([...link.children].some((child) => child.classList.contains('ui-icon'))) return;
  const names = ['home', 'chart', 'exam', 'activity', 'community'];
  link.prepend(createUiIcon(names[index] || 'home'));
});

const NAV_MENU_CONFIG = {
  analyze: [
    { href: 'analyze.html', icon: 'chart', title: 'วิเคราะห์พอร์ต', copy: 'วิเคราะห์ Portfolio ด้วย AI' },
    { href: 'pathfinder.html', icon: 'community', title: 'ค้นหาเส้นทาง', copy: 'ค้นพบเส้นทาง TCAS ที่เหมาะกับคุณ' },
  ],
  exam: [
    { href: 'mock-exam.html', icon: 'exam', title: 'ข้อสอบจำลอง', copy: 'ฝึกก่อนลงสนามจริง' },
    { href: 'calendar.html', icon: 'calendar', title: 'ปฏิทินมหาลัย', copy: 'ติดตามกำหนดการและ deadline' },
  ],
  activities: [
    { href: 'activities.html', icon: 'activity', title: 'กิจกรรมและค่าย', copy: 'ค้นหาค่ายและโอกาสใหม่ ๆ' },
    { href: 'calendar.html', icon: 'calendar', title: 'ปฏิทินมหาลัย', copy: 'วางแผนรอบสมัครของคุณ' },
  ],
  community: [
    { href: 'community.html', icon: 'portfolio', title: 'ชุมชนและพอร์ต', copy: 'แชร์พอร์ตและหาแรงบันดาลใจ' },
    { href: 'reviews.html', icon: 'trophy', title: 'รีวิวแข่งขัน', copy: 'เรียนรู้จากประสบการณ์รุ่นพี่' },
  ],
};

function navMenuCategory(link) {
  const href = link.getAttribute('href') || '';
  if (href.includes('analyze') || href.includes('pathfinder') || href.includes('#toolbox')) return 'analyze';
  if (href.includes('mock-exam') || href.includes('roadmap')) return 'exam';
  if (href.includes('activities') || href.includes('#activities')) return 'activities';
  if (href.includes('community') || href.includes('reviews') || href.includes('#community')) return 'community';
  return '';
}

function closeNavMenus(except = null) {
  document.querySelectorAll('.nav-menu-wrap.is-open').forEach((wrap) => {
    if (wrap === except) return;
    wrap.classList.remove('is-open');
    wrap.querySelector('.nav-menu-trigger')?.setAttribute('aria-expanded', 'false');
  });
}

document.querySelectorAll('.main-nav .nav-link').forEach((link) => {
  const category = navMenuCategory(link);
  const items = NAV_MENU_CONFIG[category];
  if (!items || link.closest('.nav-menu-wrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'nav-menu-wrap';
  link.parentNode.insertBefore(wrap, link);
  wrap.append(link);
  link.classList.add('nav-menu-trigger');
  link.setAttribute('aria-haspopup', 'menu');
  link.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  menu.setAttribute('role', 'menu');
  items.forEach((item) => {
    const entry = document.createElement('a');
    entry.className = 'nav-menu-item';
    entry.href = item.href;
    entry.setAttribute('role', 'menuitem');
    const head = document.createElement('span');
    head.className = 'nav-menu-item-head';
    head.append(createUiIcon(item.icon));
    const title = document.createElement('strong');
    title.textContent = item.title;
    head.append(title);
    const copy = document.createElement('small');
    copy.textContent = item.copy;
    entry.append(head, copy);
    menu.append(entry);
  });
  wrap.append(menu);

  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = !wrap.classList.contains('is-open');
    closeNavMenus(wrap);
    wrap.classList.toggle('is-open', open);
    link.setAttribute('aria-expanded', String(open));
  });
});

document.addEventListener('click', () => closeNavMenus());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeNavMenus(); });

document.querySelectorAll('.tool-card .tool-icon').forEach((element, index) => {
  const names = ['ai', 'test', 'guide', 'trophy', 'plan', 'portfolio'];
  element.replaceChildren(createUiIcon(names[index] || 'star'));
});

document.querySelectorAll('.section-kicker').forEach((element) => {
  const original = element.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  const lower = original.toLowerCase();
  const name = lower.includes('review') || original.includes('การแข่งขัน') ? 'trophy' : lower.includes('portfolio') ? 'portfolio' : lower.includes('activity') || original.includes('กิจกรรม') ? 'activity' : 'star';
  element.textContent = original;
  element.prepend(createUiIcon(name));
});

document.querySelectorAll('.panel-icon').forEach((element) => element.replaceChildren(createUiIcon('calendar')));
document.querySelectorAll('.mini-icon').forEach((element, index) => element.replaceChildren(createUiIcon(index === 0 ? 'star' : 'community')));

document.querySelectorAll('.analyze-icon').forEach((element) => element.replaceChildren(createUiIcon('upload')));
document.querySelectorAll('.analysis-notice > span').forEach((element) => element.replaceChildren(createUiIcon('info')));
document.querySelectorAll('.upload-symbol').forEach((element) => element.replaceChildren(createUiIcon('upload')));
document.querySelectorAll('.ready-icon').forEach((element) => element.replaceChildren(createUiIcon('file')));
document.querySelectorAll('.activity-search > span, .reviews-search > span, .search-box > span, .calendar-search > span').forEach((element) => element.replaceChildren(createUiIcon('search')));
document.querySelectorAll('.activity-filter').forEach((element, index) => { const names = ['star', 'portfolio', 'chart', 'activity', 'portfolio', 'school', 'trophy', 'community', 'activity', 'activity']; const label = element.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim(); element.textContent = label; element.prepend(createUiIcon(names[index] || 'star')); });
document.querySelectorAll('.exam-tab').forEach((element, index) => { const label = element.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim(); element.textContent = label; element.prepend(createUiIcon(index === 0 ? 'exam' : 'file')); });
document.querySelectorAll('.category-btn > span').forEach((element, index) => element.replaceChildren(createUiIcon(index === 0 ? 'filter' : 'exam')));
document.querySelectorAll('.benefit-icon').forEach((element, index) => element.replaceChildren(createUiIcon(['chart', 'activity', 'star'][index] || 'star')));
document.querySelectorAll('.reviews-badge').forEach((element) => { const label = element.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim(); element.textContent = label; element.prepend(createUiIcon('trophy')); });
document.querySelectorAll('.login-btn').forEach((element) => { const label = element.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim(); element.textContent = label; element.prepend(createUiIcon('user')); });
document.querySelectorAll('.admin-access-link').forEach((element) => element.remove());
const BLUE_PENGUIN_LANGUAGE_LABELS = { th: 'TH', en: 'EN' };
function syncLanguageTrigger(trigger, language) {
  const selected = language === 'en' ? 'en' : 'th';
  const icon = trigger.querySelector('.ui-icon-language') || createUiIcon('language');
  const span = document.createElement('span');
  span.className = 'language-text';
  span.textContent = BLUE_PENGUIN_LANGUAGE_LABELS[selected];
  trigger.replaceChildren(icon, span);
  trigger.dataset.currentLanguage = selected;
  trigger.setAttribute('aria-label', selected === 'en' ? 'Change language (English)' : 'เปลี่ยนภาษา (ไทย)');
}
function syncLanguageControls(language) {
  document.querySelectorAll('.language-trigger').forEach((trigger) => syncLanguageTrigger(trigger, language));
  document.querySelectorAll('.language-menu [data-language]').forEach((option) => {
    option.setAttribute('aria-checked', String(option.dataset.language === (language === 'en' ? 'en' : 'th')));
  });
}
document.querySelectorAll('.language-btn').forEach((element) => {
  element.removeAttribute('data-toast');
  const switcher = document.createElement('div');
  switcher.className = 'language-switcher';
  element.parentNode.insertBefore(switcher, element);
  switcher.append(element);
  element.classList.add('language-trigger');
  element.setAttribute('aria-haspopup', 'menu');
  element.setAttribute('aria-expanded', 'false');
  syncLanguageTrigger(element, localStorage.getItem('blue-penguin-language') || 'th');

  const menu = document.createElement('div');
  menu.className = 'language-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = '<button type="button" role="menuitemradio" data-language="th">ไทย <span class="language-check">✓</span></button><button type="button" role="menuitemradio" data-language="en">English <span class="language-check">✓</span></button>';
  switcher.append(menu);
  syncLanguageControls(localStorage.getItem('blue-penguin-language') || 'th');

  element.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = switcher.classList.toggle('is-open');
    element.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('[data-language]').forEach((option) => option.addEventListener('click', (event) => {
    const selected = event.currentTarget.dataset.language;
    syncLanguageControls(selected);
    switcher.classList.remove('is-open');
    element.setAttribute('aria-expanded', 'false');
    syncLanguageTrigger(element, selected);
    document.documentElement.lang = selected === 'en' ? 'en' : 'th';
    localStorage.setItem('blue-penguin-language', selected);
    window.dispatchEvent(new CustomEvent('bluepenguin:language', { detail: { language: selected } }));
  }));
});
window.addEventListener('bluepenguin:language', (event) => syncLanguageControls(event.detail?.language || 'th'));
document.addEventListener('click', () => document.querySelectorAll('.language-switcher.is-open').forEach((switcher) => { switcher.classList.remove('is-open'); switcher.querySelector('.language-trigger')?.setAttribute('aria-expanded', 'false'); }));
if (!document.querySelector('script[data-blue-penguin-i18n]')) { const i18nScript = document.createElement('script'); i18nScript.src = 'i18n.js?v=2'; i18nScript.dataset.bluePenguinI18n = 'true'; document.head.append(i18nScript); }
if (document.querySelector('.nav-actions .login-btn') && !window.__bluePenguinSessionLoaded) { window.__bluePenguinSessionLoaded = true; import('./firebase-session.js').catch((error) => console.warn('ไม่สามารถโหลดสถานะบัญชีผู้ใช้ได้', error)); }
