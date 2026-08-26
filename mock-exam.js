// =============================================================================
// TCAS Master - Mock Exam Engine & Interactive Test Runner
// =============================================================================

const searchInput = document.querySelector('[data-exam-search]');
const typeButtons = document.querySelectorAll('[data-exam-type]');
const categoryButtons = document.querySelectorAll('[data-category]');
let examCards = [...document.querySelectorAll('[data-exam-card]')];
const resultCount = document.querySelector('[data-result-count]');
const emptyState = document.querySelector('[data-exam-empty]');
const toast = document.querySelector('[data-exam-toast]');

let activeType = 'online';
let activeCategory = 'all';
let toastTimer;

// Runner Elements
const mockRunnerOverlay = document.getElementById('mockRunnerOverlay');
const runnerExamTitle = document.getElementById('runnerExamTitle');
const runnerSectionBadge = document.getElementById('runnerSectionBadge');
const runnerTimer = document.getElementById('runnerTimer');
const runnerTimerBox = document.getElementById('runnerTimerBox');
const runnerSubmitBtn = document.getElementById('runnerSubmitBtn');
const runnerCloseBtn = document.getElementById('runnerCloseBtn');

const questionNumberTag = document.getElementById('questionNumberTag');
const questionPointsTag = document.getElementById('questionPointsTag');
const btnFlagQuestion = document.getElementById('btnFlagQuestion');
const questionTextBox = document.getElementById('questionTextBox');
const questionAnswersArea = document.getElementById('questionAnswersArea');
const questionStatusText = document.getElementById('questionStatusText');
const btnPrevQuestion = document.getElementById('btnPrevQuestion');
const btnNextQuestion = document.getElementById('btnNextQuestion');

const answeredProgressText = document.getElementById('answeredProgressText');
const answeredProgressFill = document.getElementById('answeredProgressFill');
const palettePart1 = document.getElementById('palettePart1');
const palettePart2 = document.getElementById('palettePart2');

// Result Modal Elements
const mockResultOverlay = document.getElementById('mockResultOverlay');
const resultModalTitle = document.getElementById('resultModalTitle');
const resultCloseBtn = document.getElementById('resultCloseBtn');
const resultTotalScore = document.getElementById('resultTotalScore');
const resultGradeBadge = document.getElementById('resultGradeBadge');
const resultComment = document.getElementById('resultComment');
const resultCorrectCount = document.getElementById('resultCorrectCount');
const resultWrongCount = document.getElementById('resultWrongCount');
const resultFreeCount = document.getElementById('resultFreeCount');
const resultTimeSpent = document.getElementById('resultTimeSpent');
const solutionsList = document.getElementById('solutionsList');
const resultRetakeBtn = document.getElementById('resultRetakeBtn');
const solFilterBtns = document.querySelectorAll('.sol-filter-btn');

// State Variables
let currentExamData = null;
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionNumber: answerString }
let flaggedQuestions = new Set();
let timerInterval = null;
let secondsRemaining = 0;
let totalDurationSeconds = 0;
let examStartTime = 0;
let currentSolFilter = 'all';

// Toast Notification
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// Category & Search Filters
function updateCategoryCounts() {
  categoryButtons.forEach((button) => {
    const count = examCards.filter((card) => {
      const matchesType = card.dataset.type === activeType;
      const matchesCat = button.dataset.category === 'all' || card.dataset.category === button.dataset.category;
      return matchesType && matchesCat;
    }).length;
    const countElement = button.querySelector('small');
    if (countElement) countElement.textContent = String(count);
  });
}

function renderExams() {
  updateCategoryCounts();
  const query = searchInput?.value.trim().toLowerCase() || '';
  let visible = 0;
  examCards.forEach((card) => {
    const matchesType = card.dataset.type === activeType;
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const matchesSearch = !query || (card.dataset.search || '').includes(query);
    const show = matchesType && matchesCategory && matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (resultCount) resultCount.textContent = `${visible} รายการ`;
  if (emptyState) emptyState.hidden = visible !== 0;
}

searchInput?.addEventListener('input', renderExams);

typeButtons.forEach((button) => button.addEventListener('click', () => {
  activeType = button.dataset.examType;
  typeButtons.forEach((item) => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-selected', String(item === button));
  });
  renderExams();
}));

categoryButtons.forEach((button) => button.addEventListener('click', () => {
  activeCategory = button.dataset.category;
  categoryButtons.forEach((item) => item.classList.toggle('active', item === button));
  renderExams();
}));

// =============================================================================
// Mock Test Runner Logic
// =============================================================================

function startMockExam(examId) {
  let examData = null;
  if (examId === 'a-level-math2-68' || !examId) {
    examData = window.A_LEVEL_MATH2_EXAM;
  }

  if (!examData) {
    showToast('ชุดข้อสอบนี้ยังอยู่ในระหว่างการนำเข้าข้อมูล ✦');
    return;
  }

  currentExamData = examData;
  currentQuestionIndex = 0;
  userAnswers = {};
  flaggedQuestions.clear();
  totalDurationSeconds = (currentExamData.durationMinutes || 90) * 60;
  secondsRemaining = totalDurationSeconds;
  examStartTime = Date.now();

  if (runnerExamTitle) runnerExamTitle.textContent = currentExamData.title;

  initPalette();
  renderCurrentQuestion();
  startTimer();

  if (mockRunnerOverlay) mockRunnerOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimerDisplay();

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      showToast('⏰ หมดเวลาทำข้อสอบ ระบบกำลังส่งกระดาษคำตอบ...');
      submitExam(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (!runnerTimer) return;
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  runnerTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (secondsRemaining <= 300) { // Less than 5 mins
    runnerTimerBox?.classList.add('warning');
  } else {
    runnerTimerBox?.classList.remove('warning');
  }
}

// Build Palette Grid
function initPalette() {
  if (!palettePart1 || !palettePart2 || !currentExamData) return;
  palettePart1.innerHTML = '';
  palettePart2.innerHTML = '';

  currentExamData.questions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.type = 'button';
    btn.textContent = q.number;
    btn.dataset.index = idx;
    btn.dataset.qNum = q.number;

    btn.addEventListener('click', () => {
      currentQuestionIndex = idx;
      renderCurrentQuestion();
    });

    if (q.part === 1) {
      palettePart1.appendChild(btn);
    } else {
      palettePart2.appendChild(btn);
    }
  });

  updatePaletteStatus();
}

function updatePaletteStatus() {
  if (!currentExamData) return;
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = currentExamData.questions.length;

  if (answeredProgressText) answeredProgressText.textContent = `${answeredCount} / ${totalQuestions} ข้อ`;
  if (answeredProgressFill) answeredProgressFill.style.width = `${(answeredCount / totalQuestions) * 100}%`;

  document.querySelectorAll('.palette-btn').forEach((btn) => {
    const qNum = Number(btn.dataset.qNum);
    const isAnswered = userAnswers[qNum] !== undefined && userAnswers[qNum] !== '';
    const isCurrent = Number(btn.dataset.index) === currentQuestionIndex;
    const isFlagged = flaggedQuestions.has(qNum);

    btn.classList.toggle('answered', isAnswered);
    btn.classList.toggle('current', isCurrent);
    btn.classList.toggle('flagged', isFlagged);
  });
}

// Render Current Question
function renderCurrentQuestion() {
  if (!currentExamData || !currentExamData.questions[currentQuestionIndex]) return;
  const q = currentExamData.questions[currentQuestionIndex];
  const totalQuestions = currentExamData.questions.length;

  if (questionNumberTag) questionNumberTag.textContent = `ข้อที่ ${q.number} / ${totalQuestions}`;
  if (questionPointsTag) questionPointsTag.textContent = `${q.points} คะแนน`;
  if (runnerSectionBadge) {
    runnerSectionBadge.textContent = q.part === 1
      ? 'ตอนที่ 1 : ปรนัย 5 ตัวเลือก (ข้อละ 3 คะแนน)'
      : 'ตอนที่ 2 : อัตนัยระบายคำตอบเป็นตัวเลข (ข้อละ 5 คะแนน)';
  }

  if (btnFlagQuestion) {
    btnFlagQuestion.classList.toggle('active', flaggedQuestions.has(q.number));
    btnFlagQuestion.textContent = flaggedQuestions.has(q.number) ? '🚩 เลิกทำเครื่องหมาย' : '🚩 ทำเครื่องหมาย';
  }

  if (questionTextBox) {
    questionTextBox.textContent = q.text;
  }

  if (questionAnswersArea) {
    questionAnswersArea.innerHTML = '';

    if (q.type === 'choice') {
      q.choices.forEach((choiceStr, cIdx) => {
        const choiceNum = String(cIdx + 1);
        const card = document.createElement('label');
        card.className = `choice-label-card ${userAnswers[q.number] === choiceNum ? 'selected' : ''}`;

        card.innerHTML = `
          <div class="choice-radio-circle"></div>
          <span class="choice-text-span">${choiceStr}</span>
        `;

        card.addEventListener('click', () => {
          userAnswers[q.number] = choiceNum;
          document.querySelectorAll('.choice-label-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          updatePaletteStatus();
          updateQuestionStatusText();
        });

        questionAnswersArea.appendChild(card);
      });
    } else if (q.type === 'numeric') {
      const wrap = document.createElement('div');
      wrap.className = 'numeric-box-wrapper';
      wrap.innerHTML = `
        <label for="numericInput">พิมพ์คำตอบที่เป็นตัวเลข (จำนวนเต็ม หรือ ทศนิยม)</label>
        <input class="numeric-input-field" type="text" id="numericInput" placeholder="เช่น 511 หรือ 3.25" value="${userAnswers[q.number] || ''}" />
        <small class="numeric-hint-small">💡 ระบายตัวเลขลงในกระดาษคำตอบ (ตามเฉลยข้อสอบ ทปอ.)</small>
      `;

      const input = wrap.querySelector('#numericInput');
      input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          userAnswers[q.number] = val;
        } else {
          delete userAnswers[q.number];
        }
        updatePaletteStatus();
        updateQuestionStatusText();
      });

      questionAnswersArea.appendChild(wrap);
    }
  }

  // Prev / Next Navigation
  if (btnPrevQuestion) btnPrevQuestion.disabled = currentQuestionIndex === 0;
  if (btnNextQuestion) {
    if (currentQuestionIndex === totalQuestions - 1) {
      btnNextQuestion.textContent = 'ส่งกระดาษคำตอบ 📝';
      btnNextQuestion.classList.add('btn-success');
    } else {
      btnNextQuestion.textContent = 'ข้อถัดไป ›';
      btnNextQuestion.classList.remove('btn-success');
    }
  }

  updateQuestionStatusText();
  updatePaletteStatus();
}

function updateQuestionStatusText() {
  if (!currentExamData || !questionStatusText) return;
  const q = currentExamData.questions[currentQuestionIndex];
  const ans = userAnswers[q.number];
  if (ans !== undefined && ans !== '') {
    questionStatusText.textContent = `✓ ตอบแล้ว (${q.type === 'choice' ? `ตัวเลือกที่ ${ans}` : `คำตอบ: ${ans}`})`;
    questionStatusText.style.color = '#15803d';
  } else {
    questionStatusText.textContent = '○ ยังไม่ได้ตอบข้อนี้';
    questionStatusText.style.color = '#64748b';
  }
}

// Navigation Events
btnPrevQuestion?.addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
});

btnNextQuestion?.addEventListener('click', () => {
  if (currentQuestionIndex < currentExamData.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  } else {
    promptSubmitExam();
  }
});

btnFlagQuestion?.addEventListener('click', () => {
  if (!currentExamData) return;
  const qNum = currentExamData.questions[currentQuestionIndex].number;
  if (flaggedQuestions.has(qNum)) {
    flaggedQuestions.delete(qNum);
  } else {
    flaggedQuestions.add(qNum);
  }
  btnFlagQuestion.classList.toggle('active', flaggedQuestions.has(qNum));
  btnFlagQuestion.textContent = flaggedQuestions.has(qNum) ? '🚩 เลิกทำเครื่องหมาย' : '🚩 ทำเครื่องหมาย';
  updatePaletteStatus();
});

// Close Room Confirmation
runnerCloseBtn?.addEventListener('click', () => {
  if (confirm('คุณต้องการออกจากห้องสอบหรือไม่? ข้อมูลคำตอบที่ทำไว้จะถูกยกเลิก')) {
    clearInterval(timerInterval);
    if (mockRunnerOverlay) mockRunnerOverlay.hidden = true;
    document.body.style.overflow = '';
  }
});

runnerSubmitBtn?.addEventListener('click', () => {
  promptSubmitExam();
});

function promptSubmitExam() {
  const answeredCount = Object.keys(userAnswers).length;
  const total = currentExamData.questions.length;
  const remaining = total - answeredCount;

  let msg = `คุณตอบไปแล้ว ${answeredCount} / ${total} ข้อ`;
  if (remaining > 0) {
    msg += `\n⚠️ ยังมีข้อที่ยังไม่ได้ตอบอีก ${remaining} ข้อ!`;
  }
  msg += '\n\nคุณแน่ใจหรือไม่ว่าต้องการส่งกระดาษคำตอบเพื่อดูผลคะแนน?';

  if (confirm(msg)) {
    submitExam(false);
  }
}

// =============================================================================
// Scoring & Results Engine
// =============================================================================

function submitExam(isAuto = false) {
  clearInterval(timerInterval);
  if (mockRunnerOverlay) mockRunnerOverlay.hidden = true;
  document.body.style.overflow = '';

  const timeSpentSeconds = totalDurationSeconds - Math.max(0, secondsRemaining);
  const timeSpentMins = Math.floor(timeSpentSeconds / 60);
  const timeSpentSecs = timeSpentSeconds % 60;
  const timeSpentFormatted = `${timeSpentMins}:${String(timeSpentSecs).padStart(2, '0')} นาที`;

  let totalEarnedScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let freeCount = 0;

  const evaluatedQuestions = currentExamData.questions.map((q) => {
    const userAns = (userAnswers[q.number] || '').trim();
    let isCorrect = false;
    let isFree = q.isFree === true || q.correctAnswer === 'ฟรีทุกข้อ';

    if (isFree) {
      isCorrect = true;
      freeCount++;
      totalEarnedScore += q.points;
    } else if (q.type === 'choice') {
      if (userAns === q.correctAnswer) {
        isCorrect = true;
        correctCount++;
        totalEarnedScore += q.points;
      } else {
        wrongCount++;
      }
    } else if (q.type === 'numeric') {
      // Clean numeric comparison (e.g. "511" vs "511.00" or "3.25" vs "0003.25")
      const parsedUser = parseFloat(userAns);
      const parsedCorrect = parseFloat(q.correctAnswer);
      if (!isNaN(parsedUser) && !isNaN(parsedCorrect) && Math.abs(parsedUser - parsedCorrect) < 0.001) {
        isCorrect = true;
        correctCount++;
        totalEarnedScore += q.points;
      } else {
        wrongCount++;
      }
    }

    return {
      ...q,
      userAnswer: userAns,
      isCorrect,
      isFree
    };
  });

  renderResultModal({
    totalScore: totalEarnedScore,
    maxScore: currentExamData.totalScore || 100,
    correctCount,
    wrongCount,
    freeCount,
    timeSpent: timeSpentFormatted,
    evaluatedQuestions
  });
}

function renderResultModal(resultData) {
  const { totalScore, maxScore, correctCount, wrongCount, freeCount, timeSpent, evaluatedQuestions } = resultData;

  if (resultTotalScore) resultTotalScore.textContent = totalScore;
  if (resultCorrectCount) resultCorrectCount.textContent = `${correctCount} ข้อ`;
  if (resultWrongCount) resultWrongCount.textContent = `${wrongCount} ข้อ`;
  if (resultFreeCount) resultFreeCount.textContent = `${freeCount} ข้อ`;
  if (resultTimeSpent) resultTimeSpent.textContent = timeSpent;

  let grade = 'ระดับ B+ (ความพร้อมดี)';
  let comment = 'คุณทำคะแนนได้ดี มีพื้นฐานแน่น ปรับปรุงจุดที่ยังผิดพลาดอีกเล็กน้อยจะเพิ่มคะแนนได้อีกมาก!';
  let gradeBg = '#eff6ff';
  let gradeColor = '#2563eb';

  if (totalScore >= 80) {
    grade = 'ระดับ A+ (โดดเด่นมาก ✦)';
    comment = 'ยอดเยี่ยมมาก! คะแนนอยู่ในระดับท็อปของประเทศ มีโอกาสติดคณะและมหาวิทยาลัยเป้าหมายสูงมาก!';
    gradeBg = '#dcfce7';
    gradeColor = '#15803d';
  } else if (totalScore >= 65) {
    grade = 'ระดับ A (ความพร้อมสูง)';
    comment = 'ทำคะแนนได้ดีเยี่ยม โครงสร้างความรู้ครอบคลุมเกือบทุกบท ทบทวนข้อที่พลาดเพื่อรักษามาตรฐาน';
    gradeBg = '#dcfce7';
    gradeColor = '#15803d';
  } else if (totalScore >= 50) {
    grade = 'ระดับ B+ (ความพร้อมดี)';
    comment = 'คะแนนอยู่ในเกณฑ์ดี แนะนำให้เจาะลึกบทที่มีคะแนนเยอะ เช่น ลำดับและอนุกรม, สถิติ และความน่าจะเป็น';
    gradeBg = '#eff6ff';
    gradeColor = '#2563eb';
  } else if (totalScore >= 35) {
    grade = 'ระดับ B (ปานกลาง)';
    comment = 'ควรฝึกทำโจทย์เพิ่มเติมในส่วนของข้อสอบปรนัยและฝึกคำนวณสูตรสถิติศาสตร์ให้แม่นยำยิ่งขึ้น';
    gradeBg = '#fef3c7';
    gradeColor = '#b45309';
  } else {
    grade = 'ระดับ C (ควรเร่งทบทวน)';
    comment = 'ยังมีจุดที่ต้องพัฒนาอีกพอสมควร แนะนำให้อ่านเฉลยละเอียดทุกข้อและฝึกทำซ้ำอีก 1-2 รอบ';
    gradeBg = '#fee2e2';
    gradeColor = '#b91c1c';
  }

  if (resultGradeBadge) {
    resultGradeBadge.textContent = grade;
    resultGradeBadge.style.backgroundColor = gradeBg;
    resultGradeBadge.style.color = gradeColor;
  }
  if (resultComment) resultComment.textContent = comment;

  // Render Solutions
  renderSolutionsList(evaluatedQuestions);

  if (mockResultOverlay) mockResultOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function renderSolutionsList(evaluatedQuestions) {
  if (!solutionsList) return;
  solutionsList.innerHTML = '';

  const filtered = evaluatedQuestions.filter((q) => {
    if (currentSolFilter === 'correct') return q.isCorrect;
    if (currentSolFilter === 'wrong') return !q.isCorrect;
    return true;
  });

  filtered.forEach((q) => {
    const card = document.createElement('div');
    const badgeClass = q.isFree ? 'free' : q.isCorrect ? 'correct' : 'wrong';
    const badgeText = q.isFree ? '🎁 ข้อฟรี (ทปอ.)' : q.isCorrect ? '✓ ตอบถูก (+3 คะแนน)' : '✗ ตอบผิด (0 คะแนน)';

    card.className = `solution-card ${badgeClass}`;

    let answersDiffHtml = '';
    if (q.type === 'choice') {
      const userChoiceStr = q.userAnswer ? `ตัวเลือกที่ ${q.userAnswer}` : 'ไม่ได้ตอบ';
      const correctChoiceStr = q.isFree ? 'ฟรีทุกข้อ' : `ตัวเลือกที่ ${q.correctAnswer}`;
      answersDiffHtml = `
        <div class="solution-answers-diff">
          <span>คำตอบของคุณ: <b>${userChoiceStr}</b></span>
          <span>เฉลยที่ถูกต้อง: <b style="color:#15803d">${correctChoiceStr}</b></span>
        </div>
      `;
    } else {
      const userNumStr = q.userAnswer || 'ไม่ได้ตอบ';
      answersDiffHtml = `
        <div class="solution-answers-diff">
          <span>คำตอบของคุณ: <b>${userNumStr}</b></span>
          <span>เฉลยที่ถูกต้อง: <b style="color:#15803d">${q.correctAnswer} (${q.numericKey || q.correctAnswer})</b></span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="solution-header-line">
        <strong style="font-size:15px; color:#0f172a;">ข้อที่ ${q.number} (${q.points} คะแนน)</strong>
        <span class="solution-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="solution-q-text">${q.text}</div>
      ${answersDiffHtml}
      <div class="solution-explanation-box">
        <strong>💡 แนวคิด / วิธีทำอย่างละเอียด:</strong>
        <div>${q.explanation || 'ไม่มีคำอธิบายเพิ่มเติม'}</div>
      </div>
    `;

    solutionsList.appendChild(card);
  });
}

// Filter Solution Tabs
solFilterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    solFilterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentSolFilter = btn.dataset.solFilter || 'all';
    // Re-render solutions from evaluated data
    if (currentExamData) {
      const evaluated = currentExamData.questions.map((q) => {
        const userAns = (userAnswers[q.number] || '').trim();
        const isFree = q.isFree === true || q.correctAnswer === 'ฟรีทุกข้อ';
        let isCorrect = false;
        if (isFree) isCorrect = true;
        else if (q.type === 'choice') isCorrect = userAns === q.correctAnswer;
        else if (q.type === 'numeric') isCorrect = Math.abs(parseFloat(userAns) - parseFloat(q.correctAnswer)) < 0.001;
        return { ...q, userAnswer: userAns, isCorrect, isFree };
      });
      renderSolutionsList(evaluated);
    }
  });
});

resultCloseBtn?.addEventListener('click', () => {
  if (mockResultOverlay) mockResultOverlay.hidden = true;
  document.body.style.overflow = '';
});

resultRetakeBtn?.addEventListener('click', () => {
  if (mockResultOverlay) mockResultOverlay.hidden = true;
  startMockExam('a-level-math2-68');
});

// Bind Start Buttons on Cards
function bindStartButtons() {
  document.querySelectorAll('[data-start-exam]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const examId = button.dataset.startExam;
      startMockExam(examId);
    });
  });
}

window.bluePenguinRefreshMockExams = () => {
  examCards = [...document.querySelectorAll('[data-exam-card]')];
  bindStartButtons();
  renderExams();
};

bindStartButtons();
renderExams();

