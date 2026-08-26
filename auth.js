const authConfig = window.BLUE_PENGUIN_AUTH_CONFIG || {};
const googleClientId = authConfig.googleClientId || '';
const authApiBaseUrl = (authConfig.apiBaseUrl || '').replace(/\/$/, '');
let googleIdTokenInMemory = '';

const authMessage = document.querySelector('[data-auth-message]');
const tokenStatus = document.querySelector('[data-token-status]');
const googleButton = document.querySelector('#google-button');
const fallbackButton = document.querySelector('[data-google-fallback]');

function setAuthMessage(message, kind = '') {
  authMessage.textContent = message;
  authMessage.dataset.kind = kind;
}

function setTokenStatus(message, active = false) {
  tokenStatus.textContent = message;
  tokenStatus.parentElement.classList.toggle('active', active);
}

function isConfigured() {
  return googleClientId && !googleClientId.startsWith('PASTE_YOUR_');
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(payload).split('').map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join('')));
  } catch {
    return null;
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function handleGoogleCredential(response) {
  // response.credential is a Google OpenID Connect ID token (JWT).
  // Keep it in memory until a backend verifies it; do not treat decoded claims as proof.
  googleIdTokenInMemory = response.credential;
  setAuthMessage('กำลังตรวจสอบบัญชี Google...', 'pending');
  setTokenStatus('ได้รับ Google ID token แล้ว กำลังส่งให้ระบบตรวจสอบ', true);

  if (!authApiBaseUrl) {
    const preview = decodeJwtPayload(googleIdTokenInMemory);
    sessionStorage.setItem('bluePenguinGooglePreview', JSON.stringify({ name: preview?.name || '', email: preview?.email || '', picture: preview?.picture || '' }));
    setAuthMessage('รับ token สำเร็จ (โหมดตัวอย่าง) — ยังไม่ได้ยืนยันผ่าน backend', 'demo');
    setTokenStatus('โหมดตัวอย่าง: token อยู่ในหน่วยความจำของหน้านี้เท่านั้น', true);
    return;
  }

  try {
    const result = await fetch(`${authApiBaseUrl}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: googleIdTokenInMemory }) });
    if (!result.ok) throw new Error('Google token verification failed');
    const session = await result.json();
    // Prefer an HttpOnly cookie from the backend. Only store non-sensitive display data here.
    sessionStorage.setItem('bluePenguinUser', JSON.stringify({ name: session.user?.name || '', email: session.user?.email || '', picture: session.user?.picture || '' }));
    setAuthMessage('เข้าสู่ระบบสำเร็จ กำลังพาไปยังหน้าแรก...', 'success');
    window.setTimeout(() => { window.location.href = 'index.html'; }, 650);
  } catch (error) {
    console.error(error);
    setAuthMessage('ไม่สามารถยืนยันบัญชีได้ กรุณาลองใหม่อีกครั้ง', 'error');
    setTokenStatus('การตรวจสอบ token ไม่สำเร็จ', false);
  }
}

async function setupGoogleLogin() {
  if (!isConfigured()) {
    googleButton.hidden = true;
    fallbackButton.hidden = false;
    setAuthMessage('กรุณาใส่ Google Client ID ใน auth-config.js ก่อนใช้งานจริง', 'demo');
    return;
  }
  try {
    await loadGoogleIdentityScript();
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential, auto_select: false, cancel_on_tap_outside: true });
    window.google.accounts.id.renderButton(googleButton, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 420, logo_alignment: 'left' });
    fallbackButton.hidden = true;
    setAuthMessage('', '');
    setTokenStatus('Google Identity Services พร้อมใช้งาน', true);
  } catch (error) {
    console.error(error);
    googleButton.hidden = true;
    fallbackButton.hidden = false;
    setAuthMessage('โหลด Google Login ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ', 'error');
  }
}

fallbackButton.addEventListener('click', () => setAuthMessage('ยังไม่ได้ตั้งค่า Google Client ID — ใส่ค่าใน auth-config.js แล้วรีโหลดหน้านี้', 'demo'));
setupGoogleLogin();
