// =============================================================================
// TCAS Master - Camphub Camps & Activities Engine
// =============================================================================

const activitySearch = document.querySelector('[data-activity-search]');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const activityFilters = document.querySelectorAll('[data-activity-filter]');
const subFormatButtons = document.querySelectorAll('[data-sub-format]');
const subFeeButtons = document.querySelectorAll('[data-sub-fee]');
const subStatusButtons = document.querySelectorAll('[data-sub-status]');
const activityList = document.querySelector('[data-activity-list]');
const activityCount = document.querySelector('[data-activity-count]');
const activityEmpty = document.querySelector('[data-activity-empty]');
const activityToast = document.querySelector('[data-activity-toast]');

// Date filter tag elements
const activeDateFilterTag = document.getElementById('activeDateFilterTag');
const selectedDateText = document.getElementById('selectedDateText');
const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');

// Modal elements
const campDetailModal = document.getElementById('campDetailModal');
const closeCampModalBtn = document.getElementById('closeCampModalBtn');
const modalHeroCover = document.getElementById('modalHeroCover');
const modalPreviewImg = document.getElementById('modalPreviewImg');
const modalBadgeCat = document.getElementById('modalBadgeCat');
const modalBadgeFormat = document.getElementById('modalBadgeFormat');
const modalBadgeStatus = document.getElementById('modalBadgeStatus');
const modalCampTitle = document.getElementById('modalCampTitle');
const modalOrganizerName = document.getElementById('modalOrganizerName');
const modalEventDate = document.getElementById('modalEventDate');
const modalDeadline = document.getElementById('modalDeadline');
const modalLocation = document.getElementById('modalLocation');
const modalFee = document.getElementById('modalFee');
const modalDescription = document.getElementById('modalDescription');
const modalHighlightsList = document.getElementById('modalHighlightsList');
const modalBenefitsList = document.getElementById('modalBenefitsList');
const modalQualifications = document.getElementById('modalQualifications');
const modalContactLinks = document.getElementById('modalContactLinks');
const modalCamphubLink = document.getElementById('modalCamphubLink');
const modalRegisterLink = document.getElementById('modalRegisterLink');

// Calendar elements
const calendarDays = document.querySelector('[data-calendar-days]');
const calendarMonth = document.querySelector('[data-calendar-month]');
const calendarPrevBtn = document.querySelector('[data-calendar-prev]');
const calendarNextBtn = document.querySelector('[data-calendar-next]');

// State
let activeCategory = 'all';
let activeFormat = 'all';
let activeFee = 'all';
let activeStatus = 'all';
let selectedCalendarDay = null;
let selectedCalendarMonth = null;
let toastTimer = null;

// Calendar date state (defaults to September 2569 / 2026)
let calendarDate = new Date(2026, 8, 1); // Month 8 is September
const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function showActivityToast(message) {
  if (!activityToast) return;
  activityToast.textContent = message;
  activityToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => activityToast.classList.remove('show'), 2600);
}

// =============================================================================
// Render Activities Cards
// =============================================================================

function getAllActivities() {
  const defaultCamps = window.CAMPHUB_ACTIVITIES || [];
  return defaultCamps;
}

function renderActivities() {
  if (!activityList) return;
  const camps = getAllActivities();
  const query = activitySearch?.value.trim().toLowerCase() || '';

  if (clearSearchBtn) {
    clearSearchBtn.hidden = !query;
  }

  activityList.innerHTML = '';
  let visibleCount = 0;

  camps.forEach((camp) => {
    // 1. Search Query Filter
    const searchTarget = `${camp.title} ${camp.organizer} ${camp.categoryLabel} ${camp.location} ${camp.description}`.toLowerCase();
    const matchesSearch = !query || searchTarget.includes(query);

    // 2. Category Filter
    const matchesCategory = activeCategory === 'all' || camp.category === activeCategory;

    // 3. Sub Filters
    const matchesFormat = activeFormat === 'all' ||
      (activeFormat === 'onsite' && camp.format === 'onsite') ||
      (activeFormat === 'online' && (camp.format === 'online' || camp.format === 'hybrid'));

    const matchesFee = activeFee === 'all' || (activeFee === 'free' && camp.isFree);
    const matchesStatus = activeStatus === 'all' || (activeStatus === 'open' && camp.status === 'open');

    // 4. Calendar Date Filter
    let matchesDate = true;
    if (selectedCalendarDay !== null && selectedCalendarMonth !== null) {
      matchesDate = camp.dayNumber === selectedCalendarDay && camp.monthNumber === selectedCalendarMonth;
    }

    const show = matchesSearch && matchesCategory && matchesFormat && matchesFee && matchesStatus && matchesDate;

    if (show) {
      visibleCount++;
      const card = createCampCard(camp);
      activityList.appendChild(card);
    }
  });

  if (activityCount) activityCount.textContent = `${visibleCount} รายการ`;
  if (activityEmpty) activityEmpty.hidden = visibleCount !== 0;
}

function createCampCard(camp) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.dataset.id = camp.id;
  card.dataset.category = camp.category;

  const feeTagClass = camp.isFree ? 'tag-fee-free' : 'tag-fee-paid';

  card.innerHTML = `
    <div class="event-poster ${camp.posterClass || 'poster-theme-general'}">
      ${camp.imageUrl ? `<img class="event-poster-img" src="${camp.imageUrl}" alt="${camp.title}" loading="lazy" onerror="this.style.display='none'" />` : ''}
      <div class="poster-gradient-overlay"></div>
      <div class="poster-badge-row">
        <span class="poster-cat-badge">${camp.categoryLabel}</span>
        ${camp.hasCertificate ? '<span class="poster-cert-badge">🏆 มีเกียรติบัตร</span>' : ''}
      </div>
      <div class="poster-bottom-info">
        <div class="poster-organizer-text">
          <span class="verified-icon">✓</span>
          <span>${camp.organizerShort || camp.organizer}</span>
        </div>
      </div>
      <i class="poster-watermark">CAMP</i>
    </div>
    <div class="event-body">
      <div class="event-tags-row">
        <span class="tag-pill tag-format">${camp.formatLabel}</span>
        <span class="tag-pill tag-grade">${camp.targetGrade.split(' ')[0]}</span>
        <span class="tag-pill ${feeTagClass}">${camp.fee}</span>
      </div>
      <h3>${camp.title}</h3>
      <p>${camp.description}</p>
      <div class="event-meta-box">
        <div>
          <span>📅 วันจัดกิจกรรม:</span>
          <strong>${camp.eventDate}</strong>
        </div>
        <div>
          <span>⏰ ปิดรับสมัคร:</span>
          <strong style="color:${camp.status === 'closing_soon' ? '#dc2626' : '#0f172a'}">${camp.deadline}</strong>
        </div>
      </div>
      <div class="event-card-actions">
        <button class="btn-card-detail" type="button">🔍 ดูรายละเอียด</button>
        <a class="btn-card-camphub" href="${camp.directUrl || camp.camphubUrl || 'https://camphub.in.th'}" target="_blank" rel="noopener noreferrer" title="เปิดหน้ากิจกรรมในเว็บต้นทาง Camphub">🔗 เว็บกิจกรรม ↗</a>
      </div>
    </div>
  `;

  const detailBtn = card.querySelector('.btn-card-detail');
  detailBtn.addEventListener('click', () => openCampModal(camp));

  return card;
}

// =============================================================================
// Camp Detail Modal
// =============================================================================

function openCampModal(camp) {
  if (!campDetailModal) return;

  if (modalHeroCover) {
    modalHeroCover.className = `camp-modal-hero ${camp.posterClass || 'poster-theme-general'}`;
  }

  if (modalPreviewImg) {
    if (camp.imageUrl) {
      modalPreviewImg.src = camp.imageUrl;
      modalPreviewImg.style.display = 'block';
    } else {
      modalPreviewImg.style.display = 'none';
    }
  }

  if (modalBadgeCat) modalBadgeCat.textContent = camp.categoryLabel;
  if (modalBadgeFormat) modalBadgeFormat.textContent = camp.formatLabel;
  if (modalBadgeStatus) {
    modalBadgeStatus.textContent = camp.statusLabel;
    modalBadgeStatus.style.background = camp.status === 'closing_soon' ? '#fee2e2' : '#dcfce7';
    modalBadgeStatus.style.color = camp.status === 'closing_soon' ? '#b91c1c' : '#15803d';
  }

  if (modalCampTitle) modalCampTitle.textContent = camp.title;
  if (modalOrganizerName) modalOrganizerName.textContent = camp.organizer;
  if (modalEventDate) modalEventDate.textContent = camp.eventDate;
  if (modalDeadline) modalDeadline.textContent = camp.deadline;
  if (modalLocation) modalLocation.textContent = camp.location;
  if (modalFee) {
    modalFee.textContent = camp.fee;
    modalFee.style.color = camp.badgeColor || '#0284c7';
  }

  if (modalDescription) modalDescription.textContent = camp.description;

  // Highlights
  if (modalHighlightsList) {
    modalHighlightsList.innerHTML = '';
    (camp.highlights || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      modalHighlightsList.appendChild(li);
    });
  }

  // Benefits
  if (modalBenefitsList) {
    modalBenefitsList.innerHTML = '';
    (camp.benefits || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      modalBenefitsList.appendChild(li);
    });
  }

  // Qualifications & Schedule
  if (modalQualifications) {
    modalQualifications.textContent = `${camp.qualifications}\n\nกำหนดการ: ${camp.schedule || 'ตามที่ผู้จัดแจ้ง'}`;
  }

  // Contact
  if (modalContactLinks) {
    modalContactLinks.innerHTML = '';
    if (camp.contact) {
      if (camp.contact.facebook) {
        modalContactLinks.innerHTML += `<span>📘 Facebook: <b>${camp.contact.facebook}</b></span>`;
      }
      if (camp.contact.line) {
        modalContactLinks.innerHTML += `<span>💬 Line: <b>${camp.contact.line}</b></span>`;
      }
      if (camp.contact.phone) {
        modalContactLinks.innerHTML += `<span>📞 โทร: <b>${camp.contact.phone}</b></span>`;
      }
    }
  }

  // Links: Destination URLs
  const destinationUrl = camp.directUrl || camp.contact?.website || camp.camphubUrl || 'https://camphub.in.th';
  if (modalCamphubLink) {
    modalCamphubLink.href = camp.camphubUrl || destinationUrl;
  }
  if (modalRegisterLink) {
    modalRegisterLink.href = destinationUrl;
  }

  campDetailModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCampModal() {
  if (campDetailModal) campDetailModal.hidden = true;
  document.body.style.overflow = '';
}

closeCampModalBtn?.addEventListener('click', closeCampModal);
campDetailModal?.addEventListener('click', (e) => {
  if (e.target === campDetailModal) closeCampModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !campDetailModal?.hidden) closeCampModal();
});

// =============================================================================
// Filters & Search Event Listeners
// =============================================================================

activitySearch?.addEventListener('input', renderActivities);

clearSearchBtn?.addEventListener('click', () => {
  if (activitySearch) {
    activitySearch.value = '';
    renderActivities();
    activitySearch.focus();
  }
});

// Category filter tabs
activityFilters.forEach((filterBtn) => {
  filterBtn.addEventListener('click', () => {
    activityFilters.forEach((b) => b.classList.remove('active'));
    filterBtn.classList.add('active');
    activeCategory = filterBtn.dataset.activityFilter || 'all';
    renderActivities();
  });
});

// Format chips
subFormatButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    subFormatButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFormat = btn.dataset.subFormat || 'all';
    renderActivities();
  });
});

// Fee chips
subFeeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    subFeeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFee = btn.dataset.subFee || 'all';
    renderActivities();
  });
});

// Status chips
subStatusButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const isCurrentlyActive = btn.classList.contains('active');
    btn.classList.toggle('active', !isCurrentlyActive);
    activeStatus = !isCurrentlyActive ? 'open' : 'all';
    renderActivities();
  });
});

// Date filter clear
clearDateFilterBtn?.addEventListener('click', () => {
  selectedCalendarDay = null;
  selectedCalendarMonth = null;
  if (activeDateFilterTag) activeDateFilterTag.hidden = true;
  document.querySelectorAll('.calendar-days button').forEach((b) => b.classList.remove('selected'));
  renderActivities();
});

// =============================================================================
// Interactive Calendar Logic
// =============================================================================

function renderCalendar() {
  if (!calendarDays || !calendarMonth) return;
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  calendarMonth.textContent = `${monthNames[month]} ${year + 543}`;
  calendarDays.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  // Find all active event days for this month
  const camps = getAllActivities();
  const eventDaysSet = new Set(
    camps.filter((c) => c.monthNumber === month).map((c) => c.dayNumber)
  );

  for (let i = 0; i < 42; i++) {
    const day = i - firstDay + 1;
    const button = document.createElement('button');
    button.type = 'button';
    let shownDay = day;

    if (day < 1) {
      shownDay = daysInPreviousMonth + day;
      button.classList.add('muted');
    } else if (day > daysInMonth) {
      shownDay = day - daysInMonth;
      button.classList.add('muted');
    } else {
      // In current month
      if (eventDaysSet.has(day)) {
        button.classList.add('has-event');
      }
      if (selectedCalendarDay === day && selectedCalendarMonth === month) {
        button.classList.add('selected');
      }

      button.addEventListener('click', () => {
        if (selectedCalendarDay === day && selectedCalendarMonth === month) {
          // Deselect
          selectedCalendarDay = null;
          selectedCalendarMonth = null;
          if (activeDateFilterTag) activeDateFilterTag.hidden = true;
        } else {
          // Select date
          selectedCalendarDay = day;
          selectedCalendarMonth = month;
          if (activeDateFilterTag && selectedDateText) {
            selectedDateText.textContent = `${day} ${monthNames[month]}`;
            activeDateFilterTag.hidden = false;
          }
          showActivityToast(`กำลังแสดงค่ายในวันที่ ${day} ${monthNames[month]} ✦`);
        }
        renderCalendar();
        renderActivities();
      });
    }

    button.textContent = shownDay;
    calendarDays.appendChild(button);
  }
}

calendarPrevBtn?.addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

calendarNextBtn?.addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

// Refresh helper
window.bluePenguinRefreshActivities = () => {
  renderActivities();
  renderCalendar();
};

// Initial Render
renderActivities();
renderCalendar();

// Deep linking: Auto-open modal if URL contains ?camp=id
(function checkUrlCampParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const campId = params.get('camp');
    if (campId) {
      const allCamps = getAllActivities();
      const targetCamp = allCamps.find((c) => c.id === campId);
      if (targetCamp) {
        setTimeout(() => {
          openCampModal(targetCamp);
          const cardEl = document.querySelector(`.event-card[data-id="${campId}"]`);
          cardEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  } catch (err) {
    console.warn('Camp param parsing error:', err);
  }
})();


