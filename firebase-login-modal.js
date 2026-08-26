import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const modal = document.querySelector("[data-auth-modal]");
const closeButton = document.querySelector("[data-auth-close]");
const googleButton = document.querySelector("[data-auth-google]");
const message = document.querySelector("[data-auth-modal-message]");
const successPanel = document.querySelector("[data-auth-success]");
const successAvatar = document.querySelector("[data-auth-success-avatar]");
const successName = document.querySelector("[data-auth-success-name]");
const provider = new GoogleAuthProvider();

function showMessage(text, kind = "") {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = kind;
}

function closeModal() {
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
}

closeButton?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

googleButton?.addEventListener("click", async () => {
  try {
    googleButton.disabled = true;
    showMessage("กำลังเปิด Google Account...", "pending");
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const displayName = user.displayName || user.email || "บัญชีของคุณ";

    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn("Login สำเร็จ แต่ยังบันทึกโปรไฟล์ Firestore ไม่ได้", error);
    }

    if (successAvatar && user.photoURL) {
      successAvatar.referrerPolicy = "no-referrer";
      successAvatar.crossOrigin = "anonymous";
      successAvatar.src = user.photoURL;
    }
    if (successName) successName.textContent = displayName;
    if (successPanel) successPanel.hidden = false;
    showMessage("เข้าสู่ระบบสำเร็จแล้ว", "success");
    setTimeout(closeModal, 1800);
  } catch (error) {
    console.error(error);
    const code = error?.code || "unknown";
    showMessage(`เข้าสู่ระบบไม่สำเร็จ (${code})`, "error");
    googleButton.disabled = false;
  }
});
