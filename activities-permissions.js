import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrl = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : window.location.origin;
const activityList = document.querySelector("[data-activity-list]");
const openButton = document.querySelector("[data-open-activity-admin]");
const modal = document.querySelector("[data-activity-admin-modal]");
const closeButton = document.querySelector("[data-close-activity-admin]");
const form = document.querySelector("[data-activity-admin-form]");
const status = document.querySelector("[data-activity-admin-status]");
let currentUser = null;
let isAdmin = false;

const categoryLabels = {
  medical: "🩺 แพทย์ & สุขภาพ",
  engineering: "⚙️ วิศวะ & AI",
  science: "🔬 วิทยาศาสตร์ & วิจัย",
  business: "💼 บริหาร & การเงิน",
  law: "⚖️ นิติ & รัฐศาสตร์",
  design: "🎨 สถาปัตย์ & ดีไซน์",
  communication: "🎙️ นิเทศ & สื่อ",
  volunteer: "🤝 จิตอาสา & สังคม",
  openhouse: "🏛️ Open House",
  general: "🌟 ทั่วไป",
  technology: "⚙️ วิศวะ & AI",
  education: "🎓 การศึกษา",
  research: "🔬 วิจัย",
  music: "🎵 ดนตรี",
  sport: "⚽ กีฬา",
};

const posterClasses = {
  medical: "poster-theme-medical",
  engineering: "poster-theme-tech",
  science: "poster-theme-science",
  business: "poster-theme-business",
  law: "poster-theme-law",
  design: "poster-theme-design",
  communication: "poster-theme-comm",
  volunteer: "poster-theme-volunteer",
  openhouse: "poster-theme-openhouse",
  general: "poster-theme-general",
  technology: "poster-theme-tech",
  education: "poster-theme-medical",
  research: "poster-theme-science",
  music: "poster-theme-comm",
  sport: "poster-theme-general",
};

function setStatus(message, kind = "") {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function setModalOpen(open) {
  if (!modal || !isAdmin) return;
  modal.hidden = !open;
  modal.setAttribute("aria-hidden", String(!open));
  modal.classList.toggle("open", open);
  if (!open) setStatus("");
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createActivityCard(activity) {
  const category = activity.category || "general";
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventCard = "";
  card.dataset.firestoreId = activity.id;
  card.dataset.category = category;
  card.dataset.search = `${activity.title || ""} ${activity.description || ""} ${categoryLabels[category] || ""}`.toLowerCase();

  const isFree = activity.fee === "ฟรี" || !activity.fee;
  const feeTagClass = isFree ? "tag-fee-free" : "tag-fee-paid";

  card.innerHTML = `
    <div class="event-poster ${posterClasses[category] || "poster-theme-general"}">
      <div class="poster-badge-row">
        <span class="poster-cat-badge">${categoryLabels[category] || "🌟 กิจกรรม"}</span>
        <span class="poster-cert-badge">🏆 มีเกียรติบัตร</span>
      </div>
      <div class="poster-bottom-info">
        <div class="poster-organizer-text">
          <span class="verified-icon">✓</span>
          <span>${activity.organizer || "TCAS Master Partner"}</span>
        </div>
      </div>
      <i class="poster-watermark">CAMP</i>
    </div>
    <div class="event-body">
      <div class="event-tags-row">
        <span class="tag-pill tag-format">🏫 ออนไซต์</span>
        <span class="tag-pill tag-grade">ม.ปลาย</span>
        <span class="tag-pill ${feeTagClass}">${activity.fee || "ฟรี"}</span>
      </div>
      <h3>${activity.title || "กิจกรรมใหม่"}</h3>
      <p>${activity.description || "รายละเอียดกิจกรรมจะแจ้งให้ทราบเร็ว ๆ นี้"}</p>
      <div class="event-meta-box">
        <div>
          <span>📅 วันจัดกิจกรรม:</span>
          <strong>${activity.date || "เร็ว ๆ นี้"}</strong>
        </div>
        <div>
          <span>💰 ค่าใช้จ่าย:</span>
          <strong>${activity.fee || "ฟรี"}</strong>
        </div>
      </div>
      <div class="event-card-actions">
        <button class="btn-card-detail" type="button">🔍 ดูรายละเอียด</button>
        <a class="btn-card-camphub" href="${activity.registrationUrl || 'https://camphub.in.th'}" target="_blank" rel="noopener noreferrer">🔗 สมัคร</a>
      </div>
    </div>
  `;

  const detailBtn = card.querySelector(".btn-card-detail");
  detailBtn.addEventListener("click", () => {
    if (activity.registrationUrl) {
      try {
        const url = new URL(activity.registrationUrl, window.location.origin);
        if (["http:", "https:"].includes(url.protocol)) window.open(url.href, "_blank", "noopener,noreferrer");
      } catch {
        showActivityMessage("ลิงก์สมัครไม่ถูกต้อง");
      }
    } else {
      showActivityMessage(`เปิดดูรายละเอียด ${activity.title}`);
    }
  });

  return card;
}

function showActivityMessage(message) {
  const toast = document.querySelector("[data-activity-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

async function getAdminToken() {
  if (!currentUser || !isAdmin) throw new Error("บัญชีนี้ไม่มีสิทธิ์ Admin");
  await getIdTokenResult(currentUser, true);
  return currentUser.getIdToken();
}

async function loadSavedActivities() {
  if (!activityList || !currentUser) return;
  activityList.querySelectorAll("[data-firestore-id]").forEach((card) => card.remove());

  try {
    let result;
    try {
      result = await getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc")));
    } catch {
      result = await getDocs(collection(db, "activities"));
    }

    const activities = result.docs.map((item) => ({ id: item.id, ...item.data() }));
    activities.reverse().forEach((activity) => activityList.prepend(createActivityCard(activity)));
    window.bluePenguinRefreshActivities?.();
  } catch (error) {
    console.warn("โหลดกิจกรรมจาก Firestore ไม่สำเร็จ", error);
  }
}

openButton?.addEventListener("click", () => setModalOpen(true));
closeButton?.addEventListener("click", () => setModalOpen(false));
modal?.addEventListener("click", (event) => {
  if (event.target === modal) setModalOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setModalOpen(false);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin) return;

  const submitButton = form.querySelector("button[type=submit]");
  submitButton.disabled = true;
  setStatus("กำลังบันทึกกิจกรรม...", "pending");

  try {
    const token = await getAdminToken();
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`${apiBaseUrl}/api/admin/activities`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "เพิ่มกิจกรรมไม่สำเร็จ");

    form.reset();
    form.elements.fee.value = "ฟรี";
    setModalOpen(false);
    showActivityMessage("เพิ่มกิจกรรมสำเร็จแล้ว");
    await loadSavedActivities();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

openButton.hidden = true;
modal.hidden = true;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = false;
  openButton.hidden = true;
  modal.hidden = true;

  if (!user) return;

  try {
    const tokenResult = await getIdTokenResult(user, true);
    isAdmin = tokenResult.claims.admin === true;
    openButton.hidden = !isAdmin;
    modal.hidden = !isAdmin;
    await loadSavedActivities();
  } catch (error) {
    console.warn("ตรวจสอบสิทธิ์กิจกรรมไม่สำเร็จ", error);
  }
});
