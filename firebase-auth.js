import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

const loginButton = document.querySelector("[data-google-fallback]");
const message = document.querySelector("[data-auth-message]");
const tokenStatus = document.querySelector("[data-token-status]");
const loginTitle = document.querySelector("#login-card-title");
const consentModal = document.querySelector("[data-consent-modal]");
const consentOptions = [...document.querySelectorAll("[data-consent-toggle]")];
const consentAccept = document.querySelector("[data-consent-accept]");
let loginInProgress = false;
let consentUser = null;

const provider = new GoogleAuthProvider();

function showMessage(text, type = "") {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = type;
}

function getFriendlyAuthMessage(error) {
  const messages = {
    "auth/invalid-api-key": "ค่า Firebase API Key ไม่ถูกต้อง กรุณาตรวจสอบ firebase-config.js",
    "auth/unauthorized-domain": "โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication",
    "auth/operation-not-allowed": "ยังไม่ได้เปิดใช้งาน Google ใน Firebase Authentication",
    "auth/popup-blocked": "เบราว์เซอร์บล็อกหน้าต่าง Google Login กรุณาอนุญาตป๊อปอัปแล้วลองใหม่",
    "auth/popup-closed-by-user": "ปิดหน้าต่าง Google Login ก่อนเข้าสู่ระบบเสร็จ",
    "auth/network-request-failed": "เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต",
    "auth/invalid-credential": "ข้อมูลรับรอง Google ไม่ถูกต้อง กรุณาลองเข้าสู่ระบบใหม่"
  };
  return messages[error?.code] || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
}

function consentStorageKey(user) {
  return `bluePenguinConsent:${user.uid}`;
}

function hasAcceptedConsent(user) {
  return Boolean(user && localStorage.getItem(consentStorageKey(user)) === "accepted");
}

function updateConsentButton() {
  const accepted = consentOptions.length > 0 && consentOptions.every((option) => option.getAttribute("aria-pressed") === "true");
  if (consentAccept) consentAccept.disabled = !accepted;
}

function openConsentModal(user) {
  if (!consentModal) return;
  consentUser = user;
  consentModal.hidden = false;
  updateConsentButton();
}

function closeConsentModal() {
  if (consentModal) consentModal.hidden = true;
}

consentOptions.forEach((option) => option.addEventListener("click", (event) => {
  if (event.target.closest("a")) return;
  const pressed = option.getAttribute("aria-pressed") === "true";
  option.setAttribute("aria-pressed", String(!pressed));
  option.classList.toggle("is-checked", !pressed);
  updateConsentButton();
}));

document.querySelectorAll("[data-consent-link]").forEach((link) => link.addEventListener("click", (event) => {
  event.stopPropagation();
}));

consentAccept?.addEventListener("click", () => {
  if (!consentUser || consentAccept.disabled) return;
  localStorage.setItem(consentStorageKey(consentUser), "accepted");
  closeConsentModal();
  loginInProgress = false;
  window.location.replace("index.html");
});

loginButton?.addEventListener("click", async () => {
  try {
    loginInProgress = true;
    loginButton.disabled = true;
    showMessage("กำลังเข้าสู่ระบบ...", "pending");

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (profileError) {
      console.warn("เข้าสู่ระบบสำเร็จ แต่ยังบันทึกโปรไฟล์ลง Firestore ไม่ได้", profileError);
    }

    const displayName = user.displayName || user.email || "บัญชีของคุณ";
    if (loginTitle) loginTitle.textContent = "ยืนยันการเริ่มใช้งาน";
    if (tokenStatus) tokenStatus.textContent = `เข้าสู่ระบบด้วยบัญชี ${displayName} แล้ว`;
    if (loginButton) {
      loginButton.textContent = `✓ ${displayName}`;
      loginButton.disabled = true;
    }

    showMessage(`ยินดีต้อนรับ ${displayName} — กรุณายืนยันเงื่อนไขก่อนเริ่มใช้งาน`, "success");
    if (hasAcceptedConsent(user)) {
      loginInProgress = false;
      window.location.replace("index.html");
      return;
    }
    openConsentModal(user);

  } catch (error) {
    loginInProgress = false;
    if (loginButton) loginButton.disabled = false;
    console.error(error);
    showMessage(getFriendlyAuthMessage(error), "error");
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("ผู้ใช้ปัจจุบัน:", user.uid);
    if (!loginInProgress && window.location.pathname.endsWith("/login.html")) {
      if (hasAcceptedConsent(user)) {
        window.location.replace("index.html");
      } else {
        loginInProgress = true;
        openConsentModal(user);
      }
    }
  }
});

export async function logout() {
  await signOut(auth);
}
