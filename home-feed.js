import { getPortfolios, getReviews } from "./firebase-data.js";
import { getCachedPdfThumbnail, renderPdfPage1Thumbnail, TCASPdfViewer } from "./pdf-viewer.js";

// DOM Elements for Feeds
const portfolioTrack = document.querySelector('[data-content-list="portfolios"]');
const reviewTrack = document.querySelector('[data-content-list="reviews"]');

// DOM Elements for PDF Modal
const pdfModal = document.querySelector("[data-pdf-preview-modal]");
const pdfModalTitle = document.querySelector("[data-pdf-modal-title]");
const pdfModalUni = document.querySelector("[data-pdf-modal-uni]");
const pdfModalFaculty = document.querySelector("[data-pdf-modal-faculty]");
const pdfModalMajor = document.querySelector("[data-pdf-modal-major]");
const pdfModalSchool = document.querySelector("[data-pdf-modal-school]");
const pdfModalOwner = document.querySelector("[data-pdf-modal-owner]");
const pdfDownloadBtn = document.querySelector("[data-pdf-download-btn]");

// DOM Elements for Review Detail Modal & Lightbox
const reviewDetailModal = document.querySelector("[data-review-detail-modal]");
const closeReviewDetailBtn = document.querySelector("[data-close-review-detail]");
const detailCategoryEl = document.querySelector("[data-detail-category]");
const detailAwardEl = document.querySelector("[data-detail-award]");
const detailTitleEl = document.querySelector("[data-detail-title]");
const detailOrganizerEl = document.querySelector("[data-detail-organizer]");
const detailAuthorEl = document.querySelector("[data-detail-author]");
const detailDateEl = document.querySelector("[data-detail-date]");
const detailDescriptionEl = document.querySelector("[data-detail-description]");
const detailGallerySec = document.querySelector("[data-detail-gallery-sec]");
const detailGalleryGrid = document.querySelector("[data-detail-gallery-grid]");
const detailPhotoCountEl = document.querySelector("[data-detail-photo-count]");

// Lightbox Elements
const reviewLightbox = document.getElementById("reviewLightbox");
const reviewLightboxImg = document.getElementById("reviewLightboxImg");
const reviewLightboxClose = document.getElementById("reviewLightboxClose");
const reviewLightboxPrev = document.getElementById("reviewLightboxPrev");
const reviewLightboxNext = document.getElementById("reviewLightboxNext");
const reviewLightboxCounter = document.getElementById("reviewLightboxCounter");

let currentLightboxGallery = [];
let currentLightboxIndex = 0;
let pdfViewer = null;

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrl = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : window.location.origin;

// Helper: Create element with class and text
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

// Initialize PDF Viewer
if (pdfModal) {
  pdfViewer = new TCASPdfViewer({
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
}

function openPdfPreview(portfolio) {
  if (!portfolio || !pdfViewer) return;

  const ownerName = portfolio.ownerName || portfolio.title || "Portfolio";
  const uni = portfolio.university || "มหาวิทยาลัย";
  const faculty = portfolio.faculty || portfolio.track || "คณะ";
  const major = portfolio.major || "";
  const studentInfo = portfolio.studentInfo || portfolio.school || "";
  const advice = portfolio.advice || portfolio.contact || "";

  if (pdfModalTitle) pdfModalTitle.textContent = ownerName;
  if (pdfModalUni) pdfModalUni.textContent = uni;
  if (pdfModalFaculty) pdfModalFaculty.textContent = faculty;
  if (pdfModalMajor) {
    pdfModalMajor.textContent = major ? `สาขา ${major}` : "";
    pdfModalMajor.hidden = !major;
  }
  if (pdfModalSchool) {
    pdfModalSchool.textContent = studentInfo ? studentInfo : "";
    pdfModalSchool.hidden = !studentInfo;
  }
  if (pdfModalOwner) pdfModalOwner.textContent = `◉ เจ้าของ: ${ownerName}`;

  // Update Drawer
  const dOwner = document.querySelector("[data-detail-owner]");
  const dUni = document.querySelector("[data-detail-uni]");
  const dFaculty = document.querySelector("[data-detail-faculty]");
  const dMajor = document.querySelector("[data-detail-major]");
  const dStudent = document.querySelector("[data-detail-student]");
  const dAdvice = document.querySelector("[data-detail-advice]");

  if (dOwner) dOwner.textContent = ownerName;
  if (dUni) dUni.textContent = uni;
  if (dFaculty) dFaculty.textContent = faculty;
  if (dMajor) {
    dMajor.textContent = major ? `สาขา ${major}` : "";
    dMajor.hidden = !major;
  }
  if (dStudent) {
    dStudent.textContent = studentInfo || "-";
  }
  if (dAdvice) {
    dAdvice.textContent = advice || "ไม่มีข้อมูลคำแนะนำเพิ่มเติม";
  }

  // Set Download button
  if (pdfDownloadBtn) {
    pdfDownloadBtn.onclick = () => {
      if (portfolio.fileURL) {
        const a = document.createElement("a");
        a.href = portfolio.fileURL;
        a.download = `${ownerName}.pdf`;
        a.target = "_blank";
        a.click();
      }
    };
  }

  pdfViewer.load(portfolio);
}

const THEME_CYCLE = [
  "poster-blue",
  "poster-green",
  "poster-gold",
  "poster-purple",
  "poster-cyan",
  "poster-orange",
  "poster-rose"
];

// Load Genuine Portfolios on Homepage
async function loadHomePortfolios() {
  if (!portfolioTrack) return;

  let portfolios = [];

  // 1. Try Backend API (returns real submitted portfolios from Firestore)
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/portfolios`);
      if (response.ok) {
        const json = await response.json().catch(() => ({}));
        if (Array.isArray(json.portfolios) && json.portfolios.length > 0) {
          portfolios = json.portfolios;
        }
      }
    } catch (apiErr) {
      console.warn("Backend /api/portfolios fetch error:", apiErr);
    }
  }

  // 2. Try client-side Firestore if needed
  if (!portfolios.length) {
    try {
      const fsPortfolios = await getPortfolios();
      if (Array.isArray(fsPortfolios) && fsPortfolios.length > 0) {
        portfolios = fsPortfolios;
      }
    } catch (fsErr) {
      console.warn("Firestore getPortfolios error:", fsErr);
    }
  }

  portfolioTrack.innerHTML = "";

  if (portfolios.length === 0) {
    portfolioTrack.innerHTML = `
      <div class="home-feed-empty" style="padding: 24px; text-align: center; width: 100%; color: #64748b;">
        <strong>ยังไม่มีพอร์ตโฟลิโอในระบบ</strong>
      </div>
    `;
    return;
  }

  portfolios.forEach((portfolio, idx) => {
    const card = createElement("article", "portfolio-card-home");
    card.dataset.portfolioCard = "";

    const themeClass = portfolio.posterTheme || THEME_CYCLE[idx % THEME_CYCLE.length];
    const poster = createElement("div", `home-port-poster ${themeClass}`);

    const uni = portfolio.university || "มหาวิทยาลัย";
    const uniShort = portfolio.uniBadge || (uni.includes("จุฬา") ? "CU" : uni.includes("เกษตร") ? "KU" : uni.includes("มหิดล") ? "MU" : uni.includes("ธรรมศาสตร์") ? "TU" : uni.includes("ศิลปากร") ? "SU" : "TCAS");
    const ownerName = portfolio.ownerName || portfolio.title || "เจ้าของผลงาน";
    const faculty = portfolio.faculty || portfolio.track || "คณะ";
    const major = portfolio.major || "";

    // Instant stylized cover template
    poster.innerHTML = `
      <div class="portfolio-poster ${themeClass}" style="width:100%;height:100%;border-radius:10px;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:14px;box-sizing:border-box;">
        <span style="font-size:8px;font-weight:900;letter-spacing:0.12em;line-height:1.2;">แฟ้มสะสมผลงาน<br /><b style="font-size:14px;">PORTFOLIO</b></span>
        <i style="font-style:normal;font-size:22px;font-weight:900;opacity:0.25;position:absolute;top:10px;right:12px;">${uniShort}</i>
        <small style="font-size:10px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ownerName}</small>
      </div>
    `;

    if (portfolio.coverURL) {
      const img = createElement("img");
      img.src = portfolio.coverURL;
      img.alt = ownerName;
      img.loading = "lazy";
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      poster.replaceChildren(img);
    } else if (portfolio.fileURL) {
      const cachedThumb = getCachedPdfThumbnail(portfolio.fileURL);
      if (cachedThumb) {
        const img = createElement("img");
        img.src = cachedThumb;
        img.alt = ownerName;
        img.loading = "lazy";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
        poster.replaceChildren(img);
      } else {
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
          setTimeout(() => renderPdfPage1Thumbnail(portfolio.fileURL, poster), idx * 100);
        }
      }
    }

    const info = createElement("div", "home-port-info");
    const nameEl = createElement("strong", "home-port-owner", ownerName);
    const facultyEl = createElement("span", "home-port-faculty", [faculty, major ? `(${major})` : ""].filter(Boolean).join(" "));
    const uniEl = createElement("small", "home-port-uni", uni);

    info.append(nameEl, facultyEl, uniEl);
    card.append(poster, info);

    card.addEventListener("click", () => {
      openPdfPreview(portfolio);
    });

    portfolioTrack.appendChild(card);
  });
}

// Load Genuine Reviews on Homepage
async function loadHomeReviews() {
  if (!reviewTrack) return;

  let reviews = [];

  // 1. Try Backend API (/api/reviews)
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/reviews`);
      if (response.ok) {
        const json = await response.json().catch(() => ({}));
        if (Array.isArray(json.reviews) && json.reviews.length > 0) {
          reviews = json.reviews;
        }
      }
    } catch (apiErr) {
      console.warn("Backend /api/reviews fetch error:", apiErr);
    }
  }

  // 2. Try client-side Firestore if needed
  if (!reviews.length) {
    try {
      const fsReviews = await getReviews();
      if (Array.isArray(fsReviews) && fsReviews.length > 0) {
        reviews = fsReviews;
      }
    } catch (fsErr) {
      console.warn("Firestore getReviews error:", fsErr);
    }
  }

  reviewTrack.innerHTML = "";

  if (reviews.length === 0) {
    reviewTrack.innerHTML = `
      <div class="home-feed-empty" style="padding: 24px; text-align: center; width: 100%; color: #64748b;">
        <strong>ยังไม่มีรีวิวกิจกรรมในระบบ</strong>
      </div>
    `;
    return;
  }

  reviews.forEach((review) => {
    const card = createElement("article", "review-card");
    const photos = Array.isArray(review.photos) ? review.photos : [];

    if (photos.length > 0) {
      const img = createElement("img");
      img.src = photos[0];
      img.alt = review.title;
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;";
      img.loading = "lazy";
      card.appendChild(img);

      if (photos.length > 1) {
        const badge = createElement("span", "photo-count-badge", `📷 ${photos.length}`);
        badge.style.cssText = "position:absolute;top:10px;right:10px;z-index:2;background:rgba(15,23,42,0.75);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;backdrop-filter:blur(4px);";
        card.appendChild(badge);
      }
    } else if (review.staticClass) {
      const media = createElement("div", `card-photo ${review.staticClass}`);
      media.innerHTML = review.staticInner || `<span>${(review.title || "REVIEW").slice(0, 10)}</span>`;
      media.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;opacity:0.9;";
      card.appendChild(media);
    } else {
      const fallback = createElement("div", "card-photo");
      fallback.innerHTML = `<span><b>${(review.title || "REVIEW").slice(0, 12)}</b></span>`;
      fallback.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;opacity:0.85;font-weight:900;";
      card.appendChild(fallback);
    }

    const shade = createElement("div", "shade");
    card.appendChild(shade);

    if (review.award) {
      const awardTag = createElement("span", "story-award-tag", review.award);
      card.appendChild(awardTag);
    }

    const titleEl = createElement("strong", "", review.title);
    titleEl.style.cssText = "position:relative;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    const orgSub = review.organizer ? ` • ${review.organizer}` : "";
    const authorEl = createElement("small", "", `โดย ${review.author || review.authorName || "นิรนาม"}${orgSub} • ${review.category || "การแข่งขัน"}`);
    authorEl.style.cssText = "position:relative;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0.9;";

    card.append(titleEl, authorEl);

    card.addEventListener("click", () => {
      openReviewDetail(review);
    });

    reviewTrack.appendChild(card);
  });
}

// Open Review Detail Modal
function openReviewDetail(review) {
  if (!reviewDetailModal || !review) return;

  if (detailCategoryEl) detailCategoryEl.textContent = review.category || "การแข่งขัน";
  if (detailAwardEl) {
    if (review.award) {
      detailAwardEl.textContent = review.award;
      detailAwardEl.hidden = false;
    } else {
      detailAwardEl.hidden = true;
    }
  }

  if (detailTitleEl) detailTitleEl.textContent = review.title;

  if (detailOrganizerEl) {
    if (review.organizer) {
      detailOrganizerEl.textContent = `🏛️ ผู้จัด: ${review.organizer}`;
      detailOrganizerEl.hidden = false;
    } else {
      detailOrganizerEl.hidden = true;
    }
  }

  if (detailAuthorEl) detailAuthorEl.textContent = `เขียนโดย: ${review.author}`;
  if (detailDateEl) {
    const date = review.createdAt
      ? (review.createdAt.toDate ? review.createdAt.toDate() : new Date(review.createdAt)).toLocaleDateString("th-TH")
      : "";
    detailDateEl.textContent = date ? `เผยแพร่เมื่อ: ${date}` : "";
  }

  if (detailDescriptionEl) {
    detailDescriptionEl.textContent = review.description;
  }

  const photos = Array.isArray(review.photos) ? review.photos : [];
  currentLightboxGallery = photos;

  if (detailGallerySec && detailGalleryGrid) {
    detailGalleryGrid.innerHTML = "";
    if (photos.length > 0) {
      detailGallerySec.hidden = false;
      if (detailPhotoCountEl) detailPhotoCountEl.textContent = photos.length;

      photos.forEach((photoUrl, index) => {
        const item = createElement("div", "gallery-photo-item");
        const img = createElement("img");
        img.src = photoUrl;
        img.alt = `รูปภาพกิจกรรมที่ ${index + 1}`;
        img.loading = "lazy";

        item.appendChild(img);
        item.addEventListener("click", () => {
          openLightbox(index);
        });

        detailGalleryGrid.appendChild(item);
      });
    } else {
      detailGallerySec.hidden = true;
    }
  }

  reviewDetailModal.classList.add("open");
  reviewDetailModal.setAttribute("aria-hidden", "false");
}

function closeReviewDetail() {
  if (!reviewDetailModal) return;
  reviewDetailModal.classList.remove("open");
  reviewDetailModal.setAttribute("aria-hidden", "true");
}

closeReviewDetailBtn?.addEventListener("click", closeReviewDetail);
reviewDetailModal?.addEventListener("click", (e) => {
  if (e.target === reviewDetailModal) closeReviewDetail();
});

// Lightbox Viewer
function openLightbox(index) {
  if (!reviewLightbox || currentLightboxGallery.length === 0) return;
  currentLightboxIndex = Math.max(0, Math.min(index, currentLightboxGallery.length - 1));
  updateLightboxView();
  reviewLightbox.classList.add("open");
  reviewLightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  if (!reviewLightbox) return;
  reviewLightbox.classList.remove("open");
  reviewLightbox.setAttribute("aria-hidden", "true");
}

function updateLightboxView() {
  if (!reviewLightboxImg || !reviewLightboxCounter) return;
  reviewLightboxImg.src = currentLightboxGallery[currentLightboxIndex];
  reviewLightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxGallery.length}`;

  if (reviewLightboxPrev) {
    reviewLightboxPrev.style.display = currentLightboxGallery.length > 1 ? "grid" : "none";
  }
  if (reviewLightboxNext) {
    reviewLightboxNext.style.display = currentLightboxGallery.length > 1 ? "grid" : "none";
  }
}

reviewLightboxPrev?.addEventListener("click", (e) => {
  e.stopPropagation();
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxGallery.length) % currentLightboxGallery.length;
  updateLightboxView();
});

reviewLightboxNext?.addEventListener("click", (e) => {
  e.stopPropagation();
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxGallery.length;
  updateLightboxView();
});

reviewLightboxClose?.addEventListener("click", closeLightbox);
reviewLightbox?.addEventListener("click", (e) => {
  if (e.target === reviewLightbox) closeLightbox();
});

// Keyboard Navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (reviewLightbox && reviewLightbox.classList.contains("open")) {
      closeLightbox();
    } else if (reviewDetailModal && reviewDetailModal.classList.contains("open")) {
      closeReviewDetail();
    } else if (pdfViewer && pdfModal && pdfModal.classList.contains("open")) {
      pdfViewer.close();
    }
  } else if (reviewLightbox && reviewLightbox.classList.contains("open")) {
    if (e.key === "ArrowLeft") {
      currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxGallery.length) % currentLightboxGallery.length;
      updateLightboxView();
    } else if (e.key === "ArrowRight") {
      currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxGallery.length;
      updateLightboxView();
    }
  }
});

// =============================================================================
// Home Page - Camphub Activities Carousel
// =============================================================================

const activityTrack = document.querySelector('[data-content-list="activities"]');

function loadHomeActivities() {
  if (!activityTrack) return;
  const camps = window.CAMPHUB_ACTIVITIES || [];
  if (camps.length === 0) return;

  activityTrack.innerHTML = '';
  camps.forEach((camp) => {
    const card = document.createElement('article');
    card.className = 'home-activity-card';
    card.dataset.id = camp.id;

    const feeClass = camp.isFree ? 'free' : 'paid';

    card.innerHTML = `
      <div class="home-activity-poster ${camp.posterClass || 'poster-theme-general'}">
        ${camp.imageUrl ? `<img src="${camp.imageUrl}" alt="${camp.title}" loading="lazy" onerror="this.style.display='none'" />` : ''}
        <div class="home-activity-overlay"></div>
        <div class="home-activity-badge-row">
          <span class="home-activity-cat">${camp.categoryLabel}</span>
          ${camp.hasCertificate ? '<span class="home-activity-cert">🏆 มีเกียรติบัตร</span>' : ''}
        </div>
        <div class="home-activity-organizer">
          <span class="verified-icon">✓</span>
          <span>${camp.organizerShort || camp.organizer}</span>
        </div>
      </div>
      <div class="home-activity-body">
        <h3 class="home-activity-title" title="${camp.title}">${camp.title}</h3>
        <div class="home-activity-meta">
          <div class="home-activity-date">
            <span>📅</span>
            <span>${camp.eventDate.split('(')[0].trim()}</span>
          </div>
          <span class="home-activity-fee ${feeClass}">${camp.fee}</span>
        </div>
        <div class="home-activity-actions">
          <button class="btn-home-activity-view" type="button">ดูรายละเอียด</button>
          <a class="btn-home-activity-direct" href="${camp.directUrl || camp.camphubUrl || 'https://camphub.in.th'}" target="_blank" rel="noopener noreferrer" title="เปิดหน้ากิจกรรมในเว็บ Camphub">🔗 Camphub ↗</a>
        </div>
      </div>
    `;

    // Clicking card or view button navigates to activities.html
    const viewBtn = card.querySelector('.btn-home-activity-view');
    viewBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `activities.html?camp=${encodeURIComponent(camp.id)}`;
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-home-activity-direct')) return;
      window.location.href = `activities.html?camp=${encodeURIComponent(camp.id)}`;
    });

    activityTrack.appendChild(card);
  });
}

// Initialize all feeds in parallel for ultra-fast load time
Promise.allSettled([
  loadHomePortfolios(),
  loadHomeReviews(),
  loadHomeActivities(),
]);

