// UI & Navigation handler for Community page
const toast = document.querySelector('[data-community-toast]');
const modal = document.querySelector('[data-community-modal]');
let timer;

document.querySelector('.menu-toggle')?.addEventListener('click', event => {
  const menu = document.querySelector('.main-nav');
  const open = menu?.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

document.querySelector('[data-my-portfolio]')?.addEventListener('click', () => notify('เข้าสู่ระบบเพื่อจัดการพอร์ตของคุณ'));
document.querySelector('[data-close-community]')?.addEventListener('click', () => {
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
});
modal?.addEventListener('click', event => {
  if (event.target === modal) {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') modal?.classList.remove('open');
});

