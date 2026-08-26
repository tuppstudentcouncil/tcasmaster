// PDF Viewer powered by Mozilla PDF.js - Renders PDF pages directly into HTML5 Canvas
let pdfjsLibLoaded = null;

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (pdfjsLibLoaded) return pdfjsLibLoaded;

  pdfjsLibLoaded = new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.head.appendChild(script);
  });

  return pdfjsLibLoaded;
}

// Global Toast Notification Helper for Loading States
export function showToastNotification(message, duration = 3000) {
  let toast = document.querySelector(".tcas-global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "tcas-global-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(15, 23, 42, 0.95);
      color: #ffffff;
      padding: 12px 22px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(10px);
      z-index: 999999;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="font-size:15px;animation:tcasSpin 1s linear infinite;display:inline-block;">⏳</span> <span>${message}</span>`;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(100px)";
  }, duration);
}

// Inject Spin Keyframe once
if (!document.getElementById("tcas-viewer-styles")) {
  const style = document.createElement("style");
  style.id = "tcas-viewer-styles";
  style.textContent = `
    @keyframes tcasSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pdf-loading-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: tcasSpin 0.8s linear infinite; margin: 0 auto; }
    .poster-loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; z-index: 5; border-radius: inherit; color: #334155; font-size: 10px; font-weight: 700; text-align: center; padding: 10px; box-sizing: border-box; }
    .poster-loading-overlay .poster-spinner { width: 20px; height: 20px; border: 2.5px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: tcasSpin 0.7s linear infinite; }
  `;
  document.head.appendChild(style);
}

export class TCASPdfViewer {
  constructor(options = {}) {
    this.modal = options.modal;
    this.container = options.container;
    this.thumbnailContainer = options.thumbnailContainer;
    this.loadingElement = options.loadingElement;
    this.errorElement = options.errorElement;
    this.pageInput = options.pageInput;
    this.pageCountSpan = options.pageCountSpan;
    this.zoomLabel = options.zoomLabel;
    this.sidebar = options.sidebar;
    this.detailsDrawer = options.detailsDrawer;

    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.15;
    this.rotation = 0;
    this.isContinuous = false;
    this.activeRenderTasks = new Map();
    this.currentPortfolio = null;

    this.initControls(options);
  }

  showLoading(customText = "กำลังเปิดเอกสาร Portfolio...") {
    if (this.loadingElement) {
      this.loadingElement.innerHTML = `
        <div class="pdf-loading-spinner"></div>
        <strong style="font-size:15px;color:#1e293b;margin-top:12px;display:block;">${customText}</strong>
        <p style="font-size:12px;color:#64748b;margin-top:4px;margin-bottom:0;text-align:center;line-height:1.4;">
          อาจใช้ระยะเวลาในการดาวน์โหลดและประมวลผลสักครู่ กรุณารอสักครู่... ⏳
        </p>
      `;
      this.loadingElement.style.display = "flex";
      this.loadingElement.removeAttribute("hidden");
      this.loadingElement.classList.remove("hidden");
    }
    showToastNotification("กำลังเปิดเอกสาร อาจใช้ระยะเวลาในการโหลดสักครู่ ⏳", 3000);
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
      this.loadingElement.setAttribute("hidden", "true");
      this.loadingElement.classList.add("hidden");
    }
  }

  initControls(options) {
    options.prevBtn?.addEventListener("click", () => this.prevPage());
    options.nextBtn?.addEventListener("click", () => this.nextPage());
    options.zoomInBtn?.addEventListener("click", () => this.zoomIn());
    options.zoomOutBtn?.addEventListener("click", () => this.zoomOut());
    options.fitWidthBtn?.addEventListener("click", () => this.fitWidth());
    options.rotateBtn?.addEventListener("click", () => this.rotate());
    options.scrollModeBtn?.addEventListener("click", () => this.toggleContinuous());
    options.thumbToggleBtn?.addEventListener("click", () => this.toggleSidebar());
    options.detailsToggleBtn?.addEventListener("click", () => this.toggleDetailsDrawer());
    options.fullscreenBtn?.addEventListener("click", () => this.toggleFullscreen());
    options.closeBtn?.addEventListener("click", () => this.close());

    if (this.pageInput) {
      this.pageInput.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1 && val <= this.totalPages) {
          this.goToPage(val);
        } else {
          e.target.value = this.currentPage;
        }
      });
      this.pageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      });
    }

    // Keyboard shortcuts inside open modal
    document.addEventListener("keydown", (e) => {
      if (!this.modal?.classList.contains("open")) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        this.zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        this.zoomOut();
      } else if (e.key === "Escape") {
        this.close();
      }
    });

    // Handle modal backdrop click
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(portfolio) {
    return this.load(portfolio);
  }

  async load(portfolio) {
    this.currentPortfolio = portfolio;
    this.currentPage = 1;
    this.rotation = 0;
    this.pdfDoc = null;
    this.cancelAllRenderTasks();

    if (this.container) this.container.innerHTML = "";
    if (this.thumbnailContainer) this.thumbnailContainer.innerHTML = "";
    this.showLoading();

    this.modal?.classList.add("open");
    this.modal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.populateDetails(portfolio);

    const fileURL = portfolio.fileURL || "";

    if (!fileURL) {
      this.renderSamplePortfolio(portfolio);
      return;
    }

    try {
      const pdfjs = await loadPdfJs();
      
      const cleanUrl = fileURL.replace(/\/fl_attachment:[^/]+\//, "/");
      let fetchUrl = cleanUrl;
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (cleanUrl.startsWith("http")) {
        const proxyBase = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : "";
        fetchUrl = proxyBase ? `${proxyBase}/api/pdf-proxy?url=${encodeURIComponent(cleanUrl)}` : cleanUrl;
      }

      try {
        const loadingTask = pdfjs.getDocument({
          url: fetchUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
          disableAutoFetch: true,
          disableStream: false,
          rangeChunkSize: 131072,
        });
        this.pdfDoc = await loadingTask.promise;
      } catch (proxyErr) {
        if (fetchUrl !== cleanUrl) {
          const loadingTask = pdfjs.getDocument({
            url: cleanUrl,
            cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
            cMapPacked: true,
          });
          this.pdfDoc = await loadingTask.promise;
        } else {
          throw proxyErr;
        }
      }
      this.totalPages = this.pdfDoc.numPages;

      if (this.pageCountSpan) this.pageCountSpan.textContent = this.totalPages;
      if (this.pageInput) {
        this.pageInput.value = 1;
        this.pageInput.max = this.totalPages;
      }
      this.updateZoomDisplay();

      // Render main pages first, then hide loading overlay
      await this.renderAllPages();
      this.hideLoading();

      // Generate thumbnails in background
      this.generateThumbnails();
    } catch (error) {
      console.warn("Failed to load live PDF:", error);
      this.renderSamplePortfolio(portfolio);
    }
  }

  cancelAllRenderTasks() {
    this.activeRenderTasks.forEach((task) => {
      try {
        task.cancel();
      } catch {}
    });
    this.activeRenderTasks.clear();
  }

  async renderAllPages() {
    if (!this.container || !this.pdfDoc) return;
    this.cancelAllRenderTasks();
    this.container.innerHTML = "";

    if (this.isContinuous) {
      this.container.classList.add("continuous-mode");
      for (let i = 1; i <= this.totalPages; i++) {
        const pageWrapper = document.createElement("div");
        pageWrapper.className = "pdf-page-card";
        pageWrapper.dataset.pageNum = i;

        const canvas = document.createElement("canvas");
        canvas.className = "pdf-page-canvas";
        pageWrapper.appendChild(canvas);

        const pageLabel = document.createElement("div");
        pageLabel.className = "pdf-page-badge";
        pageLabel.textContent = `หน้า ${i} / ${this.totalPages}`;
        pageWrapper.appendChild(pageLabel);

        this.container.appendChild(pageWrapper);
        this.renderSinglePageToCanvas(i, canvas);
      }
    } else {
      this.container.classList.remove("continuous-mode");
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "pdf-page-card single-page-card";
      pageWrapper.dataset.pageNum = this.currentPage;

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page-canvas";
      pageWrapper.appendChild(canvas);

      this.container.appendChild(pageWrapper);
      await this.renderSinglePageToCanvas(this.currentPage, canvas);
    }

    this.updateControlsState();
  }

  async renderSinglePageToCanvas(pageNum, canvas) {
    if (!this.pdfDoc) return;
    try {
      // Cancel previous task on this canvas if any
      if (this.activeRenderTasks.has(canvas)) {
        try {
          this.activeRenderTasks.get(canvas).cancel();
        } catch {}
        this.activeRenderTasks.delete(canvas);
      }

      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.scale, rotation: this.rotation });

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      const renderContext = {
        canvasContext: ctx,
        transform: transform,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      this.activeRenderTasks.set(canvas, renderTask);

      await renderTask.promise;
      this.activeRenderTasks.delete(canvas);
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        console.warn(`Render error on page ${pageNum}:`, err);
      }
    }
  }

  async generateThumbnails() {
    if (!this.thumbnailContainer || !this.pdfDoc) return;
    this.thumbnailContainer.innerHTML = "";

    for (let i = 1; i <= this.totalPages; i++) {
      const thumbBtn = document.createElement("button");
      thumbBtn.className = `pdf-thumb-item ${i === this.currentPage ? "active" : ""}`;
      thumbBtn.type = "button";
      thumbBtn.title = `ไปที่หน้า ${i}`;
      thumbBtn.dataset.thumbPage = i;

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-thumb-canvas";
      thumbBtn.appendChild(canvas);

      const label = document.createElement("span");
      label.textContent = `หน้า ${i}`;
      thumbBtn.appendChild(label);

      thumbBtn.addEventListener("click", () => {
        this.goToPage(i);
      });

      this.thumbnailContainer.appendChild(thumbBtn);

      // Render low-res thumbnail
      try {
        const page = await this.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Thumbnail render failed for page ${i}`, err);
        }
      }
    }
  }

  renderSamplePortfolio(portfolio) {
    this.hideLoading();
    if (!this.container) return;
    this.container.innerHTML = "";

    const title = portfolio.title || "Portfolio ผลงาน TCAS";
    const owner = portfolio.ownerName || "นักเรียน TCAS Master";
    const uni = portfolio.university || "มหาวิทยาลัยชั้นนำ";
    const track = portfolio.track || "คณะ / สาขาวิชาที่สนใจ";
    const school = portfolio.school || "โรงเรียนมัธยมศึกษา";
    const desc = portfolio.description || "รวบรวมกิจกรรม ผลงาน และเกียรติบัตรเพื่อการยื่นรอบ Portfolio";

    this.totalPages = 3;
    if (this.pageCountSpan) this.pageCountSpan.textContent = "3";
    if (this.pageInput) {
      this.pageInput.value = this.currentPage;
      this.pageInput.max = 3;
    }

    const pagesData = [
      {
        page: 1,
        title: "PORTFOLIO",
        sub: "แฟ้มสะสมผลงานเข้าศึกษาต่อระดับอุดมศึกษา",
        theme: "cover-gradient",
        content: `
          <div class="sample-cover-badge">TCAS MASTER · PORTFOLIO</div>
          <h1 class="sample-title">${title}</h1>
          <div class="sample-divider"></div>
          <div class="sample-owner-box">
            <strong>${owner}</strong>
            <p>โรงเรียน: ${school}</p>
            <p>เป้าหมาย: ${uni}</p>
            <p>สาขาวิชา: ${track}</p>
          </div>
        `,
      },
      {
        page: 2,
        title: "ACTIVITIES & PROJECTS",
        sub: "กิจกรรมและผลงานโดดเด่น (Highlights)",
        theme: "page-light",
        content: `
          <h2 class="sample-sec-title">กิจกรรมและโครงงานเด่น</h2>
          <p class="sample-desc">${desc}</p>
          <div class="sample-grid">
            <div class="sample-card">
              <span class="sample-icon">🏆</span>
              <strong>รางวัลและการแข่งขัน</strong>
              <p>ผ่านการแข่งขันระดับภูมิภาค/ระดับชาติ ได้รับรางวัลและเกียรติบัตรเชิดชูเกียรติ</p>
            </div>
            <div class="sample-card">
              <span class="sample-icon">🔬</span>
              <strong>โครงงานและการวิจัย</strong>
              <p>จัดทำโครงงานเชิงประยุกต์และนำเสนอผลงานร่วมกับอาจารย์ที่ปรึกษา</p>
            </div>
            <div class="sample-card">
              <span class="sample-icon">🤝</span>
              <strong>กิจกรรมจิตอาสาและผู้นำ</strong>
              <p>มีส่วนร่วมในการจัดกิจกรรมค่ายและบำเพ็ญประโยชน์เพื่อสังคมอย่างต่อเนื่อง</p>
            </div>
          </div>
        `,
      },
      {
        page: 3,
        title: "STATEMENT OF PURPOSE",
        sub: "เหตุผลและแรงบันดาลใจในการศึกษาต่อ",
        theme: "page-light",
        content: `
          <h2 class="sample-sec-title">แรงบันดาลใจและความมุ่งมั่น</h2>
          <div class="sample-sop-box">
            <p>“ความตั้งใจในการเข้าศึกษาใน <strong>${uni}</strong> ภาควิชา <strong>${track}</strong> เกิดจากความสนใจและประสบการณ์ในการลงมือทำจริงตลอดช่วงมัธยมศึกษาตอนปลาย”</p>
            <p>“การได้ศึกษาต่อในสถาบันแห่งนี้จะช่วยต่อยอดทักษะและความรู้ เพื่อสร้างสรรค์นวัตกรรมและประโยชน์ให้กับสังคมในอนาคต”</p>
          </div>
          <div class="sample-footer-sign">
            <span>ลงชื่อ: <strong>${owner}</strong></span>
            <small>ผู้สมัครเข้าศึกษาต่อ TCAS</small>
          </div>
        `,
      },
    ];

    if (this.isContinuous) {
      this.container.classList.add("continuous-mode");
      pagesData.forEach((p) => {
        const pageCard = document.createElement("div");
        pageCard.className = `pdf-page-card sample-page-card ${p.theme}`;
        pageCard.innerHTML = `
          <div class="sample-page-content">${p.content}</div>
          <div class="pdf-page-badge">หน้า ${p.page} / 3</div>
        `;
        this.container.appendChild(pageCard);
      });
    } else {
      this.container.classList.remove("continuous-mode");
      const currentData = pagesData[this.currentPage - 1] || pagesData[0];
      const pageCard = document.createElement("div");
      pageCard.className = `pdf-page-card single-page-card sample-page-card ${currentData.theme}`;
      pageCard.innerHTML = `
        <div class="sample-page-content">${currentData.content}</div>
        <div class="pdf-page-badge">หน้า ${currentData.page} / 3</div>
      `;
      this.container.appendChild(pageCard);
    }

    if (this.thumbnailContainer) {
      this.thumbnailContainer.innerHTML = "";
      pagesData.forEach((p) => {
        const thumbBtn = document.createElement("button");
        thumbBtn.className = `pdf-thumb-item ${p.page === this.currentPage ? "active" : ""}`;
        thumbBtn.type = "button";
        thumbBtn.innerHTML = `
          <div class="sample-thumb-mini">${p.page}</div>
          <span>หน้า ${p.page}</span>
        `;
        thumbBtn.addEventListener("click", () => this.goToPage(p.page));
        this.thumbnailContainer.appendChild(thumbBtn);
      });
    }

    this.updateControlsState();
  }

  goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages) return;
    this.currentPage = pageNum;
    if (this.pageInput) this.pageInput.value = this.currentPage;

    // Update thumbnail highlights
    const thumbs = this.thumbnailContainer?.querySelectorAll(".pdf-thumb-item");
    thumbs?.forEach((thumb) => {
      thumb.classList.toggle("active", parseInt(thumb.dataset.thumbPage, 10) === this.currentPage);
    });

    if (this.isContinuous) {
      const targetCard = this.container?.querySelector(`[data-page-num="${pageNum}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      if (this.pdfDoc) {
        this.renderAllPages();
      } else if (this.currentPortfolio) {
        this.renderSamplePortfolio(this.currentPortfolio);
      }
    }

    this.updateControlsState();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  zoomIn() {
    if (this.scale < 3.0) {
      this.scale = parseFloat((this.scale + 0.2).toFixed(2));
      this.updateZoomDisplay();
      this.renderAllPages();
    }
  }

  zoomOut() {
    if (this.scale > 0.6) {
      this.scale = parseFloat((this.scale - 0.2).toFixed(2));
      this.updateZoomDisplay();
      this.renderAllPages();
    }
  }

  fitWidth() {
    const containerWidth = this.container?.clientWidth || 800;
    this.scale = parseFloat((containerWidth / 750).toFixed(2));
    this.updateZoomDisplay();
    this.renderAllPages();
  }

  rotate() {
    this.rotation = (this.rotation + 90) % 360;
    this.renderAllPages();
  }

  toggleContinuous() {
    this.isContinuous = !this.isContinuous;
    if (this.pdfDoc) {
      this.renderAllPages();
    } else if (this.currentPortfolio) {
      this.renderSamplePortfolio(this.currentPortfolio);
    }
  }

  toggleSidebar() {
    this.sidebar?.classList.toggle("collapsed");
  }

  toggleDetailsDrawer() {
    this.detailsDrawer?.classList.toggle("collapsed");
  }

  populateDetails(portfolio) {
    if (!this.modal || !portfolio) return;
    const owner = portfolio.ownerName || portfolio.title || "เจ้าของผลงาน";
    const uni = portfolio.university || "ยังไม่ระบุมหาวิทยาลัย";
    const faculty = portfolio.faculty || portfolio.track || "ยังไม่ระบุคณะ";
    const major = portfolio.major || "";
    const student = portfolio.studentInfo || portfolio.school || "";
    const contact = portfolio.contact || "";
    const advice = portfolio.description || portfolio.advice || "";

    const ownerEl = this.modal.querySelector("[data-detail-owner], [data-admin-detail-owner]");
    if (ownerEl) ownerEl.textContent = owner;

    const uniEl = this.modal.querySelector("[data-detail-uni], [data-admin-detail-uni]");
    if (uniEl) uniEl.textContent = uni;

    const facultyEl = this.modal.querySelector("[data-detail-faculty], [data-admin-detail-faculty]");
    if (facultyEl) facultyEl.textContent = faculty;

    const majorEl = this.modal.querySelector("[data-detail-major], [data-admin-detail-major]");
    if (majorEl) {
      majorEl.textContent = major;
      majorEl.hidden = !major;
    }

    const studentEl = this.modal.querySelector("[data-detail-student], [data-admin-detail-student]");
    const studentSec = this.modal.querySelector("[data-detail-student-sec], [data-admin-detail-student-sec]");
    if (studentEl) {
      studentEl.innerHTML = student ? student.replace(/\n/g, "<br>") : "ไม่ระบุ";
      if (studentSec) studentSec.hidden = !student;
    }

    const contactEl = this.modal.querySelector("[data-detail-contact], [data-admin-detail-contact]");
    const contactSec = this.modal.querySelector("[data-detail-contact-sec], [data-admin-detail-contact-sec]");
    if (contactEl) {
      contactEl.textContent = contact || "";
      if (contactSec) contactSec.hidden = !contact;
    }

    const adviceEl = this.modal.querySelector("[data-detail-advice], [data-admin-detail-advice]");
    const adviceSec = this.modal.querySelector("[data-detail-advice-sec], [data-admin-detail-advice-sec]");
    const divider = this.modal.querySelector("[data-detail-divider], [data-admin-detail-divider]");
    if (adviceEl) {
      adviceEl.textContent = advice || "";
      if (adviceSec) adviceSec.hidden = !advice;
    }
    if (divider) divider.hidden = !advice;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.modal?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  updateZoomDisplay() {
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  updateControlsState() {
    const prevBtn = this.modal?.querySelector("[data-pdf-prev]");
    const nextBtn = this.modal?.querySelector("[data-pdf-next]");
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
  }

  close() {
    this.cancelAllRenderTasks();
    this.modal?.classList.remove("open");
    this.modal?.setAttribute("aria-hidden", "true");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    document.body.style.overflow = "";
    if (this.container) this.container.innerHTML = "";
    if (this.thumbnailContainer) this.thumbnailContainer.innerHTML = "";
    this.pdfDoc = null;
  }
}

// In-Memory & SessionStorage Cache for PDF Page 1 Thumbnails
const thumbnailMemoryCache = new Map();

export function getCachedPdfThumbnail(url) {
  if (!url) return null;
  if (thumbnailMemoryCache.has(url)) return thumbnailMemoryCache.get(url);
  try {
    const sessionVal = sessionStorage.getItem(`pdf_thumb_${url}`);
    if (sessionVal) {
      thumbnailMemoryCache.set(url, sessionVal);
      return sessionVal;
    }
  } catch (_) {}
  return null;
}

class ThumbnailQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    const { fn, resolve, reject } = this.queue.shift();
    this.running++;
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.next();
      });
  }
}

const thumbnailQueue = new ThumbnailQueue(2);

export async function renderPdfPage1Thumbnail(url, posterElement) {
  if (!url || !posterElement) return;

  // 1. Check instant memory/session cache
  const cachedDataUrl = getCachedPdfThumbnail(url);
  if (cachedDataUrl) {
    const img = document.createElement("img");
    img.src = cachedDataUrl;
    img.alt = "Portfolio Cover";
    img.loading = "lazy";
    img.className = "portfolio-cover-img";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;";
    posterElement.replaceChildren(img);
    return;
  }

  // 2. Show a lightweight loading indicator inside the poster placeholder while rendering
  posterElement.style.position = "relative";
  let loadingOverlay = posterElement.querySelector(".poster-loading-overlay");
  if (!loadingOverlay) {
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "poster-loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="poster-spinner"></div>
      <span>กำลังโหลดภาพปก...<br><small style="font-size:8.5px;color:#64748b;font-weight:600;">อาจใช้เวลาสักครู่</small></span>
    `;
    posterElement.appendChild(loadingOverlay);
  }

  // 3. Queue rendering in the background without blocking UI
  thumbnailQueue.add(async () => {
    try {
      const pdfjs = await loadPdfJs();
      const cleanUrl = url.replace(/\/fl_attachment:[^/]+\//, "/");
      let fetchUrl = cleanUrl;
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (cleanUrl.startsWith("http")) {
        const apiOrigin = isLocal ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000") : "";
        fetchUrl = apiOrigin ? `${apiOrigin}/api/pdf-proxy?url=${encodeURIComponent(cleanUrl)}` : cleanUrl;
      }

      let pdfDoc;
      try {
        const loadingTask = pdfjs.getDocument({
          url: fetchUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
          disableAutoFetch: true,
          disableStream: false,
          rangeChunkSize: 65536,
        });
        pdfDoc = await loadingTask.promise;
      } catch (proxyErr) {
        if (fetchUrl !== cleanUrl) {
          const loadingTask = pdfjs.getDocument({
            url: cleanUrl,
            cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
            cMapPacked: true,
            disableAutoFetch: true,
            disableStream: false,
          });
          pdfDoc = await loadingTask.promise;
        } else {
          throw proxyErr;
        }
      }

      const page = await pdfDoc.getPage(1);

      const baseViewport = page.getViewport({ scale: 1.0 });
      const targetWidth = 280;
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d", { alpha: false });
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

      // Save to cache
      thumbnailMemoryCache.set(url, dataUrl);
      try {
        sessionStorage.setItem(`pdf_thumb_${url}`, dataUrl);
      } catch (_) {}

      // Replace placeholder with crisp thumbnail image
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "Portfolio Cover";
      img.className = "portfolio-cover-img";
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;transition:opacity 0.25s ease;";
      posterElement.replaceChildren(img);
    } catch (err) {
      console.warn("PDF Page 1 thumbnail render note:", err);
      loadingOverlay?.remove();
    }
  });
}
