import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrl = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : window.location.origin;
const examList = document.querySelector("[data-exam-list]");
const openButton = document.querySelector("[data-open-exam-admin]");
const modal = document.querySelector("[data-exam-admin-modal]");
const closeButton = document.querySelector("[data-close-exam-admin]");
const form = document.querySelector("[data-exam-admin-form]");
const status = document.querySelector("[data-exam-admin-status]");
let currentUser = null;
let isAdmin = false;

const categoryLabels = {
  "a-level": "A-Level",
  tgat: "TGAT",
  general: "ทั่วไป",
};

const coverClasses = {
  "a-level": "exam-cover-a-level",
  tgat: "exam-cover-tgat",
  general: "exam-cover-general",
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
  if (!open) setStatus("");
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createStat(label, value, icon) {
  const stat = document.createElement("span");
  stat.append(
    textElement("i", "", icon),
    textElement("small", "", label),
    textElement("b", "", String(value || 0))
  );
  return stat;
}

function createExamCard(exam) {
  const category = exam.category || "general";
  const title = exam.title || "ข้อสอบจำลองใหม่";
  const description = exam.description || "รายละเอียดข้อสอบจะแจ้งให้ทราบเร็ว ๆ นี้";
  const type = exam.type || "online";
  const questionCount = exam.questionCount ?? exam.questionsCount ?? 0;

  const card = document.createElement("article");
  card.className = "exam-card";
  card.dataset.examCard = "";
  card.dataset.firestoreId = exam.id || "";
  card.dataset.category = category;
  card.dataset.type = type;
  card.dataset.search = `${title} ${description} ${categoryLabels[category] || category}`.toLowerCase();

  const cover = document.createElement("div");
  cover.className = `exam-cover ${coverClasses[category] || coverClasses.general}`;
  cover.append(
    textElement("span", "", categoryLabels[category] || "MOCK EXAM"),
    textElement("strong", "", title),
    textElement("small", "", type === "pdf" ? "PDF DOCUMENT" : "ONLINE EXAM"),
    textElement("i", "", category === "tgat" ? "TGAT" : "TEST")
  );

  const body = document.createElement("div");
  body.className = "exam-card-body";
  body.appendChild(textElement("p", "", description));

  const stats = document.createElement("div");
  stats.className = "exam-stats";
  stats.append(
    createStat("ข้อ", questionCount, "▧"),
    createStat("นาที", exam.duration, "◷"),
    createStat("คะแนน", exam.score, "♕"),
    createStat("ครั้งที่ทำ", exam.attemptCount, "♙")
  );
  body.appendChild(stats);

  const startButton = document.createElement("button");
  startButton.className = "btn exam-start";
  startButton.type = "button";
  startButton.dataset.startExam = exam.id || "";
  startButton.innerHTML = "เริ่มทำข้อสอบ <span>›</span>";
  body.appendChild(startButton);
  card.append(cover, body);
  return card;
}

async function getUserToken() {
  if (!currentUser) throw new Error("กรุณาเข้าสู่ระบบก่อนดูข้อสอบเพิ่มเติม");
  return currentUser.getIdToken();
}

async function loadSavedMockExams() {
  if (!examList || !currentUser) return;
  examList.querySelectorAll("[data-firestore-id]").forEach((card) => card.remove());

  try {
    const token = await getUserToken();
    const response = await fetch(`${apiBaseUrl}/api/mock-exams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "โหลดข้อสอบไม่สำเร็จ");

    (result.exams || []).slice().reverse().forEach((exam) => {
      examList.prepend(createExamCard(exam));
    });
    window.bluePenguinRefreshMockExams?.();
  } catch (error) {
    console.warn("โหลดข้อสอบจากเซิร์ฟเวอร์ไม่สำเร็จ", error);
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
  setStatus("กำลังบันทึกข้อสอบ...", "pending");

  try {
    await getIdTokenResult(currentUser, true);
    const token = await currentUser.getIdToken();
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`${apiBaseUrl}/api/admin/mock-exams`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "เพิ่มข้อสอบไม่สำเร็จ");

    form.reset();
    form.elements.questionCount.value = "1";
    form.elements.duration.value = "60";
    form.elements.score.value = "100";
    setModalOpen(false);
    const toast = document.querySelector("[data-exam-toast]");
    if (toast) {
      toast.textContent = "เพิ่มข้อสอบสำเร็จแล้ว";
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 2600);
    }
    await loadSavedMockExams();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

if (openButton) openButton.hidden = true;
if (modal) modal.hidden = true;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = false;
  if (openButton) openButton.hidden = true;
  if (modal) modal.hidden = true;
  if (!user) return;

  try {
    const tokenResult = await getIdTokenResult(user, true);
    isAdmin = tokenResult.claims.admin === true;
    if (openButton) openButton.hidden = !isAdmin;
    if (modal) modal.hidden = !isAdmin;
    await loadSavedMockExams();
  } catch (error) {
    console.warn("ตรวจสอบสิทธิ์ข้อสอบไม่สำเร็จ", error);
  }
});
