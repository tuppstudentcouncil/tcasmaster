import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const adminControls = document.querySelector(".share-banner");

function hideAdminControls() {
  if (!adminControls) return;
  adminControls.hidden = true;
}

function showAdminControls() {
  if (!adminControls) return;
  adminControls.hidden = false;
}

hideAdminControls();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hideAdminControls();
    return;
  }

  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (tokenResult.claims.admin === true) {
      showAdminControls();
    } else {
      hideAdminControls();
    }
  } catch (error) {
    console.warn("ตรวจสอบสิทธิ์ Portfolio ไม่สำเร็จ", error);
    hideAdminControls();
  }
});
