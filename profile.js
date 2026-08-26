// =============================================================================
// TCAS Master - Profile Page Controller
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const tabButtons = document.querySelectorAll('[data-profile-tab]');
  const tabPanes = document.querySelectorAll('.profile-tab-pane');
  const toastEl = document.querySelector('.toast');
  let toastTimer = null;

  // Profile fields
  const userDisplayName = document.getElementById('userDisplayName');
  const userUsername = document.getElementById('userUsername');
  const userEmail = document.getElementById('userEmail');
  const profileForm = document.getElementById('profileForm');
  const formFullName = document.getElementById('formFullName');
  const formNickname = document.getElementById('formNickname');
  const formSchool = document.getElementById('formSchool');
  const formGrade = document.getElementById('formGrade');
  const formTrack = document.getElementById('formTrack');
  const formPhone = document.getElementById('formPhone');
  const formBio = document.getElementById('formBio');

  const btnAddSchool = document.getElementById('btnAddSchool');
  const btnEditProfile = document.getElementById('btnEditProfile');

  // GPAX inputs & Reset
  const gpaxInputs = [
    document.getElementById('gpaxSem1'),
    document.getElementById('gpaxSem2'),
    document.getElementById('gpaxSem3'),
    document.getElementById('gpaxSem4'),
    document.getElementById('gpaxSem5'),
    document.getElementById('gpaxSem6')
  ];
  const gpaxCalculatedValue = document.getElementById('gpaxCalculatedValue');
  const btnResetGpax = document.getElementById('btnResetGpax');

  // Dream Faculties Elements
  const btnToggleAddDreamFaculty = document.getElementById('btnToggleAddDreamFaculty');
  const addDreamFacultyFormCard = document.getElementById('addDreamFacultyFormCard');
  const dreamFacultyForm = document.getElementById('dreamFacultyForm');
  const dreamFacultyInput = document.getElementById('dreamFacultyInput');
  const dreamUniInput = document.getElementById('dreamUniInput');
  const dreamRoundInput = document.getElementById('dreamRoundInput');
  const dreamGpaxInput = document.getElementById('dreamGpaxInput');
  const btnCancelAddDream = document.getElementById('btnCancelAddDream');
  const dreamFacultyList = document.getElementById('dreamFacultyList');

  // Checklist items
  const todoItems = document.querySelectorAll('.todo-item');

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // =============================================================================
  // Tab Switching Logic
  // =============================================================================
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.profileTab;
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    tabButtons.forEach((b) => b.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-profile-tab="${tabId}"]`);
    const activePane = document.getElementById(`pane-${tabId}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) activePane.classList.add('active');

    window.location.hash = tabId;
  }

  if (window.location.hash) {
    const hashTab = window.location.hash.replace('#', '');
    if (document.getElementById(`pane-${hashTab}`)) {
      switchTab(hashTab);
    }
  }

  // =============================================================================
  // 1. Profile Data Persistence
  // =============================================================================
  function loadSavedProfile() {
    try {
      const savedData = localStorage.getItem('tcas_master_profile_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.fullName && formFullName) formFullName.value = data.fullName;
        if (data.fullName && userDisplayName) userDisplayName.textContent = data.fullName;
        if (data.nickname && formNickname) formNickname.value = data.nickname;
        if (data.school && formSchool) formSchool.value = data.school;
        if (data.grade && formGrade) formGrade.value = data.grade;
        if (data.track && formTrack) formTrack.value = data.track;
        if (data.phone && formPhone) formPhone.value = data.phone;
        if (data.bio && formBio) formBio.value = data.bio;
        if (data.username && userUsername) userUsername.textContent = `@${data.username.replace('@', '')}`;
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage:', e);
    }
  }

  loadSavedProfile();

  profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const profileData = {
      fullName: formFullName?.value.trim() || 'เจตต์นิภัทร์ เบ็ญจมิตรกุล',
      nickname: formNickname?.value.trim() || '',
      school: formSchool?.value.trim() || '',
      grade: formGrade?.value || 'ม.6',
      track: formTrack?.value || 'วิทย์-คณิต',
      phone: formPhone?.value.trim() || '',
      bio: formBio?.value.trim() || '',
      username: 'success04813'
    };

    try {
      localStorage.setItem('tcas_master_profile_data', JSON.stringify(profileData));
      if (userDisplayName) userDisplayName.textContent = profileData.fullName;
      showToast('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  });

  btnAddSchool?.addEventListener('click', () => {
    switchTab('profile-info');
    if (formSchool) {
      formSchool.focus();
      formSchool.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('กรอกชื่อโรงเรียนของคุณในช่องด้านล่าง');
    }
  });

  btnEditProfile?.addEventListener('click', () => {
    switchTab('profile-info');
    if (formFullName) {
      formFullName.focus();
      formFullName.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('แก้ไขข้อมูลและกดบันทึก');
    }
  });

  // =============================================================================
  // 2. GPAX Calculator - Defaults to 0, Persists User Input
  // =============================================================================
  function calculateGPAX() {
    if (!gpaxCalculatedValue) return;

    let total = 0;
    let count = 0;
    const gradesState = [];

    gpaxInputs.forEach((input, idx) => {
      if (!input) return;
      const rawVal = input.value.trim();
      const val = parseFloat(rawVal);

      if (rawVal !== '' && !isNaN(val) && val >= 0 && val <= 4.0) {
        total += val;
        count++;
        gradesState[idx] = val;
      } else {
        gradesState[idx] = '';
      }
    });

    if (count > 0) {
      const avg = (total / count).toFixed(2);
      gpaxCalculatedValue.textContent = avg;
    } else {
      gpaxCalculatedValue.textContent = '0.00';
    }

    // Save grades to localStorage
    try {
      localStorage.setItem('tcas_master_gpax_grades', JSON.stringify(gradesState));
    } catch (e) {
      console.warn('GPAX storage error:', e);
    }
  }

  function loadSavedGPAX() {
    try {
      const savedGrades = localStorage.getItem('tcas_master_gpax_grades');
      if (savedGrades) {
        const grades = JSON.parse(savedGrades);
        if (Array.isArray(grades)) {
          grades.forEach((val, idx) => {
            if (gpaxInputs[idx] && val !== '' && val !== null && val !== undefined) {
              gpaxInputs[idx].value = val;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not load GPAX from localStorage:', e);
    }
    calculateGPAX();
  }

  gpaxInputs.forEach((input) => {
    input?.addEventListener('input', calculateGPAX);
  });

  btnResetGpax?.addEventListener('click', () => {
    gpaxInputs.forEach((input) => {
      if (input) input.value = '';
    });
    calculateGPAX();
    try {
      localStorage.removeItem('tcas_master_gpax_grades');
    } catch (e) {}
    showToast('รีเซ็ตเกรดทั้งหมดเป็น 0 เรียบร้อยแล้ว');
  });

  loadSavedGPAX();

  // =============================================================================
  // 3. Dream Faculties (คณะในฝัน - User Customizable)
  // =============================================================================
  function getDreamFaculties() {
    try {
      const saved = localStorage.getItem('tcas_master_dream_faculties');
      if (saved) {
        return JSON.parse(saved) || [];
      }
    } catch (e) {
      console.warn('Dream faculties parse error:', e);
    }
    return [];
  }

  function saveDreamFaculties(faculties) {
    try {
      localStorage.setItem('tcas_master_dream_faculties', JSON.stringify(faculties));
    } catch (e) {
      console.warn('Dream faculties save error:', e);
    }
    renderDreamFaculties();
  }

  function renderDreamFaculties() {
    if (!dreamFacultyList) return;
    const faculties = getDreamFaculties();

    if (faculties.length === 0) {
      dreamFacultyList.innerHTML = `
        <div class="dream-faculty-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <h3>ยังไม่มีคณะในฝันที่บันทึกไว้</h3>
          <p>กดปุ่ม "+ เพิ่มคณะในฝัน" ด้านบน เพื่อกรอกคณะและมหาวิทยาลัยที่คุณตั้งเป้าหมาย</p>
          <button class="btn-profile-primary" type="button" id="btnEmptyAddDream">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>เพิ่มคณะในฝันตอนนี้</span>
          </button>
        </div>
      `;

      document.getElementById('btnEmptyAddDream')?.addEventListener('click', () => {
        if (addDreamFacultyFormCard) {
          addDreamFacultyFormCard.hidden = false;
          dreamFacultyInput?.focus();
        }
      });
      return;
    }

    dreamFacultyList.innerHTML = '';
    faculties.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'dream-faculty-card';

      const minGpaxText = item.minGpax && parseFloat(item.minGpax) > 0 ? `เกรดขั้นต่ำ GPAX ${parseFloat(item.minGpax).toFixed(2)}+` : 'ไม่กำหนดเกรดขั้นต่ำ';

      card.innerHTML = `
        <div class="dream-card-top">
          <span class="dream-rank-badge">อันดับที่ ${index + 1}</span>
          <button class="btn-dream-delete" type="button" data-delete-id="${item.id}" title="ลบคณะนี้">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <h3 class="dream-card-faculty">${item.faculty}</h3>
        <div class="dream-card-uni">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4 6 4v14M13 3v4"/></svg>
          <span>${item.university}</span>
        </div>
        <div class="dream-card-meta">
          <span class="dream-card-round">${item.round || 'TCAS'}</span>
          <span class="dream-card-gpax">${minGpaxText}</span>
        </div>
      `;

      card.querySelector('.btn-dream-delete')?.addEventListener('click', () => {
        const remaining = faculties.filter((f) => f.id !== item.id);
        saveDreamFaculties(remaining);
        showToast(`ลบคณะ ${item.faculty} แล้ว`);
      });

      dreamFacultyList.appendChild(card);
    });
  }

  // Toggle Dream Faculty Form
  btnToggleAddDreamFaculty?.addEventListener('click', () => {
    if (addDreamFacultyFormCard) {
      addDreamFacultyFormCard.hidden = !addDreamFacultyFormCard.hidden;
      if (!addDreamFacultyFormCard.hidden) {
        dreamFacultyInput?.focus();
      }
    }
  });

  btnCancelAddDream?.addEventListener('click', () => {
    if (addDreamFacultyFormCard) addDreamFacultyFormCard.hidden = true;
  });

  // Submit Dream Faculty Form
  dreamFacultyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const faculty = dreamFacultyInput?.value.trim();
    const university = dreamUniInput?.value.trim();
    const round = dreamRoundInput?.value;
    const minGpax = dreamGpaxInput?.value.trim() || '0';

    if (!faculty || !university) {
      showToast('กรุณากรอกชื่อคณะและมหาวิทยาลัยให้ครบถ้วน');
      return;
    }

    const currentFaculties = getDreamFaculties();
    const newFacultyItem = {
      id: `dream_${Date.now()}`,
      faculty,
      university,
      round,
      minGpax,
      createdAt: new Date().toISOString()
    };

    currentFaculties.push(newFacultyItem);
    saveDreamFaculties(currentFaculties);

    // Reset Form
    if (dreamFacultyInput) dreamFacultyInput.value = '';
    if (dreamUniInput) dreamUniInput.value = '';
    if (dreamGpaxInput) dreamGpaxInput.value = '';
    if (addDreamFacultyFormCard) addDreamFacultyFormCard.hidden = true;

    showToast(`เพิ่ม "${faculty} ${university}" ในคณะในฝันแล้ว`);
  });

  renderDreamFaculties();

  // =============================================================================
  // 4. TCAS Checklist To-Do Logic with Persistence
  // =============================================================================
  function getSavedChecklist() {
    try {
      const saved = localStorage.getItem('tcas_master_checklist_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 1: true, 2: true }; // Default items 1 & 2 checked
  }

  function saveChecklist(state) {
    try {
      localStorage.setItem('tcas_master_checklist_state', JSON.stringify(state));
    } catch (e) {}
  }

  const checklistState = getSavedChecklist();

  todoItems.forEach((item) => {
    const id = item.dataset.todoId;
    if (checklistState[id]) {
      item.classList.add('completed');
    } else {
      item.classList.remove('completed');
    }

    item.addEventListener('click', () => {
      item.classList.toggle('completed');
      const isDone = item.classList.contains('completed');
      checklistState[id] = isDone;
      saveChecklist(checklistState);
      showToast(isDone ? 'ทำเครื่องหมายเสร็จสิ้นแล้ว' : 'ยกเลิกเครื่องหมาย');
    });
  });
});
