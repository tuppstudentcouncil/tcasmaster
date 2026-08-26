import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getPortfolios, deletePortfolio, reorderPortfolios } from "./firebase-data.js";
import { getCachedPdfThumbnail, renderPdfPage1Thumbnail, TCASPdfViewer } from "./pdf-viewer.js";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrl = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : null;
const list = document.querySelector("[data-portfolio-list]");
const filterUni = document.querySelector("[data-filter-university]");
const filterFaculty = document.querySelector("[data-filter-faculty]") || document.querySelector("[data-filter-track]");
const filterMajor = document.querySelector("[data-filter-major]");
const filterSchool = document.querySelector("[data-filter-school]");
const filters = [filterUni, filterFaculty, filterMajor, filterSchool].filter(Boolean);

const count = document.querySelector("[data-portfolio-count]");
const empty = document.querySelector("[data-portfolio-empty]");
const uploadButton = document.querySelector("[data-upload-portfolio]");
const pdfModal = document.querySelector("[data-pdf-preview-modal]");
const pdfModalTitle = document.querySelector("[data-pdf-modal-title]");
const pdfModalUni = document.querySelector("[data-pdf-modal-uni]");
const pdfModalFaculty = document.querySelector("[data-pdf-modal-faculty]") || document.querySelector("[data-pdf-modal-track]");
const pdfModalMajor = document.querySelector("[data-pdf-modal-major]");
const pdfModalSchool = document.querySelector("[data-pdf-modal-school]");
const pdfModalOwner = document.querySelector("[data-pdf-modal-owner]");
const pdfDownloadBtn = document.querySelector("[data-pdf-download-btn]");
const toast = document.querySelector("[data-community-toast]");
let isAdmin = false;
let allPortfolios = [];

const pdfViewer = new TCASPdfViewer({
  modal: pdfModal,
  container: document.querySelector("[data-pdf-pages-container]"),
  thumbnailContainer: document.querySelector("[data-pdf-thumbnails]"),
  detailsDrawer: document.querySelector("[data-pdf-details-drawer]"),
  loadingElement: document.querySelector("[data-pdf-loading]"),
  pageInput: document.querySelector("[data-pdf-page-input]"),
  pageCountSpan: document.querySelector("[data-pdf-page-count]"),
  zoomLabel: document.querySelector("[data-pdf-zoom-label]"),
  sidebar: document.querySelector("[data-pdf-sidebar]"),
  prevBtn: document.querySelector("[data-pdf-prev]"),
  nextBtn: document.querySelector("[data-pdf-next]"),
  zoomInBtn: document.querySelector("[data-pdf-zoom-in]"),
  zoomOutBtn: document.querySelector("[data-pdf-zoom-out]"),
  rotateBtn: document.querySelector("[data-pdf-rotate]"),
  scrollModeBtn: document.querySelector("[data-pdf-scroll-mode]"),
  thumbToggleBtn: document.querySelector("[data-pdf-thumb-toggle]"),
  detailsToggleBtn: document.querySelector("[data-pdf-details-toggle]"),
  fullscreenBtn: document.querySelector("[data-pdf-fullscreen]"),
  closeBtn: document.querySelector("[data-close-pdf-modal]"),
});

function addFilterOption(select, value) {
  if (!select || !value) return;
  const trimmed = value.trim();
  if (!trimmed) return;

  const exists = Array.from(select.options).some(
    (option) => option.value === trimmed
  );

  if (!exists) {
    const option = document.createElement("option");
    option.value = trimmed;
    option.textContent = trimmed;
    select.appendChild(option);
  }
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => toast.classList.remove("show"), 3500);
}

export function openPdfPreview(portfolio) {
  if (!portfolio) return;
  const owner = portfolio.ownerName || "เจ้าของพอร์ต";
  const displayTitle = portfolio.ownerName ? `Portfolio ของ ${portfolio.ownerName}` : (portfolio.title || "Portfolio");
  const university = portfolio.university || "ยังไม่ระบุมหาวิทยาลัย";
  const faculty = portfolio.faculty || portfolio.track || "ยังไม่ระบุคณะ";
  const major = portfolio.major || "";
  const school = portfolio.studentInfo || portfolio.school || "ยังไม่ระบุโรงเรียน";

  if (pdfModalTitle) pdfModalTitle.textContent = displayTitle;
  if (pdfModalUni) pdfModalUni.textContent = university;
  if (pdfModalFaculty) pdfModalFaculty.textContent = faculty;
  if (pdfModalMajor) {
    pdfModalMajor.textContent = major || "ทุกสาขา";
    pdfModalMajor.hidden = !major;
  }
  if (pdfModalSchool) pdfModalSchool.textContent = school;
  if (pdfModalOwner) pdfModalOwner.textContent = `◉ เจ้าของ: ${owner}`;

  if (pdfDownloadBtn) {
    pdfDownloadBtn.onclick = () => {
      if (portfolio.fileURL) {
        const link = document.createElement("a");
        link.href = portfolio.fileURL;
        link.download = `${portfolio.ownerName || "Portfolio"}.pdf`;
        link.target = "_blank";
        link.click();
      }
    };
  }

  pdfViewer.load(portfolio);
}

export function closePdfPreview() {
  pdfViewer.close();
}

async function handleMovePortfolio(portfolioId, direction) {
  if (!isAdmin) return;
  const index = allPortfolios.findIndex((p) => p.id === portfolioId);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allPortfolios.length) return;

  const temp = allPortfolios[index];
  allPortfolios[index] = allPortfolios[targetIndex];
  allPortfolios[targetIndex] = temp;

  renderUploadedPortfolios(allPortfolios);
  showToast("กำลังบันทึกลำดับการจัดเรียง Portfolio...");

  try {
    const orderedIds = allPortfolios.map((p) => p.id);
    await reorderPortfolios(orderedIds);
    showToast("บันทึกการจัดเรียง Portfolio เรียบร้อยแล้ว ✦");
  } catch (err) {
    console.warn("Reorder error:", err);
    showToast("บันทึกการจัดเรียงในเครื่องแล้ว");
  }
}

async function handleDeletePortfolio(portfolioId) {
  if (!isAdmin) return;
  if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Portfolio นี้?")) return;

  showToast("กำลังลบ Portfolio...");
  try {
    await deletePortfolio(portfolioId);
    allPortfolios = allPortfolios.filter((p) => p.id !== portfolioId);
    renderUploadedPortfolios(allPortfolios);
    showToast("ลบ Portfolio เรียบร้อยแล้ว 🗑️");
  } catch (err) {
    console.warn("Delete error:", err);
    showToast("ลบ Portfolio ไม่สำเร็จ: " + err.message);
  }
}

function createPortfolioCard(portfolio, index, total) {
  const card = document.createElement("article");
  card.className = "community-portfolio-card community-portfolio-card-uploaded";
  card.dataset.portfolioCard = "";
  card.dataset.firestoreId = portfolio.id || "";
  card.dataset.index = index;
  card.dataset.university = portfolio.university || "";
  card.dataset.faculty = portfolio.faculty || portfolio.track || "";
  card.dataset.track = portfolio.track || portfolio.faculty || "";
  card.dataset.major = portfolio.major || "";
  card.dataset.school = portfolio.studentInfo || portfolio.school || "";
  card.dataset.fileUrl = portfolio.fileURL || "";

  // Drag & Drop for Admin
  if (isAdmin) {
    card.draggable = true;

    const dragHandle = document.createElement("div");
    dragHandle.className = "community-card-drag-handle";
    dragHandle.innerHTML = "⠿";
    dragHandle.title = "คลิกลากเพื่อจัดเรียงลำดับ";
    dragHandle.addEventListener("click", (e) => e.stopPropagation());
    card.appendChild(dragHandle);

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      card.classList.add("is-dragging");
    });

    card.addEventListener("dragend", () => {
      document.querySelectorAll(".community-portfolio-card").forEach((el) => {
        el.classList.remove("is-dragging", "drag-over");
      });
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", async (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(fromIndex) || fromIndex === index) return;

      const [moved] = allPortfolios.splice(fromIndex, 1);
      allPortfolios.splice(index, 0, moved);

      renderUploadedPortfolios(allPortfolios);
      showToast("กำลังบันทึกลำดับการจัดเรียง Portfolio...");
      try {
        await reorderPortfolios(allPortfolios.map((p) => p.id));
        showToast("บันทึกการจัดเรียง Portfolio เรียบร้อยแล้ว ✦");
      } catch (err) {
        console.warn("Reorder error:", err);
        showToast("บันทึกการจัดเรียงในเครื่องแล้ว");
      }
    });
  }

  const poster = document.createElement("div");
  poster.className = "portfolio-poster portfolio-poster-uploaded";

  if (portfolio.coverURL) {
    const cover = document.createElement("img");
    cover.src = portfolio.coverURL;
    cover.alt = `รูปปก ${portfolio.ownerName || portfolio.title || "Portfolio"}`;
    cover.loading = "lazy";
    poster.appendChild(cover);
  } else if (portfolio.fileURL) {
    const cachedThumb = getCachedPdfThumbnail(portfolio.fileURL);
    if (cachedThumb) {
      const cover = document.createElement("img");
      cover.src = cachedThumb;
      cover.alt = `รูปปก ${portfolio.ownerName || portfolio.title || "Portfolio"}`;
      cover.loading = "lazy";
      cover.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      poster.replaceChildren(cover);
    } else {
      poster.append(
        createElement("span", "", "แฟ้มสะสมผลงาน"),
        createElement("b", "", (portfolio.faculty || "PORTFOLIO").slice(0, 16)),
        createElement("small", "", portfolio.university || "TCAS MASTER")
      );
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            if (entries[0].isIntersecting) {
              obs.disconnect();
              renderPdfPage1Thumbnail(portfolio.fileURL, poster);
            }
          },
          { rootMargin: "100px" }
        );
        observer.observe(card);
      } else {
        setTimeout(() => renderPdfPage1Thumbnail(portfolio.fileURL, poster), index * 100);
      }
    }
  } else {
    poster.append(
      createElement("span", "", "แฟ้มสะสมผลงาน"),
      createElement("b", "", (portfolio.faculty || "PORTFOLIO").slice(0, 16)),
      createElement("small", "", portfolio.university || "TCAS MASTER")
    );
  }

  const info = document.createElement("div");
  info.className = "portfolio-info";

  const ownerName = portfolio.ownerName || portfolio.title || "ชื่อเจ้าของผลงาน";
  const facultyText = portfolio.faculty || portfolio.track || "คณะ";
  const majorText = portfolio.major ? `(${portfolio.major})` : "";
  const facultyMajor = [facultyText, majorText].filter(Boolean).join(" ");
  const uniText = portfolio.university || "มหาวิทยาลัย";

  const nameEl = createElement("h3", "", ownerName);
  const facultyEl = createElement("p", "portfolio-info-faculty", facultyMajor);
  const uniEl = document.createElement("div");
  uniEl.className = "portfolio-info-uni";
  uniEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> <span>${uniText}</span>`;

  info.append(nameEl, facultyEl, uniEl);

  if (isAdmin) {
    const adminActions = document.createElement("div");
    adminActions.className = "community-card-admin-actions";

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "community-card-icon-btn reorder";
    moveUpBtn.type = "button";
    moveUpBtn.title = "เลื่อนขึ้น (จัดเรียงก่อนหน้า)";
    moveUpBtn.innerHTML = "▲";
    moveUpBtn.disabled = index === 0;
    moveUpBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleMovePortfolio(portfolio.id, -1);
    });

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "community-card-icon-btn reorder";
    moveDownBtn.type = "button";
    moveDownBtn.title = "เลื่อนลง (จัดเรียงถัดไป)";
    moveDownBtn.innerHTML = "▼";
    moveDownBtn.disabled = index === total - 1;
    moveDownBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleMovePortfolio(portfolio.id, 1);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "community-card-icon-btn edit";
    editBtn.type = "button";
    editBtn.title = "จัดการใน Admin Console";
    editBtn.innerHTML = "⚙️";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = "admin.html";
    });

    const delBtn = document.createElement("button");
    delBtn.className = "community-card-icon-btn delete";
    delBtn.type = "button";
    delBtn.title = "ลบ Portfolio นี้";
    delBtn.innerHTML = "🗑️";
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleDeletePortfolio(portfolio.id);
    });

    adminActions.append(moveUpBtn, moveDownBtn, editBtn, delBtn);
    info.appendChild(adminActions);
  }

  card.append(poster, info);

  card.addEventListener("click", () => {
    openPdfPreview(portfolio);
  });

  return card;
}

function cleanStr(s) {
  return String(s || "").trim().toLowerCase().replace(/^คณะ/, "");
}

function renderAllCards() {
  const cards = [...document.querySelectorAll("[data-portfolio-card]")];
  const uniVal = filterUni ? filterUni.value : "all";
  const facultyVal = filterFaculty ? filterFaculty.value : "all";
  const majorVal = filterMajor ? filterMajor.value : "all";
  const schoolVal = filterSchool ? filterSchool.value : "all";

  let visible = 0;

  cards.forEach((card) => {
    const cardUni = (card.dataset.university || "").trim();
    const cardFaculty = (card.dataset.faculty || card.dataset.track || "").trim();
    const cardMajor = (card.dataset.major || "").trim();
    const cardSchool = (card.dataset.school || "").trim();

    const matchUni = uniVal === "all" || cardUni === uniVal || cardUni.includes(uniVal) || uniVal.includes(cardUni);
    const matchFaculty = facultyVal === "all" || cleanStr(cardFaculty) === cleanStr(facultyVal) || cardFaculty.includes(facultyVal) || facultyVal.includes(cardFaculty);
    const matchMajor = majorVal === "all" || cleanStr(cardMajor) === cleanStr(majorVal) || cardMajor.includes(majorVal) || majorVal.includes(cardMajor);
    const matchSchool = schoolVal === "all" || cardSchool === schoolVal || cardSchool.includes(schoolVal) || schoolVal.includes(cardSchool);

    const show = matchUni && matchFaculty && matchMajor && matchSchool;
    card.hidden = !show;
    if (show) visible += 1;
  });

  if (count) count.textContent = `${visible} โพสต์`;
  if (empty) empty.hidden = visible !== 0;
}

function initStaticCards() {
  document.querySelectorAll(".community-portfolio-card:not(.community-portfolio-card-uploaded)").forEach((card) => {
    if (card._hasClickListener) return;
    card._hasClickListener = true;
    const uni = (card.dataset.university || card.querySelector(".portfolio-info-uni span")?.textContent || "").trim();
    const faculty = (card.dataset.faculty || card.dataset.track || card.querySelector(".portfolio-info-faculty")?.textContent || "").trim();
    const title = (card.querySelector("h3")?.textContent || "Portfolio").trim();
    const school = (card.dataset.school || "โรงเรียนมัธยม").trim();
    const owner = (card.querySelector(".portfolio-poster small")?.textContent || card.querySelector(".portfolio-owner")?.textContent || "เจ้าของพอร์ต").replace(/^◉\s*/, "").trim();

    card.addEventListener("click", () => {
      openPdfPreview({
        title,
        ownerName: owner,
        university: uni,
        faculty: faculty,
        track: faculty,
        school: school,
        studentInfo: school,
        description: `แฟ้มสะสมผลงาน ${title} คณะ${faculty.replace(/^คณะ/, "")} ${uni}`
      });
    });
  });
}

function renderUploadedPortfolios(portfolios) {
  if (!list) return;
  allPortfolios = Array.isArray(portfolios) ? portfolios : [];
  if (allPortfolios.length > 0) {
    list.innerHTML = "";
    allPortfolios.forEach((portfolio, index) => {
      if (filterUni) addFilterOption(filterUni, portfolio.university);
      if (filterFaculty) addFilterOption(filterFaculty, portfolio.faculty || portfolio.track);
      if (filterMajor) addFilterOption(filterMajor, portfolio.major);
      if (filterSchool) addFilterOption(filterSchool, portfolio.school);
      list.appendChild(createPortfolioCard(portfolio, index, allPortfolios.length));
    });
  } else {
    initStaticCards();
  }
  renderAllCards();
}

function showLoadError() {
  initStaticCards();
  renderAllCards();
}

async function loadPortfolios(user) {
  if (!list) return;
  list.querySelectorAll("[data-firestore-id]").forEach((card) => card.remove());

  let loaded = false;
  if (apiBaseUrl) {
    try {
      const headers = {};
      if (user) {
        const token = await user.getIdToken(true).catch(() => null);
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/api/portfolios`, { headers });
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        if (Array.isArray(result.portfolios) && result.portfolios.length > 0) {
          renderUploadedPortfolios(result.portfolios);
          loaded = true;
        }
      }
    } catch (apiError) {
      console.warn("Backend loadPortfolios failed:", apiError);
    }
  }

  if (!loaded) {
    try {
      const portfolios = await getPortfolios();
      if (Array.isArray(portfolios) && portfolios.length > 0) {
        renderUploadedPortfolios(portfolios);
        loaded = true;
      }
    } catch (firestoreError) {
      console.warn("Firestore loadPortfolios failed:", firestoreError);
    }
  }

  if (!loaded) {
    initStaticCards();
    renderAllCards();
  }
}

// Initialize on page load
initStaticCards();
renderAllCards();

filters.forEach((filter) => filter.addEventListener("change", renderAllCards));

// Load public portfolios immediately
loadPortfolios(auth.currentUser);

onAuthStateChanged(auth, async (user) => {
  isAdmin = false;
  if (user) {
    try {
      const tokenResult = await getIdTokenResult(user, true);
      isAdmin = tokenResult.claims.admin === true;
      if (isAdmin && uploadButton) {
        uploadButton.dataset.adminMode = "true";
        if (!uploadButton.parentElement?.querySelector("[data-admin-delete-portfolio]")) {
          const adminDeleteButton = document.createElement("button");
          adminDeleteButton.className = "delete-portfolio";
          adminDeleteButton.type = "button";
          adminDeleteButton.dataset.adminDeletePortfolio = "";
          adminDeleteButton.textContent = "เลือกลบพอร์ต";
          adminDeleteButton.addEventListener("click", () => {
            window.location.href = "admin.html#portfolio-list";
          });
          uploadButton.parentElement?.insertBefore(adminDeleteButton, uploadButton);
        }
        uploadButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.location.href = "admin.html";
        }, true);
      }
    } catch (error) {
      console.warn("ตรวจสอบสิทธิ์ Admin ไม่สำเร็จ", error);
    }
  }

  await loadPortfolios(user);
});
