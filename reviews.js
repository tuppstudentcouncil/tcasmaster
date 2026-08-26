import { getIdTokenResult, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getReviews, addReview, updateReview, deleteReview, reorderReviews } from "./firebase-data.js";

const MAX_PHOTOS = 8;
let allReviews = [];
let selectedPhotos = []; // Array of { id, dataUrl, name }
let currentLightboxGallery = [];
let currentLightboxIndex = 0;
let currentDetailReview = null;
let toastTimer;
let isAdmin = false;

// Check if running on localhost/preview
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// DOM Elements
const reviewSearchInput = document.querySelector("[data-review-search]");
const reviewListContainer = document.querySelector("[data-review-list]");
const reviewCountElement = document.querySelector("[data-review-count]");
const reviewEmptyElement = document.querySelector("[data-review-empty]");
const reviewModal = document.querySelector("[data-review-modal]");
const reviewForm = document.querySelector("[data-review-form]");
const toastElement = document.querySelector("[data-review-toast]");
const openReviewBtn = document.querySelector("[data-open-review]");
const closeReviewBtn = document.querySelector("[data-close-review]");

// Modal Dynamic Labels & Fields
const modalTitleEl = document.querySelector("[data-modal-title]");
const modalDescEl = document.querySelector("[data-modal-desc]");
const submitBtnEl = document.querySelector("[data-submit-btn]");
const reviewIdInput = document.getElementById("reviewIdInput");
const reviewTitleInput = document.getElementById("reviewTitleInput");
const reviewCategoryInput = document.getElementById("reviewCategoryInput");
const reviewAwardInput = document.getElementById("reviewAwardInput");
const reviewOrganizerInput = document.getElementById("reviewOrganizerInput");
const reviewAuthorInput = document.getElementById("reviewAuthorInput");
const reviewDescriptionInput = document.getElementById("reviewDescriptionInput");

// Photo Upload Elements
const reviewPhotosInput = document.getElementById("reviewPhotosInput");
const reviewDropzone = document.getElementById("reviewDropzone");
const reviewPhotosGrid = document.getElementById("reviewPhotosGrid");
const reviewPhotoCounter = document.getElementById("reviewPhotoCounter");

// Detail & Lightbox Elements
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
const detailAdminActionsEl = document.querySelector("[data-detail-admin-actions]");
const editReviewBtn = document.querySelector("[data-edit-review-btn]");
const deleteReviewBtn = document.querySelector("[data-delete-review-btn]");

// Lightbox Elements
const reviewLightbox = document.getElementById("reviewLightbox");
const reviewLightboxImg = document.getElementById("reviewLightboxImg");
const reviewLightboxClose = document.getElementById("reviewLightboxClose");
const reviewLightboxPrev = document.getElementById("reviewLightboxPrev");
const reviewLightboxNext = document.getElementById("reviewLightboxNext");
const reviewLightboxCounter = document.getElementById("reviewLightboxCounter");

// Menu toggle
document.querySelector(".menu-toggle")?.addEventListener("click", (event) => {
  const menu = document.querySelector(".main-nav");
  const open = menu.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

// Toast Helper
function showToast(message) {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("show"), 3000);
}

// Check Admin Status & Permissions
function setAdminStatus(status) {
  isAdmin = Boolean(status);
  
  // Show / Hide "New Review" button in hero (Only for Admin)
  if (openReviewBtn) {
    openReviewBtn.hidden = !isAdmin;
    openReviewBtn.style.display = isAdmin ? "" : "none";
  }

  // Update Detail modal admin actions (Only for Admin)
  if (detailAdminActionsEl) {
    detailAdminActionsEl.hidden = !isAdmin;
    detailAdminActionsEl.style.display = isAdmin ? "" : "none";
  }

  // Re-render cards to show/hide edit & delete buttons
  renderReviewCards();
}

// Listen to Firebase Auth for Genuine Admin Claim
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setAdminStatus(false);
    return;
  }

  try {
    const tokenResult = await getIdTokenResult(user, true);
    const hasAdminClaim = tokenResult.claims.admin === true;
    setAdminStatus(hasAdminClaim);
  } catch (err) {
    console.warn("ตรวจสอบสิทธิ์ Admin ไม่สำเร็จ", err);
    setAdminStatus(false);
  }
});

// Initial default status: non-admin (read-only)
setAdminStatus(false);

// Helper to read initial HTML static review cards
// Load Real Reviews from Backend API / Firestore
async function fetchAndRenderReviews() {
  if (reviewCountElement) {
    reviewCountElement.textContent = "กำลังโหลดรีวิว...";
  }

  let reviews = [];

  // 1. Try Backend API
  try {
    const apiBase = isLocal ? "http://localhost:3000" : (window.location.origin.includes("localhost") ? "http://localhost:3000" : "");
    if (apiBase) {
      const res = await fetch(`${apiBase}/api/reviews`);
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (Array.isArray(json.reviews)) {
          reviews = json.reviews;
        }
      }
    }
  } catch (apiErr) {
    console.warn("Backend /api/reviews fetch error:", apiErr);
  }

  // 2. Fallback to client-side Firestore
  if (!reviews.length) {
    try {
      const fsReviews = await getReviews();
      if (Array.isArray(fsReviews)) {
        reviews = fsReviews;
      }
    } catch (fsErr) {
      console.warn("Firestore getReviews error:", fsErr);
    }
  }

  allReviews = reviews;
  renderReviewCards();
}

// Client-side image compression
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handle Photo Selection (Max 8 photos)
async function handleFilesSelected(fileList) {
  const incomingFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  if (incomingFiles.length === 0) return;

  const remainingSlots = MAX_PHOTOS - selectedPhotos.length;
  if (remainingSlots <= 0) {
    showToast(`เพิ่มรูปภาพได้สูงสุด ${MAX_PHOTOS} รูป`);
    return;
  }

  const filesToAdd = incomingFiles.slice(0, remainingSlots);
  if (incomingFiles.length > remainingSlots) {
    showToast(`เพิ่มได้อีกเพียง ${remainingSlots} รูป (สูงสุด ${MAX_PHOTOS} รูป)`);
  }

  showToast("กำลังประมวลผลรูปภาพ...");
  for (const file of filesToAdd) {
    try {
      const dataUrl = await compressImage(file);
      selectedPhotos.push({
        id: "photo_" + Math.random().toString(36).substr(2, 9),
        dataUrl,
        name: file.name
      });
    } catch (err) {
      console.error("Error compressing image", err);
    }
  }

  updatePhotoPreviewGrid();
}

function updatePhotoPreviewGrid() {
  if (!reviewPhotosGrid || !reviewPhotoCounter) return;

  reviewPhotosGrid.innerHTML = "";
  reviewPhotoCounter.textContent = `${selectedPhotos.length} / ${MAX_PHOTOS} รูป`;

  if (selectedPhotos.length >= MAX_PHOTOS) {
    reviewPhotoCounter.style.color = "#dc2626";
    reviewPhotoCounter.style.background = "#fee2e2";
  } else {
    reviewPhotoCounter.style.color = "#2563eb";
    reviewPhotoCounter.style.background = "#eff6ff";
  }

  selectedPhotos.forEach((photo, index) => {
    const wrap = document.createElement("div");
    wrap.className = "review-photo-thumb-wrap";

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    img.alt = `รูปภาพที่ ${index + 1}`;

    const badge = document.createElement("span");
    badge.className = "review-photo-thumb-badge";
    badge.textContent = `${index + 1}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "review-photo-delete-btn";
    deleteBtn.type = "button";
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "ลบรูปนี้";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removePhoto(photo.id);
    });

    wrap.append(img, badge, deleteBtn);
    reviewPhotosGrid.appendChild(wrap);
  });
}

function removePhoto(photoId) {
  selectedPhotos = selectedPhotos.filter((p) => p.id !== photoId);
  updatePhotoPreviewGrid();
}

// Drag & Drop event listeners
if (reviewDropzone && reviewPhotosInput) {
  reviewPhotosInput.addEventListener("change", (e) => {
    handleFilesSelected(e.target.files);
    reviewPhotosInput.value = "";
  });

  reviewDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    reviewDropzone.classList.add("dragover");
  });

  reviewDropzone.addEventListener("dragleave", () => {
    reviewDropzone.classList.remove("dragover");
  });

  reviewDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    reviewDropzone.classList.remove("dragover");
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });
}

// Open / Close Form Modal
function openCreateModal() {
  if (!reviewModal) return;
  if (reviewForm) reviewForm.reset();
  if (reviewIdInput) reviewIdInput.value = "";
  if (reviewOrganizerInput) reviewOrganizerInput.value = "";
  if (modalTitleEl) modalTitleEl.textContent = "เขียนรีวิวงานแข่ง / ค่าย";
  if (modalDescEl) modalDescEl.textContent = "แบ่งปันประสบการณ์ เทคนิค และรูปภาพบรรยากาศการแข่งขันให้เพื่อน ๆ ในชุมชน";
  if (submitBtnEl) submitBtnEl.textContent = "เผยแพร่รีวิว";
  selectedPhotos = [];
  updatePhotoPreviewGrid();
  reviewModal.classList.add("open");
  reviewModal.setAttribute("aria-hidden", "false");
}

function openEditModal(review) {
  if (!reviewModal || !review) return;
  if (reviewIdInput) reviewIdInput.value = review.id;
  if (reviewTitleInput) reviewTitleInput.value = review.title || "";
  if (reviewCategoryInput) reviewCategoryInput.value = review.category || "การแข่งขัน";
  if (reviewAwardInput) reviewAwardInput.value = review.award || "";
  if (reviewOrganizerInput) reviewOrganizerInput.value = review.organizer || "";
  if (reviewAuthorInput) reviewAuthorInput.value = review.author || "";
  if (reviewDescriptionInput) reviewDescriptionInput.value = review.description || "";

  if (modalTitleEl) modalTitleEl.textContent = "แก้ไขรีวิวงานแข่ง / ค่าย";
  if (modalDescEl) modalDescEl.textContent = "แก้ไขข้อมูล รางวัล เรื่องเล่า และรูปภาพกิจกรรม (สูงสุด 8 รูป)";
  if (submitBtnEl) submitBtnEl.textContent = "บันทึกการแก้ไข";

  const existingPhotos = Array.isArray(review.photos) ? review.photos : [];
  selectedPhotos = existingPhotos.map((url, i) => ({
    id: "existing_" + i + "_" + Math.random().toString(36).substr(2, 5),
    dataUrl: url,
    name: `photo_${i + 1}`
  }));

  updatePhotoPreviewGrid();
  reviewModal.classList.add("open");
  reviewModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!reviewModal) return;
  reviewModal.classList.remove("open");
  reviewModal.setAttribute("aria-hidden", "true");
  if (reviewForm) reviewForm.reset();
  if (reviewOrganizerInput) reviewOrganizerInput.value = "";
  selectedPhotos = [];
  updatePhotoPreviewGrid();
}

openReviewBtn?.addEventListener("click", openCreateModal);
closeReviewBtn?.addEventListener("click", closeModal);
reviewModal?.addEventListener("click", (e) => {
  if (e.target === reviewModal) closeModal();
});

// Submit Form Handler (Add & Edit)
reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(reviewForm);
  const editId = String(reviewIdInput?.value || "").trim();
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "การแข่งขัน").trim();
  const award = String(formData.get("award") || "").trim();
  const organizer = String(formData.get("organizer") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title || !author || !description) {
    showToast("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
    return;
  }

  const reviewPayload = {
    title,
    category,
    award,
    organizer,
    author,
    description,
    photos: selectedPhotos.map((p) => p.dataUrl)
  };

  if (submitBtnEl) {
    submitBtnEl.disabled = true;
    submitBtnEl.textContent = "กำลังบันทึก...";
  }

  try {
    if (editId) {
      // Update existing review in Firestore
      await updateReview(editId, reviewPayload);
      const index = allReviews.findIndex((r) => r.id === editId);
      if (index !== -1) {
        allReviews[index] = { ...allReviews[index], ...reviewPayload, id: editId };
      }
      showToast("บันทึกการแก้ไขรีวิวเรียบร้อยแล้ว ✦");
      if (currentDetailReview && currentDetailReview.id === editId) {
        openReviewDetail(allReviews[index]);
      }
    } else {
      // Add new review in Firestore
      const docRef = await addReview(reviewPayload);
      const newReview = {
        id: docRef?.id || "rev_" + Date.now(),
        ...reviewPayload,
        createdAt: new Date().toISOString()
      };
      allReviews.unshift(newReview);
      showToast(`เผยแพร่รีวิวเรียบร้อยแล้ว (${newReview.photos.length} รูป) ✦`);
    }

    try {
      localStorage.setItem("blue-penguin-reviews-real", JSON.stringify(allReviews));
    } catch (_) {}

    closeModal();
    renderReviewCards();
  } catch (err) {
    console.error("Error saving review:", err);
    showToast("บันทึกรีวิวไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"));
  } finally {
    if (submitBtnEl) {
      submitBtnEl.disabled = false;
      submitBtnEl.textContent = editId ? "บันทึกการแก้ไข" : "เผยแพร่รีวิว";
    }
  }
});

// Delete Review Handler
async function handleDeleteReview(reviewId) {
  if (!isAdmin) {
    showToast("เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรีวิวได้");
    return;
  }

  if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้")) {
    return;
  }

  showToast("กำลังลบรีวิว...");
  try {
    await deleteReview(reviewId);
    allReviews = allReviews.filter((r) => r.id !== reviewId);
    try {
      localStorage.setItem("blue-penguin-reviews-real", JSON.stringify(allReviews));
    } catch (_) {}

    closeReviewDetail();
    renderReviewCards();
    showToast("ลบรีวิวเรียบร้อยแล้ว 🗑️");
  } catch (err) {
    console.error("Error deleting review:", err);
    // Fallback local delete
    allReviews = allReviews.filter((r) => r.id !== reviewId);
    try {
      localStorage.setItem("blue-penguin-reviews-real", JSON.stringify(allReviews));
    } catch (_) {}
    closeReviewDetail();
    renderReviewCards();
    showToast("ลบรีวิวเรียบร้อยแล้ว");
  }
}

// Reorder Review Handler (Admin)
async function handleMoveReview(reviewId, direction) {
  if (!isAdmin) return;
  const index = allReviews.findIndex((r) => r.id === reviewId);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allReviews.length) return;

  // Swap in array
  const temp = allReviews[index];
  allReviews[index] = allReviews[targetIndex];
  allReviews[targetIndex] = temp;

  renderReviewCards();
  showToast("กำลังบันทึกลำดับการจัดเรียง...");

  try {
    const orderedIds = allReviews.map((r) => r.id);
    await reorderReviews(orderedIds);
    try {
      localStorage.setItem("blue-penguin-reviews-real", JSON.stringify(allReviews));
    } catch (_) {}
    showToast("บันทึกการจัดเรียงรีวิวเรียบร้อยแล้ว ✦");
  } catch (err) {
    console.warn("Reorder reviews error:", err);
    showToast("บันทึกการจัดเรียงในเครื่องแล้ว");
  }
}

// Render Review Cards
function renderReviewCards() {
  if (!reviewListContainer) return;

  const query = String(reviewSearchInput?.value || "").trim().toLowerCase();
  reviewListContainer.innerHTML = "";

  const filtered = allReviews.filter((rev) => {
    if (!query) return true;
    const text = `${rev.title} ${rev.category} ${rev.organizer || ""} ${rev.award} ${rev.author} ${rev.description}`.toLowerCase();
    return text.includes(query);
  });

  if (reviewCountElement) {
    reviewCountElement.textContent = `${filtered.length} รีวิว`;
  }

  if (reviewEmptyElement) {
    reviewEmptyElement.hidden = filtered.length !== 0;
  }

  filtered.forEach((review, filterIndex) => {
    const card = document.createElement("article");
    card.className = "story-card";
    card.dataset.reviewCard = "";
    card.dataset.index = filterIndex;

    // Drag & Drop for Admin
    if (isAdmin) {
      card.draggable = true;

      const dragHandle = document.createElement("div");
      dragHandle.className = "story-card-drag-handle";
      dragHandle.innerHTML = "⠿";
      dragHandle.title = "คลิกลากเพื่อจัดเรียงลำดับ";
      dragHandle.addEventListener("click", (e) => e.stopPropagation());
      card.appendChild(dragHandle);

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(filterIndex));
        card.classList.add("is-dragging");
      });

      card.addEventListener("dragend", () => {
        document.querySelectorAll(".story-card").forEach((el) => {
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
        if (isNaN(fromIndex) || fromIndex === filterIndex) return;

        const [moved] = allReviews.splice(fromIndex, 1);
        allReviews.splice(filterIndex, 0, moved);

        renderReviewCards();
        showToast("กำลังบันทึกลำดับการจัดเรียง...");
        try {
          await reorderReviews(allReviews.map((r) => r.id));
          try {
            localStorage.setItem("blue-penguin-reviews-real", JSON.stringify(allReviews));
          } catch (_) {}
          showToast("บันทึกการจัดเรียงรีวิวเรียบร้อยแล้ว ✦");
        } catch (err) {
          console.warn("Reorder error:", err);
          showToast("บันทึกการจัดเรียงในเครื่องแล้ว");
        }
      });
    }

    // Image Wrap
    const imageWrap = document.createElement("div");
    imageWrap.className = "story-image-wrap";

    const photos = Array.isArray(review.photos) ? review.photos : [];
    if (photos.length > 0) {
      const img = document.createElement("img");
      img.className = "story-image";
      img.src = photos[0];
      img.alt = review.title;
      img.loading = "lazy";
      imageWrap.appendChild(img);

      if (photos.length > 1) {
        const photoBadge = document.createElement("span");
        photoBadge.className = "photo-count-badge";
        photoBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ${photos.length} รูป`;
        imageWrap.appendChild(photoBadge);
      }
    } else if (review.staticClass) {
      const fallback = document.createElement("div");
      fallback.className = review.staticClass;
      fallback.innerHTML = review.staticInner || `<span><b>${(review.title || "REVIEW").slice(0, 16)}</b></span>`;
      imageWrap.appendChild(fallback);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "story-image-fallback story-wrcf";
      fallback.innerHTML = `<span><b>${(review.title || "REVIEW").slice(0, 16)}</b></span>`;
      imageWrap.appendChild(fallback);
    }

    // Category Tag Badge
    if (review.category) {
      const catBadge = document.createElement("span");
      catBadge.className = "category-tag-badge";
      catBadge.textContent = review.category;
      imageWrap.appendChild(catBadge);
    }

    // Copy section
    const copy = document.createElement("div");
    copy.className = "story-copy";

    if (review.award) {
      const awardTag = document.createElement("span");
      awardTag.className = "story-award-tag";
      awardTag.textContent = review.award;
      copy.appendChild(awardTag);
    }

    const titleEl = document.createElement("h2");
    titleEl.textContent = review.title;

    const descEl = document.createElement("p");
    descEl.textContent = review.description;

    const authorRow = document.createElement("div");
    authorRow.className = "story-author";

    const avatar = document.createElement("span");
    avatar.className = "author-avatar avatar-blue";
    avatar.textContent = (review.author || "T").slice(0, 1).toUpperCase();

    const authorText = document.createElement("span");
    const orgText = review.organizer ? `🏛️ ${review.organizer}` : "";
    const subText = [orgText, review.category || "รีวิวจากชุมชน"].filter(Boolean).join(" · ");
    authorText.innerHTML = `<b>${review.author}</b><small>${subText}</small>`;

    authorRow.append(avatar, authorText);

    // Admin Action Buttons on Card (Reorder, Edit & Delete)
    if (isAdmin) {
      const adminActions = document.createElement("div");
      adminActions.className = "review-card-admin-actions";

      // Reorder buttons (Move Up / Move Down)
      const moveUpBtn = document.createElement("button");
      moveUpBtn.className = "card-admin-icon-btn reorder";
      moveUpBtn.type = "button";
      moveUpBtn.title = "เลื่อนขึ้น (จัดเรียงก่อนหน้า)";
      moveUpBtn.innerHTML = "▲";
      moveUpBtn.disabled = filterIndex === 0;
      moveUpBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await handleMoveReview(review.id, -1);
      });

      const moveDownBtn = document.createElement("button");
      moveDownBtn.className = "card-admin-icon-btn reorder";
      moveDownBtn.type = "button";
      moveDownBtn.title = "เลื่อนลง (จัดเรียงถัดไป)";
      moveDownBtn.innerHTML = "▼";
      moveDownBtn.disabled = filterIndex === filtered.length - 1;
      moveDownBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await handleMoveReview(review.id, 1);
      });

      const editBtn = document.createElement("button");
      editBtn.className = "card-admin-icon-btn edit";
      editBtn.type = "button";
      editBtn.title = "แก้ไขรีวิวนี้";
      editBtn.innerHTML = "✏️";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(review);
      });

      const delBtn = document.createElement("button");
      delBtn.className = "card-admin-icon-btn delete";
      delBtn.type = "button";
      delBtn.title = "ลบรีวิวนี้";
      delBtn.innerHTML = "🗑️";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteReview(review.id);
      });

      adminActions.append(moveUpBtn, moveDownBtn, editBtn, delBtn);
      authorRow.appendChild(adminActions);
    } else {
      const arrowBtn = document.createElement("button");
      arrowBtn.type = "button";
      arrowBtn.innerHTML = "→";
      arrowBtn.title = "อ่านรีวิวเต็ม";
      authorRow.appendChild(arrowBtn);
    }

    copy.append(titleEl, descEl, authorRow);
    card.append(imageWrap, copy);

    // Click to open details & photo gallery
    card.addEventListener("click", () => {
      openReviewDetail(review);
    });

    reviewListContainer.appendChild(card);
  });
}

// Open Review Detail Modal
function openReviewDetail(review) {
  if (!reviewDetailModal || !review) return;
  currentDetailReview = review;

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

  // Admin Actions in Detail View
  if (detailAdminActionsEl) {
    detailAdminActionsEl.hidden = !isAdmin;
  }

  const photos = Array.isArray(review.photos) ? review.photos : [];
  currentLightboxGallery = photos;

  if (detailGallerySec && detailGalleryGrid) {
    detailGalleryGrid.innerHTML = "";
    if (photos.length > 0) {
      detailGallerySec.hidden = false;
      if (detailPhotoCountEl) detailPhotoCountEl.textContent = photos.length;

      photos.forEach((photoUrl, index) => {
        const item = document.createElement("div");
        item.className = "gallery-photo-item";

        const img = document.createElement("img");
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
  currentDetailReview = null;
}

closeReviewDetailBtn?.addEventListener("click", closeReviewDetail);
reviewDetailModal?.addEventListener("click", (e) => {
  if (e.target === reviewDetailModal) closeReviewDetail();
});

// Detail Modal Admin Buttons
editReviewBtn?.addEventListener("click", () => {
  if (currentDetailReview) {
    openEditModal(currentDetailReview);
  }
});

deleteReviewBtn?.addEventListener("click", () => {
  if (currentDetailReview) {
    handleDeleteReview(currentDetailReview.id);
  }
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
    } else if (reviewModal && reviewModal.classList.contains("open")) {
      closeModal();
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

// Search input listener
reviewSearchInput?.addEventListener("input", renderReviewCards);

// Initial Fetch
fetchAndRenderReviews();


