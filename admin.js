import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import {
  getPortfolios,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
  reorderPortfolios,
  getReviews,
  deleteReview,
  reorderReviews,
} from "./firebase-data.js";
import { uploadPortfolioFile } from "./firebase-storage.js";
import { renderPdfPage1Thumbnail, TCASPdfViewer } from "./pdf-viewer.js";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrl = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : null;
const guard = document.querySelector("[data-admin-guard]");
const panel = document.querySelector("[data-admin-panel]");
const form = document.querySelector("[data-portfolio-form]");
const status = document.querySelector("[data-admin-status]");
const list = document.querySelector("[data-admin-portfolio-list]");
const adminReviewList = document.querySelector("[data-admin-review-list]");
const adminReviewEmpty = document.querySelector("[data-admin-review-empty]");
const refreshButton = document.querySelector("[data-refresh-portfolios]");
const toggleDeleteModeButton = document.querySelector("[data-toggle-delete-mode]");
const deleteSelectedButton = document.querySelector("[data-delete-selected]");
const selectedCount = document.querySelector("[data-selected-count]");
const deleteHint = document.querySelector("[data-delete-hint]");
const accountName = document.querySelector("[data-admin-name]");
const accountEmail = document.querySelector("[data-admin-email]");
const accountAvatar = document.querySelector("[data-admin-avatar]");
const fileInput = form?.elements.file;
const coverInput = form?.elements.coverFile;
const portfolioIdInput = form?.elements.portfolioId;
const submitButton = document.querySelector("[data-submit-portfolio]");
const cancelEditButton = document.querySelector("[data-cancel-edit]");
const previewEmpty = document.querySelector("[data-portfolio-preview-empty]");
const previewCard = document.querySelector("[data-portfolio-preview]");
const previewCover = document.querySelector("[data-preview-cover]");
const previewTitle = document.querySelector("[data-preview-title]");
const previewMeta = document.querySelector("[data-preview-meta]");
const previewDescription = document.querySelector("[data-preview-description]");
const previewOwner = document.querySelector("[data-preview-owner]");
const adminPdfModal = document.querySelector("[data-admin-pdf-modal]");
const adminPdfTitle = document.querySelector("[data-admin-pdf-title]");
const adminPdfUni = document.querySelector("[data-admin-pdf-uni]");
const adminPdfFaculty = document.querySelector("[data-admin-pdf-faculty]") || document.querySelector("[data-admin-pdf-track]");
const adminPdfMajor = document.querySelector("[data-admin-pdf-major]");
const adminPdfSchool = document.querySelector("[data-admin-pdf-school]");
const adminPdfOwner = document.querySelector("[data-admin-pdf-owner]");
const adminPdfDownload = document.querySelector("[data-admin-pdf-download]");
let currentUser = null;
let previewObjectUrl = "";
let deleteMode = false;
let allLoadedPortfolios = [];
let allLoadedReviews = [];
const selectedPortfolioIds = new Set();

const adminPdfViewer = new TCASPdfViewer({
  modal: adminPdfModal,
  container: document.querySelector("[data-admin-pdf-pages-container]"),
  thumbnailContainer: document.querySelector("[data-admin-pdf-thumbnails]"),
  detailsDrawer: document.querySelector("[data-admin-pdf-details-drawer]"),
  loadingElement: document.querySelector("[data-admin-pdf-loading]"),
  pageInput: document.querySelector("[data-admin-pdf-page-input]"),
  pageCountSpan: document.querySelector("[data-admin-pdf-page-count]"),
  zoomLabel: document.querySelector("[data-admin-pdf-zoom-label]"),
  sidebar: document.querySelector("[data-admin-pdf-sidebar]"),
  prevBtn: document.querySelector("[data-admin-pdf-prev]"),
  nextBtn: document.querySelector("[data-admin-pdf-next]"),
  zoomInBtn: document.querySelector("[data-admin-pdf-zoom-in]"),
  zoomOutBtn: document.querySelector("[data-admin-pdf-zoom-out]"),
  rotateBtn: document.querySelector("[data-admin-pdf-rotate]"),
  scrollModeBtn: document.querySelector("[data-admin-pdf-scroll-mode]"),
  thumbToggleBtn: document.querySelector("[data-admin-pdf-thumb-toggle]"),
  detailsToggleBtn: document.querySelector("[data-admin-pdf-details-toggle]"),
  fullscreenBtn: document.querySelector("[data-admin-pdf-fullscreen]"),
  closeBtn: document.querySelector("[data-admin-pdf-close]"),
});

function openAdminPdfPreview(portfolio) {
  if (!adminPdfModal) return;
  const owner = portfolio.ownerName || "เจ้าของพอร์ต";
  const displayTitle = portfolio.ownerName ? `Portfolio ของ ${portfolio.ownerName}` : (portfolio.title || "Portfolio");
  const university = portfolio.university || "ยังไม่ระบุมหาวิทยาลัย";
  const faculty = portfolio.faculty || portfolio.track || "ยังไม่ระบุคณะ";
  const major = portfolio.major || "";
  const school = portfolio.school || "ยังไม่ระบุโรงเรียน";

  if (adminPdfTitle) adminPdfTitle.textContent = displayTitle;
  if (adminPdfUni) adminPdfUni.textContent = university;
  if (adminPdfFaculty) adminPdfFaculty.textContent = faculty;
  if (adminPdfMajor) {
    adminPdfMajor.textContent = major || "ทุกสาขา";
    adminPdfMajor.hidden = !major;
  }
  if (adminPdfSchool) adminPdfSchool.textContent = school;
  if (adminPdfOwner) adminPdfOwner.textContent = `◉ เจ้าของ: ${owner}`;

  if (adminPdfDownload) {
    adminPdfDownload.onclick = () => downloadPortfolioPdf(portfolio);
  }

  adminPdfViewer.load(portfolio);
}

function closeAdminPdfPreview() {
  adminPdfViewer.close();
}

function setGuard(message, kind = "") {
  if (!guard) return;
  guard.textContent = message;
  guard.dataset.kind = kind;
}

function setStatus(message, kind = "") {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function updateDeleteControls() {
  const total = selectedPortfolioIds.size;
  if (toggleDeleteModeButton) {
    toggleDeleteModeButton.textContent = deleteMode ? "ยกเลิกเลือก" : "เลือกลบพอร์ต";
    toggleDeleteModeButton.dataset.active = String(deleteMode);
  }
  if (deleteSelectedButton) {
    deleteSelectedButton.hidden = !deleteMode;
    deleteSelectedButton.disabled = total === 0;
  }
  if (selectedCount) selectedCount.textContent = String(total);
  if (deleteHint) deleteHint.hidden = !deleteMode;
  list?.querySelectorAll("[data-delete-selection]").forEach((input) => {
    input.closest(".admin-portfolio-item")?.classList.toggle("is-selected", input.checked);
    input.closest(".admin-portfolio-select")?.toggleAttribute("hidden", !deleteMode);
  });
}

function makeDownloadFileName(title) {
  const baseName = String(title || "portfolio")
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim() || "portfolio";
  return `${baseName}.pdf`;
}

function getFormattedDownloadUrl(fileURL, title) {
  if (!fileURL) return "";
  const fileName = makeDownloadFileName(title);
  if (fileURL.includes("cloudinary.com")) {
    const nameWithoutExt = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!fileURL.includes("fl_attachment")) {
      const withAttachment = fileURL.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(nameWithoutExt)}/`);
      return withAttachment.endsWith(".pdf") ? withAttachment : `${withAttachment}.pdf`;
    }
  }
  return fileURL;
}

function triggerBlobDownload(blob, title) {
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = makeDownloadFileName(title);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function downloadPortfolioPdf(portfolio) {
  if (!portfolio.fileURL && !portfolio.id) {
    throw new Error("ไม่พบลิงก์สำหรับดาวน์โหลด Portfolio นี้");
  }

  const title = portfolio.title || portfolio.originalName || "portfolio";

  if (portfolio.id) {
    try {
      const token = await getAdminToken().catch(() => null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${apiBaseUrl}/api/portfolios/${encodeURIComponent(portfolio.id)}/download`, { headers });
      if (response.ok) {
        const blob = await response.blob();
        triggerBlobDownload(blob, title);
        return;
      }
    } catch (err) {
      console.warn("Backend download endpoint error:", err);
    }
  }

  if (portfolio.fileURL) {
    try {
      const response = await fetch(portfolio.fileURL);
      if (response.ok) {
        const blob = await response.blob();
        triggerBlobDownload(blob, title);
        return;
      }
    } catch (directErr) {
      console.warn("Direct fileURL fetch error:", directErr);
    }
  }

  if (portfolio.fileURL) {
    const formattedUrl = getFormattedDownloadUrl(portfolio.fileURL, title);
    window.open(formattedUrl, "_blank", "noopener,noreferrer");
    return;
  }

  throw new Error("ดาวน์โหลด Portfolio ไม่สำเร็จ");
}

function updatePreview() {
  if (!form || !previewCard || !previewEmpty) return;

  const owner = form.elements.ownerName?.value.trim() || "เจ้าของผลงาน";
  const uni = form.elements.university?.value.trim() || "";
  const faculty = form.elements.faculty?.value.trim() || "";
  const major = form.elements.major?.value.trim() || "";
  const meta = [uni, faculty, major].filter(Boolean).join(" · ") || "มหาวิทยาลัย · คณะ · สาขา";
  const description = form.elements.description?.value.trim() || "รายละเอียดพอร์ตจะแสดงตรงนี้";
  
  previewTitle.textContent = `Portfolio ของ ${owner}`;
  previewMeta.textContent = meta;
  previewDescription.textContent = description;
  previewOwner.textContent = `◉ เจ้าของ: ${owner}`;

  previewCover.replaceChildren();
  const pdfFile = fileInput?.files?.[0];
  if (pdfFile) {
    const badge = document.createElement("div");
    badge.className = "admin-preview-pdf-badge";
    badge.innerHTML = `<span>📄</span><strong>${pdfFile.name}</strong><small>หน้า 1 เป็นภาพปกอัตโนมัติ</small>`;
    previewCover.appendChild(badge);
  } else {
    const label = document.createElement("span");
    label.textContent = "PORTFOLIO";
    previewCover.appendChild(label);
  }

  const hasInput = Boolean(pdfFile || form.elements.ownerName?.value.trim() || form.elements.university?.value.trim());
  previewCard.hidden = !hasInput;
  previewEmpty.hidden = hasInput;
}

async function getAdminToken() {
  if (!currentUser) throw new Error("กรุณาเข้าสู่ระบบก่อน");
  const tokenResult = await getIdTokenResult(currentUser, true);
  if (tokenResult.claims.admin !== true) {
    throw new Error("บัญชีนี้ไม่มีสิทธิ์ Admin");
  }
  return currentUser.getIdToken();
}

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!response.ok) {
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || `HTTP Error ${response.status}`);
      } catch (err) {
        if (err.message && !err.message.includes("JSON")) throw err;
      }
    }
    if (response.status === 404) {
      throw new Error("ไม่พบ API Endpoint บนเซิร์ฟเวอร์ (404 Not Found)");
    }
    throw new Error(`คำขอไม่สำเร็จ (HTTP ${response.status})`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function createPortfolioItem(portfolio, index, total) {
  const item = document.createElement("article");
  item.className = "admin-portfolio-item";
  item.dataset.portfolioId = portfolio.id || "";
  item.dataset.index = index;
  const displayTitle = portfolio.ownerName ? `Portfolio ของ ${portfolio.ownerName}` : (portfolio.title || portfolio.originalName || "Portfolio นี้");
  item.dataset.portfolioTitle = displayTitle;

  // Drag & Drop Setup
  item.draggable = true;

  const dragHandle = document.createElement("div");
  dragHandle.className = "admin-drag-handle";
  dragHandle.innerHTML = "⠿";
  dragHandle.title = "คลิกลากเพื่อจัดเรียงลำดับ";
  item.appendChild(dragHandle);

  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    item.classList.add("is-dragging");
  });

  item.addEventListener("dragend", () => {
    document.querySelectorAll(".admin-portfolio-item").forEach((el) => {
      el.classList.remove("is-dragging", "drag-over-top", "drag-over-bottom");
    });
  });

  item.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      item.classList.add("drag-over-top");
      item.classList.remove("drag-over-bottom");
    } else {
      item.classList.add("drag-over-bottom");
      item.classList.remove("drag-over-top");
    }
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("drag-over-top", "drag-over-bottom");
  });

  item.addEventListener("drop", async (e) => {
    e.preventDefault();
    item.classList.remove("drag-over-top", "drag-over-bottom");
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(fromIndex) || fromIndex === index) return;

    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    let targetIndex = e.clientY < midY ? index : index + 1;
    if (fromIndex < targetIndex) targetIndex--;

    const [moved] = allLoadedPortfolios.splice(fromIndex, 1);
    allLoadedPortfolios.splice(targetIndex, 0, moved);

    renderPortfolioList();
    setStatus("กำลังบันทึกลำดับการจัดเรียง Portfolio...", "pending");
    try {
      await reorderPortfolios(allLoadedPortfolios.map((p) => p.id));
      setStatus("บันทึกการจัดเรียง Portfolio สำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder portfolios error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  const selectLabel = document.createElement("label");
  selectLabel.className = "admin-portfolio-select";
  selectLabel.hidden = !deleteMode;
  selectLabel.title = "เลือก Portfolio นี้เพื่อลบ";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.deleteSelection = "";
  checkbox.value = portfolio.id || "";
  checkbox.checked = selectedPortfolioIds.has(portfolio.id);
  checkbox.setAttribute("aria-label", `เลือก ${displayTitle} เพื่อลบ`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) selectedPortfolioIds.add(portfolio.id);
    else selectedPortfolioIds.delete(portfolio.id);
    updateDeleteControls();
  });
  selectLabel.appendChild(checkbox);
  item.appendChild(selectLabel);

  // Order Badge
  const orderBadge = document.createElement("span");
  orderBadge.className = "admin-order-badge";
  orderBadge.textContent = `#${index + 1}`;
  orderBadge.title = `ลำดับที่ ${index + 1}`;
  item.appendChild(orderBadge);

  // Reorder Buttons (Move Up / Down)
  const reorderGroup = document.createElement("div");
  reorderGroup.className = "admin-reorder-group";

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "admin-reorder-btn";
  moveUpBtn.type = "button";
  moveUpBtn.title = "เลื่อนขึ้น";
  moveUpBtn.innerHTML = "▲";
  moveUpBtn.disabled = index === 0;
  moveUpBtn.addEventListener("click", async () => {
    if (index === 0) return;
    const temp = allLoadedPortfolios[index];
    allLoadedPortfolios[index] = allLoadedPortfolios[index - 1];
    allLoadedPortfolios[index - 1] = temp;
    renderPortfolioList();
    setStatus("กำลังบันทึกลำดับการจัดเรียง Portfolio...", "pending");
    try {
      await reorderPortfolios(allLoadedPortfolios.map((p) => p.id));
      setStatus("บันทึกการจัดเรียง Portfolio สำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder portfolios error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "admin-reorder-btn";
  moveDownBtn.type = "button";
  moveDownBtn.title = "เลื่อนลง";
  moveDownBtn.innerHTML = "▼";
  moveDownBtn.disabled = index === total - 1;
  moveDownBtn.addEventListener("click", async () => {
    if (index === total - 1) return;
    const temp = allLoadedPortfolios[index];
    allLoadedPortfolios[index] = allLoadedPortfolios[index + 1];
    allLoadedPortfolios[index + 1] = temp;
    renderPortfolioList();
    setStatus("กำลังบันทึกลำดับการจัดเรียง Portfolio...", "pending");
    try {
      await reorderPortfolios(allLoadedPortfolios.map((p) => p.id));
      setStatus("บันทึกการจัดเรียง Portfolio สำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder portfolios error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  reorderGroup.append(moveUpBtn, moveDownBtn);
  item.appendChild(reorderGroup);

  const coverContainer = document.createElement("div");
  coverContainer.className = "admin-portfolio-thumb";
  if (portfolio.coverURL) {
    const cover = document.createElement("img");
    cover.src = portfolio.coverURL;
    cover.alt = `รูปปก ${displayTitle}`;
    cover.style.width = "100%";
    cover.style.height = "100%";
    cover.style.objectFit = "cover";
    coverContainer.appendChild(cover);
  } else if (portfolio.fileURL) {
    coverContainer.textContent = "📄";
    renderPdfPage1Thumbnail(portfolio.fileURL, coverContainer);
  } else {
    coverContainer.textContent = "📄";
  }
  item.appendChild(coverContainer);

  const copy = document.createElement("div");
  copy.className = "admin-portfolio-item-copy";

  const title = document.createElement("strong");
  title.textContent = displayTitle;
  copy.appendChild(title);

  const details = document.createElement("span");
  const facultyMajor = [portfolio.faculty || portfolio.track, portfolio.major].filter(Boolean).join(" ");
  details.textContent = [portfolio.university, facultyMajor, portfolio.school].filter(Boolean).join(" · ") || portfolio.originalName || portfolio.mimeType || "ไฟล์ Portfolio";
  copy.appendChild(details);

  if (portfolio.ownerName) {
    const owner = document.createElement("span");
    owner.textContent = `เจ้าของ: ${portfolio.ownerName}`;
    copy.appendChild(owner);
  }

  if (portfolio.fileURL) {
    const previewLink = document.createElement("a");
    previewLink.href = "#";
    previewLink.className = "admin-portfolio-preview-link";
    previewLink.textContent = "👁 พรีวิว PDF";
    previewLink.addEventListener("click", (event) => {
      event.preventDefault();
      openAdminPdfPreview(portfolio);
    });
    copy.appendChild(previewLink);

    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "ดาวน์โหลด PDF";
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        await downloadPortfolioPdf(portfolio);
      } catch (error) {
        setStatus(error.message, "error");
      }
    });
    copy.appendChild(link);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "admin-delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "ลบ";
  deleteButton.addEventListener("click", async () => {
    if (!window.confirm(`ต้องการลบ “${displayTitle}” หรือไม่?`)) return;

    deleteButton.disabled = true;
    deleteButton.textContent = "กำลังลบ...";
    try {
      const token = await getAdminToken();
      const response = await fetch(`${apiBaseUrl}/api/admin/portfolios/${encodeURIComponent(portfolio.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await readApiResponse(response);
      await loadPortfolios();
      setStatus("ลบ Portfolio สำเร็จแล้ว", "success");
    } catch (error) {
      try {
        await deletePortfolio(portfolio.id);
        await loadPortfolios();
        setStatus("ลบ Portfolio สำเร็จแล้ว", "success");
      } catch (firestoreErr) {
        deleteButton.disabled = false;
        deleteButton.textContent = "ลบ";
        setStatus(firestoreErr.message || error.message, "error");
      }
    }
  });

  const editButton = document.createElement("button");
  editButton.className = "admin-edit-button";
  editButton.type = "button";
  editButton.textContent = "แก้ไข";
  editButton.addEventListener("click", () => {
    form.elements.ownerName.value = portfolio.ownerName || "";
    form.elements.university.value = portfolio.university || "";
    form.elements.faculty.value = portfolio.faculty || portfolio.track || "";
    form.elements.major.value = portfolio.major || "";
    form.elements.generation.value = portfolio.generation || "";
    form.elements.studyPlan.value = portfolio.studyPlan || portfolio.school || "";
    form.elements.contact.value = portfolio.contact || "";
    form.elements.description.value = portfolio.advice || portfolio.description || "";
    portfolioIdInput.value = portfolio.id;
    fileInput.required = false;
    submitButton.textContent = "บันทึกการแก้ไข";
    cancelEditButton.hidden = false;
    updatePreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus(`กำลังแก้ไข Portfolio ของ ${portfolio.ownerName || "เจ้าของผลงาน"}`, "pending");
  });

  const actions = document.createElement("div");
  actions.className = "admin-portfolio-item-actions";
  actions.append(editButton, deleteButton);
  item.append(copy, actions);
  return item;
}

function renderPortfolioList() {
  if (!list) return;
  list.replaceChildren();
  if (!allLoadedPortfolios.length) {
    const empty = document.createElement("p");
    empty.className = "admin-muted";
    empty.textContent = "ยังไม่มี Portfolio ในระบบ";
    list.appendChild(empty);
    return;
  }
  allLoadedPortfolios.forEach((portfolio, index) => {
    list.appendChild(createPortfolioItem(portfolio, index, allLoadedPortfolios.length));
  });
  updateDeleteControls();
}

function resetEditMode() {
  form.reset();
  portfolioIdInput.value = "";
  fileInput.required = true;
  submitButton.textContent = "เผยแพร่ Portfolio";
  cancelEditButton.hidden = true;
  updatePreview();
}

async function loadPortfolios() {
  if (!list) return;
  selectedPortfolioIds.clear();
  list.replaceChildren();
  updateDeleteControls();

  let loadedFromBackend = false;

  if (apiBaseUrl) {
    try {
      const token = await getAdminToken();
      const response = await fetch(`${apiBaseUrl}/api/portfolios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await readApiResponse(response);
        allLoadedPortfolios = result.portfolios || [];
        loadedFromBackend = true;
      }
    } catch (apiError) {
      console.warn("Backend loadPortfolios failed, falling back to Firestore:", apiError);
    }
  }

  if (!loadedFromBackend) {
    try {
      allLoadedPortfolios = await getPortfolios();
    } catch (firestoreError) {
      const message = document.createElement("p");
      message.className = "admin-muted";
      message.textContent = `โหลดข้อมูลไม่สำเร็จ: ${firestoreError.message || "ไม่สามารถดึงข้อมูลพอร์ตได้"}`;
      list.appendChild(message);
      return;
    }
  }

  renderPortfolioList();
}

// ----------------- Reviews Management in Admin -----------------
function createReviewItem(review, index, total) {
  const item = document.createElement("article");
  item.className = "admin-portfolio-item";
  item.dataset.reviewId = review.id || "";
  item.dataset.index = index;

  // Drag & Drop Setup
  item.draggable = true;

  const dragHandle = document.createElement("div");
  dragHandle.className = "admin-drag-handle";
  dragHandle.innerHTML = "⠿";
  dragHandle.title = "คลิกลากเพื่อจัดเรียงลำดับ";
  item.appendChild(dragHandle);

  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    item.classList.add("is-dragging");
  });

  item.addEventListener("dragend", () => {
    document.querySelectorAll("[data-admin-review-list] .admin-portfolio-item").forEach((el) => {
      el.classList.remove("is-dragging", "drag-over-top", "drag-over-bottom");
    });
  });

  item.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      item.classList.add("drag-over-top");
      item.classList.remove("drag-over-bottom");
    } else {
      item.classList.add("drag-over-bottom");
      item.classList.remove("drag-over-top");
    }
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("drag-over-top", "drag-over-bottom");
  });

  item.addEventListener("drop", async (e) => {
    e.preventDefault();
    item.classList.remove("drag-over-top", "drag-over-bottom");
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(fromIndex) || fromIndex === index) return;

    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    let targetIndex = e.clientY < midY ? index : index + 1;
    if (fromIndex < targetIndex) targetIndex--;

    const [moved] = allLoadedReviews.splice(fromIndex, 1);
    allLoadedReviews.splice(targetIndex, 0, moved);

    renderReviewsList();
    setStatus("กำลังบันทึกลำดับการจัดเรียงรีวิว...", "pending");
    try {
      await reorderReviews(allLoadedReviews.map((r) => r.id));
      setStatus("บันทึกการจัดเรียงรีวิวสำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder reviews error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  // Order Badge
  const orderBadge = document.createElement("span");
  orderBadge.className = "admin-order-badge";
  orderBadge.textContent = `#${index + 1}`;
  orderBadge.title = `ลำดับที่ ${index + 1}`;
  item.appendChild(orderBadge);

  // Reorder Buttons (Move Up / Down)
  const reorderGroup = document.createElement("div");
  reorderGroup.className = "admin-reorder-group";

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "admin-reorder-btn";
  moveUpBtn.type = "button";
  moveUpBtn.title = "เลื่อนขึ้น";
  moveUpBtn.innerHTML = "▲";
  moveUpBtn.disabled = index === 0;
  moveUpBtn.addEventListener("click", async () => {
    if (index === 0) return;
    const temp = allLoadedReviews[index];
    allLoadedReviews[index] = allLoadedReviews[index - 1];
    allLoadedReviews[index - 1] = temp;
    renderReviewsList();
    setStatus("กำลังบันทึกลำดับการจัดเรียงรีวิว...", "pending");
    try {
      await reorderReviews(allLoadedReviews.map((r) => r.id));
      setStatus("บันทึกการจัดเรียงรีวิวสำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder reviews error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "admin-reorder-btn";
  moveDownBtn.type = "button";
  moveDownBtn.title = "เลื่อนลง";
  moveDownBtn.innerHTML = "▼";
  moveDownBtn.disabled = index === total - 1;
  moveDownBtn.addEventListener("click", async () => {
    if (index === total - 1) return;
    const temp = allLoadedReviews[index];
    allLoadedReviews[index] = allLoadedReviews[index + 1];
    allLoadedReviews[index + 1] = temp;
    renderReviewsList();
    setStatus("กำลังบันทึกลำดับการจัดเรียงรีวิว...", "pending");
    try {
      await reorderReviews(allLoadedReviews.map((r) => r.id));
      setStatus("บันทึกการจัดเรียงรีวิวสำเร็จแล้ว ✦", "success");
    } catch (err) {
      console.warn("Reorder reviews error:", err);
      setStatus("บันทึกการจัดเรียงไม่สำเร็จ", "error");
    }
  });

  reorderGroup.append(moveUpBtn, moveDownBtn);
  item.appendChild(reorderGroup);

  // Thumbnail
  const thumbContainer = document.createElement("div");
  thumbContainer.className = "admin-portfolio-thumb";
  const photos = Array.isArray(review.photos) ? review.photos : [];
  if (photos.length > 0) {
    const img = document.createElement("img");
    img.src = photos[0];
    img.alt = review.title || "Review";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    thumbContainer.appendChild(img);
  } else {
    thumbContainer.textContent = "🏆";
  }
  item.appendChild(thumbContainer);

  // Copy
  const copy = document.createElement("div");
  copy.className = "admin-portfolio-item-copy";

  const title = document.createElement("strong");
  title.textContent = review.title || "รีวิวการแข่งขัน";
  copy.appendChild(title);

  const meta = document.createElement("span");
  meta.textContent = [review.category, review.organizer ? `ผู้จัด: ${review.organizer}` : "", review.award, `โดย: ${review.author || "Admin"}`, photos.length ? `📷 ${photos.length} รูป` : ""].filter(Boolean).join(" · ");
  copy.appendChild(meta);

  // Actions
  const actions = document.createElement("div");
  actions.className = "admin-portfolio-item-actions";

  const openLink = document.createElement("a");
  openLink.href = "reviews.html";
  openLink.className = "admin-edit-button";
  openLink.textContent = "ไปที่หน้ารีวิว";
  openLink.style.textDecoration = "none";
  openLink.style.display = "inline-flex";
  openLink.style.alignItems = "center";

  const delBtn = document.createElement("button");
  delBtn.className = "admin-delete-button";
  delBtn.type = "button";
  delBtn.textContent = "ลบ";
  delBtn.addEventListener("click", async () => {
    if (!window.confirm(`ต้องการลบรีวิว “${review.title}” หรือไม่?`)) return;
    delBtn.disabled = true;
    delBtn.textContent = "กำลังลบ...";
    try {
      await deleteReview(review.id);
      allLoadedReviews = allLoadedReviews.filter((r) => r.id !== review.id);
      renderReviewsList();
      setStatus("ลบรีวิวสำเร็จแล้ว", "success");
    } catch (err) {
      delBtn.disabled = false;
      delBtn.textContent = "ลบ";
      setStatus("ลบรีวิวไม่สำเร็จ: " + err.message, "error");
    }
  });

  actions.append(openLink, delBtn);
  item.append(copy, actions);
  return item;
}

function renderReviewsList() {
  if (!adminReviewList) return;
  adminReviewList.replaceChildren();
  if (adminReviewEmpty) {
    adminReviewEmpty.hidden = allLoadedReviews.length !== 0;
  }
  allLoadedReviews.forEach((review, index) => {
    adminReviewList.appendChild(createReviewItem(review, index, allLoadedReviews.length));
  });
}

async function loadReviews() {
  if (!adminReviewList) return;
  try {
    allLoadedReviews = await getReviews();
    renderReviewsList();
  } catch (err) {
    console.warn("Load reviews in admin error:", err);
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = form.elements.file?.files?.[0];
  const portfolioId = portfolioIdInput.value;
  const ownerName = form.elements.ownerName?.value.trim();

  if (!ownerName) {
    setStatus("กรุณาระบุชื่อเจ้าของผลงาน", "error");
    return;
  }

  if (!portfolioId && !file) {
    setStatus("กรุณาเลือกไฟล์ Portfolio (.pdf)", "error");
    return;
  }

  if (file && file.size > 10 * 1024 * 1024) {
    setStatus("ไฟล์ต้องมีขนาดไม่เกิน 10 MB", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("กำลังอัปโหลดไฟล์ PDF...", "pending");

  let uploadedViaBackend = false;

  if (apiBaseUrl) {
    try {
      const token = await getAdminToken();
      const response = await fetch(
        portfolioId
          ? `${apiBaseUrl}/api/admin/portfolios/${encodeURIComponent(portfolioId)}`
          : `${apiBaseUrl}/api/admin/portfolios/upload`,
        {
          method: portfolioId ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: new FormData(form),
        }
      );
      if (response.ok) {
        await readApiResponse(response);
        uploadedViaBackend = true;
      }
    } catch (apiError) {
      console.warn("Backend API upload failed, falling back to Firebase Client SDK:", apiError);
    }
  }

  if (!uploadedViaBackend) {
    try {
      let uploadedFile = null;

      if (file) {
        setStatus("กำลังอัปโหลดไฟล์ PDF (0%)...", "pending");
        uploadedFile = await uploadPortfolioFile(file, (percent) => {
          setStatus(`กำลังอัปโหลดไฟล์ PDF (${percent}%)...`, "pending");
        });
      }

      const faculty = String(form.elements.faculty?.value || "").trim();
      const major = String(form.elements.major?.value || "").trim();
      const track = major ? `${faculty} (${major})` : faculty;

      const generation = String(form.elements.generation?.value || "").trim();
      const studyPlan = String(form.elements.studyPlan?.value || "").trim();
      const contact = String(form.elements.contact?.value || "").trim();
      const advice = String(form.elements.description?.value || "").trim();
      const studentInfo = [generation, studyPlan].filter(Boolean).join("\n");

      const payload = {
        title: `Portfolio ของ ${ownerName}`,
        description: advice,
        advice,
        university: String(form.elements.university?.value || "").trim(),
        faculty,
        major,
        track,
        generation,
        studyPlan,
        school: studyPlan,
        studentInfo,
        contact,
        ownerName,
      };

      if (uploadedFile) {
        payload.fileURL = uploadedFile.downloadURL;
        payload.filePath = uploadedFile.filePath;
        payload.originalName = uploadedFile.fileName;
        payload.mimeType = uploadedFile.fileType;
        payload.size = uploadedFile.fileSize;
      }
      if (uploadedCover) {
        payload.coverURL = uploadedCover.downloadURL;
        payload.coverPath = uploadedCover.filePath;
      }

      if (portfolioId) {
        await updatePortfolio(portfolioId, payload);
      } else {
        await addPortfolio(payload);
      }
    } catch (firebaseError) {
      setStatus(firebaseError.message || "อัปโหลด Portfolio ไม่สำเร็จ", "error");
      submitButton.disabled = false;
      return;
    }
  }

  resetEditMode();
  setStatus(portfolioId ? "บันทึกการแก้ไขสำเร็จแล้ว" : "อัปโหลดและเผยแพร่ Portfolio สำเร็จแล้ว", "success");
  await loadPortfolios();
  submitButton.disabled = false;
});

refreshButton?.addEventListener("click", loadPortfolios);

toggleDeleteModeButton?.addEventListener("click", () => {
  deleteMode = !deleteMode;
  selectedPortfolioIds.clear();
  updateDeleteControls();
});

deleteSelectedButton?.addEventListener("click", async () => {
  const ids = [...selectedPortfolioIds];
  if (!ids.length) return;

  const names = ids.map((id) => list.querySelector(`[data-portfolio-id="${CSS.escape(id)}"]`)?.dataset.portfolioTitle || "Portfolio นี้");
  if (!window.confirm(`ต้องการลบ Portfolio ที่เลือก ${ids.length} รายการหรือไม่?\n\n${names.join("\n")}`)) return;

  deleteSelectedButton.disabled = true;
  toggleDeleteModeButton.disabled = true;
  setStatus("กำลังลบ Portfolio ที่เลือก...", "pending");

  try {
    const token = await getAdminToken();
    for (const id of ids) {
      const response = await fetch(`${apiBaseUrl}/api/admin/portfolios/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "ลบ Portfolio ไม่สำเร็จ");
    }

    deleteMode = false;
    selectedPortfolioIds.clear();
    await loadPortfolios();
    setStatus(`ลบ Portfolio สำเร็จ ${ids.length} รายการ`, "success");
  } catch (error) {
    setStatus(error.message, "error");
    deleteSelectedButton.disabled = false;
    toggleDeleteModeButton.disabled = false;
  }
});

form?.querySelectorAll("input:not([type=file]), textarea").forEach((field) => field.addEventListener("input", updatePreview));
fileInput?.addEventListener("change", updatePreview);
coverInput?.addEventListener("change", updatePreview);
cancelEditButton?.addEventListener("click", () => {
  resetEditMode();
  setStatus("ยกเลิกการแก้ไขแล้ว");
});

updatePreview();
updateDeleteControls();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    setGuard("กรุณาเข้าสู่ระบบด้วย Google ก่อนเข้า Admin", "error");
    window.setTimeout(() => { window.location.href = "login.html"; }, 900);
    return;
  }

  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (tokenResult.claims.admin !== true) {
      setGuard("บัญชีนี้เข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์ Admin", "error");
      return;
    }

    const initial = (user.displayName || user.email || "A").trim().charAt(0).toUpperCase();
    accountAvatar.replaceChildren();
    if (user.photoURL) {
      const avatar = document.createElement("img");
      avatar.src = user.photoURL;
      avatar.alt = "รูปโปรไฟล์ Google";
      avatar.referrerPolicy = "no-referrer";
      avatar.crossOrigin = "anonymous";
      avatar.onerror = () => {
        avatar.remove();
        accountAvatar.textContent = initial;
      };
      accountAvatar.appendChild(avatar);
    } else {
      accountAvatar.textContent = initial;
    }

    accountName.textContent = user.displayName || "Admin";
    accountEmail.textContent = user.email || "";
    setGuard("ตรวจสอบสิทธิ์ Admin สำเร็จ", "success");
    panel.hidden = false;
    if (window.location.hash === "#portfolio-list") {
      deleteMode = true;
    }
    await loadPortfolios();
    await loadReviews();
    if (window.location.hash === "#portfolio-list") {
      document.querySelector("#portfolio-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    setGuard(error.message || "ตรวจสอบสิทธิ์ไม่สำเร็จ", "error");
  }
});
