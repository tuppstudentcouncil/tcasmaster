import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const newReviewButton = document.querySelector("[data-open-review]");
const reviewModal = document.querySelector("[data-review-modal]");

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

function hideAdminReviewControls() {
  if (newReviewButton && !isLocal) newReviewButton.hidden = true;
  if (reviewModal && !isLocal) reviewModal.hidden = true;
}

function showAdminReviewControls() {
  if (newReviewButton) newReviewButton.hidden = false;
  if (reviewModal) reviewModal.hidden = false;
}

if (!isLocal) {
  hideAdminReviewControls();
} else {
  showAdminReviewControls();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (!isLocal) hideAdminReviewControls();
    return;
  }

  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (tokenResult.claims.admin === true || isLocal) {
      showAdminReviewControls();
    } else {
      hideAdminReviewControls();
    }
  } catch (error) {
    console.warn("ตรวจสอบสิทธิ์เขียนรีวิวไม่สำเร็จ", error);
    if (!isLocal) hideAdminReviewControls();
  }
});

