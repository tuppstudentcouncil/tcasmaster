const body = document.body;
const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

document.querySelectorAll('[data-route]').forEach((button) => {
  button.addEventListener('click', () => { window.location.href = button.dataset.route; });
});

document.querySelectorAll('.activity-card').forEach((card) => {
  card.addEventListener('click', () => { window.location.href = 'activities.html'; });
});

document.querySelectorAll('[data-friend-result]').forEach((card) => {
  card.addEventListener('click', () => { window.location.href = `pathfinder-result.html?friend=${encodeURIComponent(card.dataset.friendResult)}`; });
});

document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    if (link.classList.contains('nav-menu-trigger')) return;
    document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
    document.querySelector('.main-nav')?.classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelector('.menu-toggle')?.addEventListener('click', (event) => {
  const menu = document.querySelector('.main-nav');
  const open = menu.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('[data-carousel]').forEach((button) => {
  button.addEventListener('click', () => {
    const track = document.querySelector(`[data-carousel-track="${button.dataset.carousel}"]`);
    track?.scrollBy({ left: Number(button.dataset.dir) * (track.clientWidth * 0.72), behavior: 'smooth' });
  });
});

const backdrop = document.querySelector('[data-modal-layer]');
const modalTitle = document.querySelector('#modal-title');
const modalCopy = document.querySelector('.modal p');
const modalChoices = document.querySelectorAll('[data-modal-choice]');

function openModal(kind = 'dream') {
  if (kind === 'login') {
    modalTitle.textContent = 'ยินดีต้อนรับกลับมา';
    modalCopy.textContent = 'เข้าสู่ระบบเพื่อบันทึกแผนการเรียนและติดตามพอร์ตของคุณ';
    modalChoices[0].textContent = 'เข้าสู่ระบบด้วยอีเมล';
    modalChoices[1].textContent = 'เข้าสู่ระบบด้วย Google';
    modalChoices[2].textContent = 'สร้างบัญชีใหม่';
  } else {
    modalTitle.textContent = 'ค้นหาเส้นทางของคุณ';
    modalCopy.textContent = 'เลือกหมวดที่อยากเริ่มต้น แล้ว TCAS Master จะพาคุณไปต่อ';
    modalChoices[0].textContent = 'วิเคราะห์ Portfolio';
    modalChoices[1].textContent = 'ค้นหาคณะที่ใช่';
    modalChoices[2].textContent = 'วางแผนการสอบ';
  }
  modalChoices.forEach((choice) => choice.classList.remove('selected'));
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
}

document.querySelectorAll('[data-modal]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.modal === 'login') {
    window.location.href = 'login.html';
    return;
  }
  openModal(button.dataset.modal);
}));
document.querySelector('.modal-close')?.addEventListener('click', closeModal);
backdrop?.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
modalChoices.forEach((choice) => choice.addEventListener('click', () => {
  modalChoices.forEach((item) => item.classList.remove('selected'));
  choice.classList.add('selected');
}));
document.querySelector('.modal-submit')?.addEventListener('click', () => {
  const selected = document.querySelector('.modal-options .selected');
  if (!selected) return showToast('เลือกหมวดที่สนใจก่อนเริ่มต้นนะ');
  if (selected.dataset.modalChoice === 'portfolio') {
    window.location.href = 'analyze.html';
    return;
  }
  closeModal();
  showToast(`เริ่มต้น${selected.textContent.trim()}แล้ว ✦`);
});

function closeModal() {
  backdrop?.classList.remove('open');
  backdrop?.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
