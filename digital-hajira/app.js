'use strict';
/* ============================================================
   DIGITAL HAJIRA SYSTEM — MAIN LOGIC v2.3
   ঘাগড়া খিলমোগল হাকিম উদ্দিন সরকারি প্রাথমিক বিদ্যালয়
   - Bikolpo 1: Name Tap -> 4-Digit Teacher PIN
   - Strict Segregation: Class teacher only sees their class (Tabs hidden)
   - Admin Mode for Mohammed Asraf Uddin (Full Access to all classes)
   ============================================================ */

// ─── STATE ──────────────────────────────────────────────────
const state = {
  currentTeacher: null,
  activeRole:     'teacher', // 'teacher' or 'admin'
  targetTeacher:  null,      // teacher currently selected in PIN modal
  year:           new Date().getFullYear(),
  month:          new Date().getMonth() + 1, // 1-12
  selectedClass:  0,         // 0 = Pre-primary, 1-5 = Classes 1-5
  isLocked:       true,      // Locked by default
  authed:         false
};

// ─── CONSTANTS & BENGALI UTILS ──────────────────────────────
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const BN_MONTHS = ['','জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const EN_MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
const BN_DAYS_SHORT = ['রবি','সোম','মঙ্গল','বুধ','বৃহঃ','শুক্র','শনি'];
const CLASS_BN = ['প্রাক-প্রাথমিক (শিশু)','প্রথম','দ্বিতীয়','তৃতীয়','চতুর্থ','পঞ্চম'];

function toBN(n) {
  return String(n).replace(/[0-9]/g, d => BN_DIGITS[+d]);
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

// Dynamic holiday map (combines data.js DEFAULT_HOLIDAYS + custom DB holidays)
let holidayMap = new Map((typeof DEFAULT_HOLIDAYS !== 'undefined' ? DEFAULT_HOLIDAYS : []).map(h => [h.date, h.name_bn]));
let customHolidaysList = [];

function isDateOff(year, month, day) {
  const dow = getDayOfWeek(year, month, day);
  const dateStr = `${year}-${padZero(month)}-${padZero(day)}`;
  const isWeekend = (dow === 5 || dow === 6); // Friday (5) & Saturday (6)
  const holidayName = holidayMap.get(dateStr) || '';
  const isGovHoliday = holidayMap.has(dateStr);
  return { isOff: isWeekend || isGovHoliday, isWeekend, isGovHoliday, holidayName, dateStr };
}

// ─── INDEXEDDB (PERSISTENT LONG-TERM STORAGE) ───────────────
const DB_NAME = 'HajiraDB_v2';
const DB_VERSION = 2;
let db = null;

function initDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('attendance')) {
        const store = d.createObjectStore('attendance', { keyPath: 'key' });
        store.createIndex('by_month', 'monthKey', { unique: false });
      }
      if (!d.objectStoreNames.contains('students')) {
        d.createObjectStore('students', { keyPath: 'cls' });
      }
      if (!d.objectStoreNames.contains('holidays')) {
        d.createObjectStore('holidays', { keyPath: 'date' });
      }
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = () => resolve(null);
  });
}

function dbGetAll(storeName) {
  return new Promise((resolve) => {
    if (!db || !db.objectStoreNames.contains(storeName)) return resolve([]);
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function loadStudentsFromDB() {
  const rows = await dbGetAll('students');
  rows.forEach(r => {
    if (typeof r.cls === 'number' && Array.isArray(r.list)) {
      STUDENTS[r.cls] = r.list;
    }
  });
}

function dbSaveClassStudents(cls, list) {
  return new Promise((resolve) => {
    if (!db) return resolve();
    const tx = db.transaction('students', 'readwrite');
    tx.objectStore('students').put({ cls: Number(cls), list });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function loadHolidaysFromDB() {
  holidayMap = new Map((typeof DEFAULT_HOLIDAYS !== 'undefined' ? DEFAULT_HOLIDAYS : []).map(h => [h.date, h.name_bn]));
  customHolidaysList = await dbGetAll('holidays');
  customHolidaysList.forEach(h => {
    if (h.date && h.name_bn) holidayMap.set(h.date, h.name_bn);
  });
}

function dbPutHoliday(date, name_bn) {
  return new Promise((resolve) => {
    if (!db) return resolve();
    const tx = db.transaction('holidays', 'readwrite');
    tx.objectStore('holidays').put({ date, name_bn });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function dbDeleteHoliday(date) {
  return new Promise((resolve) => {
    if (!db) return resolve();
    const tx = db.transaction('holidays', 'readwrite');
    tx.objectStore('holidays').delete(date);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function dbPutAttendance(key, val, monthKey) {
  return new Promise((resolve) => {
    if (!db) return resolve();
    const tx = db.transaction('attendance', 'readwrite');
    const store = tx.objectStore('attendance');
    if (val === '' || val === null) {
      store.delete(key);
    } else {
      store.put({ key, status: val, monthKey });
    }
    tx.oncomplete = () => resolve();
  });
}

function dbGetMonthAttendance(monthKey) {
  return new Promise((resolve) => {
    if (!db) return resolve({});
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('by_month');
    const req = index.getAll(IDBKeyRange.only(monthKey));
    req.onsuccess = () => {
      const map = {};
      (req.result || []).forEach(item => {
        map[item.key] = item.status;
      });
      resolve(map);
    };
    req.onerror = () => resolve({});
  });
}

let currentMonthData = {};

async function loadMonthCache() {
  const mKey = `${state.year}-${padZero(state.month)}`;
  currentMonthData = await dbGetMonthAttendance(mKey);
}

// ─── 1. TEACHER PORTAL & PIN MODAL (BIKOLPO 1) ──────────────
function renderTeacherPortal() {
  const container = document.getElementById('teacher-portal-list');
  if (!container) return;
  container.innerHTML = '';

  TEACHERS.forEach(t => {
    if (t.isActingHead && t.assignedClass === -1) return; // Skip Munmun Saha stepped aside

    const card = document.createElement('div');
    card.className = 't-portal-card' + (t.isAdmin ? ' admin-card' : '');

    let classDesc = '';
    if (t.assignedClass === 0) classDesc = '🎒 প্রাক-প্রাথমিক (শিশু শ্রেণি)';
    else classDesc = `🎒 শ্রেণি ${toBN(t.assignedClass)} (${CLASS_BN[t.assignedClass]} শ্রেণি)`;

    if (t.isAdmin) {
      classDesc += ' & 👑 প্রধান অ্যাডমিন';
    }

    card.onclick = () => openPinModal(t);

    card.innerHTML = `
      <img class="t-p-avatar" src="${teacherAvatar(t)}" alt="${t.name_bn}">
      <div class="t-p-info">
        <div class="t-p-name">${t.name_bn}</div>
        <span class="t-p-role">${t.role_bn}</span>
        <div class="t-p-class">${classDesc}</div>
      </div>
      <div class="t-p-arrow">➔</div>
    `;
    container.appendChild(card);
  });
}

let pinBuf = '';

function openPinModal(teacher) {
  state.targetTeacher = teacher;
  state.activeRole = 'teacher'; // default
  pinBuf = '';
  renderPinDots();

  const modal = document.getElementById('pin-modal');
  const avatar = document.getElementById('pm-avatar');
  const name = document.getElementById('pm-name');
  const role = document.getElementById('pm-role');
  const toggle = document.getElementById('admin-role-toggle');
  const pinLabel = document.getElementById('pm-pin-label');
  const hint = document.getElementById('pm-hint');

  if (avatar) avatar.src = teacherAvatar(teacher);
  if (name) name.textContent = teacher.name_bn;
  if (role) role.textContent = teacher.role_bn;

  // If Mohammed Asraf Uddin, show Role Switcher
  if (teacher.isAdmin) {
    if (toggle) toggle.style.display = 'flex';
    document.querySelector('input[name="asrafRole"][value="teacher"]').checked = true;
    if (pinLabel) pinLabel.textContent = '🔐 শ্রেণি ৪ পিন কোড দিন (১০৪০)';
    if (hint) hint.textContent = 'শ্রেণি ৪: ১০৪০ | প্রধান অ্যাডমিন: ৯৯৯৯';
  } else {
    if (toggle) toggle.style.display = 'none';
    if (pinLabel) pinLabel.textContent = `🔐 ৪ সংখ্যার পিন কোড দিন (${toBN(teacher.pin)})`;
    if (hint) hint.textContent = `ডিফল্ট পিন: ${toBN(teacher.pin)}`;
  }

  modal.style.display = 'flex';
}

function closePinModal() {
  const modal = document.getElementById('pin-modal');
  if (modal) modal.style.display = 'none';
  state.targetTeacher = null;
  pinBuf = '';
}

function onAsrafRoleChange() {
  const roleVal = document.querySelector('input[name="asrafRole"]:checked')?.value || 'teacher';
  state.activeRole = roleVal;
  const pinLabel = document.getElementById('pm-pin-label');
  pinBuf = '';
  renderPinDots();

  if (roleVal === 'admin') {
    if (pinLabel) pinLabel.textContent = '👑 প্রধান অ্যাডমিন মাস্টার পিন দিন (৯৯৯৯)';
  } else {
    if (pinLabel) pinLabel.textContent = '🎒 শ্রেণি ৪ শিক্ষক পিন কোড দিন (১০৪০)';
  }
}

function pinInput(d) {
  if (pinBuf.length >= 4) return;
  pinBuf += d;
  renderPinDots();
  if (pinBuf.length === 4) {
    setTimeout(checkPin, 250);
  }
}

function pinBack() {
  pinBuf = pinBuf.slice(0, -1);
  renderPinDots();
}

function renderPinDots() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('dot' + i);
    if (el) el.classList.toggle('filled', i < pinBuf.length);
  }
}

function checkPin() {
  const t = state.targetTeacher;
  if (!t) return;

  let expectedPin = t.pin;
  if (t.isAdmin && state.activeRole === 'admin') {
    expectedPin = t.adminPin || SCHOOL_DATA.adminPin;
  }

  if (pinBuf === expectedPin) {
    state.authed = true;
    state.currentTeacher = t;
    state.selectedClass = t.assignedClass;
    state.isLocked = true;
    closePinModal();

    // Trigger door opening animation with welcome text
    openDoorAndEnter();
  } else {
    pinBuf = '';
    renderPinDots();
    const err = document.getElementById('pin-err');
    if (err) err.classList.add('visible');
    const dialog = document.querySelector('.pin-modal-dialog');
    if (dialog) {
      dialog.style.animation = 'shake .4s ease';
      setTimeout(() => {
        dialog.style.animation = '';
        if (err) err.classList.remove('visible');
      }, 1600);
    }
  }
}

// ─── 2. 3D DOOR OPENING & AUTOMATIC ENTRY ───────────────────
function openDoorAndEnter() {
  const overlay = document.getElementById('door-overlay');
  const t = state.currentTeacher;
  const isAdmin = (state.activeRole === 'admin');

  setText('door-teacher-welcome', `${t.name_bn} (${isAdmin ? 'প্রধান অ্যাডমিন' : t.role_bn})`);
  setText('door-class-welcome', isAdmin ? 'সকল শ্রেণির কেন্দ্রীয় রেজিস্টার উন্মুক্ত হচ্ছে...' : `${CLASS_BN[state.selectedClass]} শ্রেণির খাতা উন্মুক্ত হচ্ছে...`);

  // Hide login portal so it never shows again
  const loginEl = document.getElementById('sc-login');
  if (loginEl) {
    loginEl.classList.remove('active');
    loginEl.style.display = 'none';
  }

  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.add('open');
  }, 120);

  // Slower transition (3.0s) so teachers can read the welcome message comfortably
  setTimeout(() => {
    showScreen('student-monthly');
    renderStudentMonthlyRegister();

    setTimeout(() => {
      overlay.classList.remove('open');
      overlay.classList.remove('active');
    }, 1000);
  }, 3000);
}

// ─── 3. STRICT CLASS SEGREGATION & REGISTERS ────────────────
function updateNavbarBadge() {
  const t = state.currentTeacher;
  const cls = state.selectedClass;
  const isAdmin = (state.activeRole === 'admin');
  if (!t) return;

  const box1 = document.getElementById('nav-teacher-box');
  const box2 = document.getElementById('nav-upobritti-box');

  if (isAdmin) {
    if (box1) box1.className = 'nav-teacher-badge admin-badge';
    if (box2) box2.className = 'nav-teacher-badge admin-badge';
    setText('nav-badge-icon', '👑');
    setText('nav-u-icon', '👑');
    setText('nav-teacher-name', `${t.name_bn} (প্রধান অ্যাডমিন)`);
    setText('nav-teacher-class', `সকল শ্রেণি পর্যবেক্ষণ ও নিয়ন্ত্রণ (বর্তমান: ${CLASS_BN[cls]})`);
    setText('nav-u-teacher-name', `${t.name_bn} (প্রধান অ্যাডমিন)`);
    setText('nav-u-teacher-class', `সকল শ্রেণি উপবৃত্তি (বর্তমান: ${CLASS_BN[cls]})`);
  } else {
    if (box1) box1.className = 'nav-teacher-badge';
    if (box2) box2.className = 'nav-teacher-badge';
    setText('nav-badge-icon', '👤');
    setText('nav-u-icon', '👤');
    setText('nav-teacher-name', `${t.name_bn} (${t.role_bn})`);
    setText('nav-teacher-class', `${CLASS_BN[cls]} শ্রেণি`);
    setText('nav-u-teacher-name', `${t.name_bn} (${t.role_bn})`);
    setText('nav-u-teacher-class', `${CLASS_BN[cls]} শ্রেণি`);
  }
}

async function renderStudentMonthlyRegister() {
  await loadMonthCache();
  const mLabel = `${BN_MONTHS[state.month]} ${toBN(state.year)}`;
  setText('s-current-month-lbl', mLabel);

  const t = state.currentTeacher;
  const cls = state.selectedClass;
  const isAdmin = (state.activeRole === 'admin');

  updateNavbarBadge();
  setText('s-print-class-title', `শ্রেণি: ${CLASS_BN[cls]} | ছাত্র-ছাত্রী মাসিক হাজিরা রেজিস্টার`);
  setText('s-print-month', `মাস: ${mLabel} | ঘাগড়া খিলমোগল হাকিম উদ্দিন সরকারি প্রাথমিক বিদ্যালয়`);

  // STRICT SEGREGATION: Class switcher tabs are ONLY rendered and displayed if Admin!
  renderClassTabs(isAdmin);
  updateLockUI();

  const container = document.getElementById('student-register-container');
  if (!container) return;

  const totalDays = getDaysInMonth(state.year, state.month);
  const students = STUDENTS[cls] || [];

  let html = `<table class="reg-table"><thead><tr>`;
  html += `<th class="sticky-roll">রোল</th>`;
  html += `<th class="sticky-name">শিক্ষার্থীর নাম</th>`;

  // Day columns
  for (let d = 1; d <= totalDays; d++) {
    const { isOff, isGovHoliday, holidayName } = isDateOff(state.year, state.month, d);
    const dow = getDayOfWeek(state.year, state.month, d);
    const tip = isGovHoliday ? `সরকারি ছুটি: ${holidayName}` : isOff ? 'সাপ্তাহিক ছুটি (শুক্র/শনি)' : '';
    html += `
      <th class="th-day-hdr ${isOff ? 'th-day-off' : ''}" title="${tip}">
        ${toBN(d)}
        <span class="th-day-name">${BN_DAYS_SHORT[dow]}</span>
      </th>`;
  }
  html += `<th>উপস্থিত</th><th>অনুপস্থিত</th><th>ছুটি</th><th>উপস্থিতি %</th></tr></thead><tbody>`;

  const dailyBoys = new Array(totalDays + 1).fill(0);
  const dailyGirls = new Array(totalDays + 1).fill(0);
  const dailyTotal = new Array(totalDays + 1).fill(0);
  let totalPAll = 0, totalAAll = 0, totalSLAll = 0;

  students.forEach(st => {
    let pCount = 0, aCount = 0, slCount = 0, workingDays = 0;
    const gLabel = st.gender === 'M' ? 'ছেলে' : 'মেয়ে';

    html += `<tr>`;
    html += `<td class="sticky-roll" style="font-weight:700;color:var(--primary);">${toBN(st.roll)}</td>`;
    html += `<td class="sticky-name">
              <div style="font-weight:700;">${st.name_bn} <span class="gender-pill ${st.gender === 'M' ? 'gp-m' : 'gp-f'}">${gLabel}</span></div>
              <div style="font-size:0.68rem;color:var(--text-sec);font-family:Inter,sans-serif">${st.name_en || ''}</div>
             </td>`;

    for (let d = 1; d <= totalDays; d++) {
      const { isOff, isGovHoliday, holidayName, dateStr } = isDateOff(state.year, state.month, d);
      const key = `S_${cls}_${st.roll}_${dateStr}`;
      const status = currentMonthData[key] || '';

      if (!isOff) workingDays++;
      if (!isOff && status === 'P') {
        pCount++;
        dailyTotal[d]++;
        if (st.gender === 'M') dailyBoys[d]++;
        else dailyGirls[d]++;
      }
      else if (!isOff && status === 'A') aCount++;
      else if (!isOff && status === 'SL') slCount++;

      if (isOff) {
        const offTip = isGovHoliday ? `সরকারি ছুটি: ${holidayName}` : 'সাপ্তাহিক ছুটি';
        html += `<td class="reg-cell c-off" title="${offTip}">-</td>`;
      } else {
        const symbol = status === 'P' ? '✓' : status === 'A' ? '✗' : status === 'SL' ? '📋' : '';
        const lockCls = state.isLocked ? ' cell-locked' : '';
        html += `<td class="reg-cell s-${status}${lockCls}" onclick="cycleStudentDay(${cls}, ${st.roll}, '${dateStr}', this)">${symbol}</td>`;
      }
    }

    totalPAll += pCount;
    totalAAll += aCount;
    totalSLAll += slCount;

    const pct = workingDays > 0 ? Math.round((pCount / workingDays) * 100) : 0;
    const pctCls = pct >= 80 ? 'pct-good' : 'pct-bad';

    html += `
      <td class="reg-sum-cell" style="color:var(--present);">${toBN(pCount)}</td>
      <td class="reg-sum-cell" style="color:var(--absent);">${toBN(aCount)}</td>
      <td class="reg-sum-cell" style="color:var(--late);">${toBN(slCount)}</td>
      <td class="reg-sum-cell reg-sum-pct ${pctCls}">${toBN(pct)}%</td>
    </tr>`;
  });

  // Daily summary footer: Boys, Girls, Total per day
  const enrolledBoys = students.filter(s => s.gender === 'M').length;
  const enrolledGirls = students.filter(s => s.gender === 'F').length;
  const buildDailyRow = (label, arr, rowCls, extraInfo) => {
    let r = `<tr class="daily-sum-row ${rowCls}">`;
    r += `<td class="sticky-roll">∑</td>`;
    r += `<td class="sticky-name">${label} <span style="font-size:0.7rem;opacity:0.8;">(${extraInfo})</span></td>`;
    let rowSum = 0;
    for (let d = 1; d <= totalDays; d++) {
      const { isOff } = isDateOff(state.year, state.month, d);
      if (isOff) {
        r += `<td class="reg-cell c-off">-</td>`;
      } else {
        rowSum += arr[d];
        r += `<td class="daily-sum-cell">${toBN(arr[d])}</td>`;
      }
    }
    r += `<td colspan="4" class="daily-sum-total">মাসিক মোট: ${toBN(rowSum)}</td></tr>`;
    return r;
  };

  html += `</tbody><tfoot>`;
  html += buildDailyRow('👦 মোট ছেলে উপস্থিত', dailyBoys, 'row-boys', `ভর্তি: ${toBN(enrolledBoys)}`);
  html += buildDailyRow('👧 মোট মেয়ে উপস্থিত', dailyGirls, 'row-girls', `ভর্তি: ${toBN(enrolledGirls)}`);
  html += buildDailyRow('👥 দৈনিক মোট উপস্থিত', dailyTotal, 'row-total', `মোট শিক্ষার্থী: ${toBN(students.length)}`);
  html += `</tfoot></table>`;
  container.innerHTML = html;
}

// Render tabs ONLY if Admin; hide completely for regular class teachers
function renderClassTabs(isAdmin) {
  ['student-class-tabs', 'upobritti-class-tabs'].forEach(tabContainerId => {
    const box = document.getElementById(tabContainerId);
    if (!box) return;

    if (!isAdmin) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    // Admin sees all 6 classes
    box.style.display = 'flex';
    box.innerHTML = '';

    for (let c = 0; c <= 5; c++) {
      const btn = document.createElement('button');
      btn.className = 'ctab' + (c === state.selectedClass ? ' on' : '');
      btn.onclick = () => {
        state.selectedClass = c;
        updateNavbarBadge();
        const act = document.querySelector('.screen.active');
        if (act?.id === 'sc-student-monthly') renderStudentMonthlyRegister();
        else if (act?.id === 'sc-upobritti')  renderUpobrittiScreen();
      };
      const labelShort = c === 0 ? 'শিশু শ্রেণি' : `শ্রেণি ${toBN(c)}`;
      const labelEn = c === 0 ? 'Pre-Primary' : `Class ${c}`;
      btn.innerHTML = `<span class="tb">${labelShort}</span><span class="te">${labelEn}</span>`;
      box.appendChild(btn);
    }
  });
}

async function cycleStudentDay(cls, roll, dateStr, cellEl) {
  if (state.isLocked) {
    toast('🔒 আগে উপরে "লক করা আছে" বাটনে চাপ দিয়ে আনলক করুন!', 'err');
    return;
  }

  const key = `S_${cls}_${roll}_${dateStr}`;
  const cur = currentMonthData[key] || '';
  let next = '';
  if (cur === '') next = 'P';
  else if (cur === 'P') next = 'A';
  else if (cur === 'A') next = 'SL';
  else next = '';

  currentMonthData[key] = next;
  const mKey = `${state.year}-${padZero(state.month)}`;
  await dbPutAttendance(key, next, mKey);

  renderStudentMonthlyRegister();
}

async function markAllStudentsTodayPresent() {
  if (state.isLocked) {
    toast('🔒 আগে হাজিরা খাতা আনলক করুন!', 'err');
    return;
  }

  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const offInfo = isDateOff(y, m, d);
  if (offInfo.isOff) {
    const reason = offInfo.isGovHoliday ? offInfo.holidayName : 'সাপ্তাহিক ছুটি (শুক্র/শনি)';
    toast(`📅 আজ ছুটির দিন (${reason})! হাজিরা দেওয়া যাবে না।`, 'err');
    return;
  }

  const dStr = offInfo.dateStr;
  const mKey = `${y}-${padZero(m)}`;
  const cls = state.selectedClass;

  for (const st of STUDENTS[cls]) {
    const key = `S_${cls}_${st.roll}_${dStr}`;
    currentMonthData[key] = 'P';
    await dbPutAttendance(key, 'P', mKey);
  }
  renderStudentMonthlyRegister();
  toast(`${CLASS_BN[cls]}-এর সবাই আজ উপস্থিত হিসেবে সংরক্ষিত ✓`, 'ok');
}

// ─── 4. UPOBRITTI SCREEN (STRICTLY SEGREGATED) ───────────────
async function renderUpobrittiScreen() {
  await loadMonthCache();
  const mLabel = `${BN_MONTHS[state.month]} ${toBN(state.year)}`;
  setText('u-current-month-lbl', mLabel);
  setText('u-print-month', `মাস: ${mLabel} | ঘাগড়া খিলমোগল হাকিম উদ্দিন সরকারি প্রাথমিক বিদ্যালয়`);

  const isAdmin = (state.activeRole === 'admin');
  renderClassTabs(isAdmin);
  updateNavbarBadge();

  const cls = state.selectedClass;
  setText('u-table-title', `🎒 ${CLASS_BN[cls]} — উপবৃত্তি প্রাপ্তির যোগ্যতা তালিকা`);

  const container = document.getElementById('upobritti-table-container');
  if (!container) return;

  const totalDays = getDaysInMonth(state.year, state.month);
  let workingDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (!isDateOff(state.year, state.month, d).isOff) workingDays++;
  }

  const students = STUDENTS[cls] || [];
  let eligibleCount = 0, ineligibleCount = 0;

  let html = `<table class="reg-table" style="text-align:left;">
    <thead>
      <tr>
        <th style="width:50px;text-align:center;">রোল</th>
        <th>নাম (বাংলা)</th>
        <th>Name (English)</th>
        <th style="text-align:center;">কর্মদিবস</th>
        <th style="text-align:center;">উপস্থিত</th>
        <th style="text-align:center;">হাজিরা %</th>
        <th style="text-align:center;">রিপিটার?</th>
        <th style="text-align:center;">উপবৃত্তি অবস্থা</th>
      </tr>
    </thead>
    <tbody>`;

  students.forEach(st => {
    let pCount = 0;
    for (let d = 1; d <= totalDays; d++) {
      const { isOff, dateStr } = isDateOff(state.year, state.month, d);
      if (!isOff) {
        const key = `S_${cls}_${st.roll}_${dateStr}`;
        if (currentMonthData[key] === 'P') pCount++;
      }
    }

    const pct = workingDays > 0 ? Math.round((pCount / workingDays) * 100) : 0;
    const isRepeater = st.repeater === true;
    const isEligible = (pct >= 80) && !isRepeater;
    if (isEligible) eligibleCount++; else ineligibleCount++;

    let statusBadge = '';
    if (isEligible) {
      statusBadge = `<span class="u-badge-eligible">✓ যোগ্য (Eligible)</span>`;
    } else if (isRepeater) {
      statusBadge = `<span class="u-badge-ineligible">✗ অযোগ্য (রিপিটার শিক্ষার্থী)</span>`;
    } else {
      statusBadge = `<span class="u-badge-ineligible">✗ অযোগ্য (${toBN(pct)}% < ৮০%)</span>`;
    }

    html += `
      <tr>
        <td style="text-align:center;font-weight:700;">${toBN(st.roll)}</td>
        <td style="font-weight:700;">${st.name_bn}</td>
        <td style="font-family:Inter,sans-serif;font-size:0.8rem;color:var(--text-sec);">${st.name_en}</td>
        <td style="text-align:center;">${toBN(workingDays)}</td>
        <td style="text-align:center;font-weight:700;color:var(--present);">${toBN(pCount)}</td>
        <td style="text-align:center;font-weight:800;color:${pct>=80?'var(--present)':'var(--absent)'};">${toBN(pct)}%</td>
        <td style="text-align:center;">${isRepeater ? '<b style="color:red">হ্যাঁ (Repeater)</b>' : 'না'}</td>
        <td style="text-align:center;">${statusBadge}</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  const statsBox = document.getElementById('u-stats-summary');
  if (statsBox) {
    statsBox.innerHTML = `
      <div class="stat-box sp">
        <span class="stat-num">${toBN(eligibleCount)}</span>
        <span class="stat-lbl">উপবৃত্তি পাবে (যোগ্য)<br>Eligible (≥৮০%)</span>
      </div>
      <div class="stat-box sa">
        <span class="stat-num">${toBN(ineligibleCount)}</span>
        <span class="stat-lbl">বাদ পড়বে (অযোগ্য)<br>Ineligible</span>
      </div>
      <div class="stat-box su">
        <span class="stat-num">${toBN(workingDays)}</span>
        <span class="stat-lbl">মাসের মোট কর্মদিবস<br>Working Days</span>
      </div>
    `;
  }
}

// ─── NAVIGATION & LOGOUT ────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('sc-' + name);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);

  if (name === 'login')           renderTeacherPortal();
  else if (name === 'student-monthly') renderStudentMonthlyRegister();
  else if (name === 'upobritti')       renderUpobrittiScreen();
}

function logout() {
  state.authed = false;
  state.currentTeacher = null;
  state.activeRole = 'teacher';
  pinBuf = '';

  const loginEl = document.getElementById('sc-login');
  if (loginEl) {
    loginEl.style.display = 'block';
    loginEl.classList.add('active');
  }

  document.querySelectorAll('.screen').forEach(s => {
    if (s.id !== 'sc-login') s.classList.remove('active');
  });

  renderTeacherPortal();
  toast('সফলভাবে লগআউট হয়েছে!', 'info');
}

// ─── ATTENDANCE LOCK ────────────────────────────────────────
function toggleLockMode() {
  if (state.isLocked) {
    if (confirm('⚠️ হাজিরা আনলক করতে চান?\n\nআনলক করলে যে কোনো শিক্ষার্থীর উপস্থিতিতে ক্লিক করে পরিবর্তন করা যাবে।')) {
      state.isLocked = false;
      toast('🔓 হাজিরা আনলক হয়েছে! এখন পরিবর্তন করা যাবে।', 'info');
      updateLockUI();
    }
  } else {
    state.isLocked = true;
    toast('🔒 হাজিরা খাতা পুনরায় লক করা হয়েছে। নিরাপদ!', 'ok');
    updateLockUI();
  }
}

function updateLockUI() {
  const btn = document.getElementById('btn-lock-toggle');
  const notice = document.getElementById('lock-notice');

  if (state.isLocked) {
    if (btn) {
      btn.textContent = '🔒 লক করা আছে';
      btn.className = 'btn-action';
    }
    if (notice) {
      notice.innerHTML = `🔒 <b>নিরাপত্তা সতর্কতা:</b> ভুল এড়াতে হাজিরা খাতাটি লক করা আছে। হাজিরা পরিবর্তন করতে উপরে <b>"🔒 লক করা আছে"</b> বাটনে চাপ দিয়ে আনলক করুন।`;
      notice.className = 'lock-status-notice';
    }
  } else {
    if (btn) {
      btn.textContent = '🔓 আনলক রয়েছে (পরিবর্তনযোগ্য)';
      btn.className = 'btn-action unlocked';
    }
    if (notice) {
      notice.innerHTML = `⚠️ <b>মনোযোগ দিন:</b> হাজিরা খাতাটি বর্তমানে <b>আনলক</b> অবস্থায় আছে। যে কোনো ঘরে ক্লিক করলেই হাজিরা পরিবর্তিত হবে। কাজ শেষে আবার লক করুন।`;
      notice.className = 'lock-status-notice unlocked';
    }
  }

  document.querySelectorAll('.reg-cell').forEach(cell => {
    if (!cell.classList.contains('c-off')) {
      cell.classList.toggle('cell-locked', state.isLocked);
    }
  });
}

async function changeMonth(delta) {
  state.month += delta;
  if (state.month > 12) {
    state.month = 1;
    state.year++;
  } else if (state.month < 1) {
    state.month = 12;
    state.year--;
  }
  await loadMonthCache();

  const act = document.querySelector('.screen.active');
  if (act?.id === 'sc-student-monthly') renderStudentMonthlyRegister();
  else if (act?.id === 'sc-upobritti')  renderUpobrittiScreen();
}

// ─── REPEATER MODAL ─────────────────────────────────────────
function toggleRepeaterModal() {
  const m = document.getElementById('repeater-modal');
  if (!m) return;
  const isOpening = (m.style.display === 'none' || m.style.display === '');
  m.style.display = isOpening ? 'flex' : 'none';

  if (isOpening) {
    const list = document.getElementById('repeater-list-container');
    const cls = state.selectedClass;
    list.innerHTML = '';

    STUDENTS[cls].forEach(st => {
      const row = document.createElement('div');
      row.className = 'repeater-item';
      row.innerHTML = `
        <div>
          <b>রোল ${toBN(st.roll)}:</b> ${st.name_bn}
        </div>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="rep_${cls}_${st.roll}" ${st.repeater ? 'checked' : ''}>
          <span>রিপিটার (ফেল)</span>
        </label>
      `;
      list.appendChild(row);
    });
  }
}

async function saveRepeaters() {
  const cls = state.selectedClass;
  STUDENTS[cls].forEach(st => {
    const cb = document.getElementById(`rep_${cls}_${st.roll}`);
    if (cb) st.repeater = cb.checked;
  });
  await dbSaveClassStudents(cls, STUDENTS[cls]);
  toggleRepeaterModal();
  renderUpobrittiScreen();
  toast('রিপিটার তালিকা স্থায়ীভাবে সংরক্ষিত হয়েছে ✓', 'ok');
}

// ─── EXCEL EXPORTS ──────────────────────────────────────────
function exportStudentMonthlyExcel() {
  if (typeof XLSX === 'undefined') { toast('Excel প্রস্তুত নয়', 'err'); return; }
  const cls = state.selectedClass;
  const totalDays = getDaysInMonth(state.year, state.month);
  const mLabel = `${EN_MONTHS[state.month]}_${state.year}`;

  const headers = ['রোল', 'নাম (বাংলা)', 'Name (English)', 'লিঙ্গ'];
  for (let d = 1; d <= totalDays; d++) headers.push(`${d}`);
  headers.push('উপস্থিত', 'অনুপস্থিত', 'ছুটি', 'উপস্থিতি %');

  const rows = [headers];
  const dailyBoys = new Array(totalDays + 1).fill(0);
  const dailyGirls = new Array(totalDays + 1).fill(0);
  const dailyTotal = new Array(totalDays + 1).fill(0);

  STUDENTS[cls].forEach(st => {
    let p = 0, a = 0, sl = 0, work = 0;
    const row = [st.roll, st.name_bn, st.name_en || '', st.gender === 'M' ? 'ছেলে' : 'মেয়ে'];

    for (let d = 1; d <= totalDays; d++) {
      const { isOff, dateStr } = isDateOff(state.year, state.month, d);
      const s = currentMonthData[`S_${cls}_${st.roll}_${dateStr}`] || '';
      if (!isOff) work++;
      if (!isOff && s === 'P') {
        p++;
        dailyTotal[d]++;
        if (st.gender === 'M') dailyBoys[d]++;
        else dailyGirls[d]++;
      }
      else if (!isOff && s === 'A') a++;
      else if (!isOff && s === 'SL') sl++;

      row.push(isOff ? '-' : s);
    }
    const pct = work > 0 ? Math.round((p / work) * 100) : 0;
    row.push(p, a, sl, `${pct}%`);
    rows.push(row);
  });

  const makeSummaryRow = (label, arr) => {
    const r = ['', label, '', ''];
    let sum = 0;
    for (let d = 1; d <= totalDays; d++) {
      const { isOff } = isDateOff(state.year, state.month, d);
      if (isOff) r.push('-');
      else { r.push(arr[d]); sum += arr[d]; }
    }
    r.push(sum, '', '', '');
    return r;
  };
  rows.push(makeSummaryRow('মোট ছেলে উপস্থিত', dailyBoys));
  rows.push(makeSummaryRow('মোট মেয়ে উপস্থিত', dailyGirls));
  rows.push(makeSummaryRow('দৈনিক মোট উপস্থিত', dailyTotal));

  const wb = XLSX.utils.book_new();
  const sheetName = cls === 0 ? 'Pre_Primary' : `Class_${cls}`;
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  XLSX.writeFile(wb, `Hajira_${sheetName}_${mLabel}.xlsx`);
  toast('মাসিক হাজিরা Excel ডাউনলোড হয়েছে ✓', 'ok');
}

function exportUpobrittiExcel() {
  if (typeof XLSX === 'undefined') { toast('Excel প্রস্তুত নয়', 'err'); return; }
  const cls = state.selectedClass;
  const totalDays = getDaysInMonth(state.year, state.month);
  const mLabel = `${EN_MONTHS[state.month]}_${state.year}`;

  let workingDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (!isDateOff(state.year, state.month, d).isOff) workingDays++;
  }

  const rows = [
    ['বিদ্যালয়:', SCHOOL_DATA.name_bn],
    ['মাস:', `${BN_MONTHS[state.month]} ${state.year}`, 'শ্রেণি:', CLASS_BN[cls], 'কর্মদিবস:', workingDays],
    ['সরকারি শর্ত:', 'কর্মদিবসে ন্যূনতম ৮০% উপস্থিতি এবং রিপিটার শিক্ষার্থী বাদ'],
    [],
    ['রোল', 'নাম (বাংলা)', 'Name (English)', 'লিঙ্গ', 'কর্মদিবস', 'উপস্থিত', 'হাজিরা %', 'রিপিটার?', 'উপবৃত্তি অবস্থা']
  ];

  STUDENTS[cls].forEach(st => {
    let p = 0;
    for (let d = 1; d <= totalDays; d++) {
      const { isOff, dateStr } = isDateOff(state.year, state.month, d);
      if (!isOff && currentMonthData[`S_${cls}_${st.roll}_${dateStr}`] === 'P') p++;
    }
    const pct = workingDays > 0 ? Math.round((p / workingDays) * 100) : 0;
    const isRepeater = st.repeater === true;
    const isEligible = (pct >= 80) && !isRepeater;
    const statusText = isEligible ? 'যোগ্য (Eligible)' : isRepeater ? 'অযোগ্য (রিপিটার)' : 'অযোগ্য (< ৮০%)';

    rows.push([
      st.roll,
      st.name_bn,
      st.name_en,
      st.gender === 'M' ? 'ছেলে' : 'মেয়ে',
      workingDays,
      p,
      `${pct}%`,
      isRepeater ? 'হ্যাঁ' : 'না',
      statusText
    ]);
  });

  const wb = XLSX.utils.book_new();
  const sheetName = cls === 0 ? 'Upobritti_PrePrimary' : `Upobritti_Class_${cls}`;
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  XLSX.writeFile(wb, `Upobritti_Report_${sheetName}_${mLabel}.xlsx`);
  toast('উপবৃত্তি রিপোর্ট Excel ডাউনলোড হয়েছে ✓', 'ok');
}

// ─── HELPERS ────────────────────────────────────────────────
const T_COLORS = ['#00695C','#1565C0','#E65100','#6A1B9A','#AD1457','#1B5E20','#4E342E'];
function teacherAvatar(t) {
  return t.photo || avatarSVG(t.name_en[0], T_COLORS[(t.id-1) % T_COLORS.length]);
}

function avatarSVG(letter, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="30" fill="${color}"/><circle cx="30" cy="23" r="11" fill="rgba(255,255,255,0.9)"/><ellipse cx="30" cy="50" rx="18" ry="11" fill="rgba(255,255,255,0.9)"/><text x="30" y="28" text-anchor="middle" font-size="13" fill="${color}" font-weight="bold" font-family="Arial,sans-serif">${letter}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function toast(msg, type = 'ok') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'err' ? ' err' : type === 'info' ? ' info' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

document.addEventListener('keydown', e => {
  const modal = document.getElementById('pin-modal');
  if (modal?.style.display === 'flex') {
    if (e.key >= '0' && e.key <= '9') pinInput(e.key);
    else if (e.key === 'Backspace') pinBack();
    else if (e.key === 'Enter') checkPin();
    else if (e.key === 'Escape') closePinModal();
  }
});

// ─── STUDENT MANAGEMENT (ALL CLASSES) ────────────────────────
let editingStudentRoll = null;

function openStudentModal() {
  const m = document.getElementById('student-modal');
  if (!m) return;
  editingStudentRoll = null;
  resetStudentForm();
  const clsSelect = document.getElementById('sm-class-select');
  if (clsSelect) {
    const isAdmin = (state.activeRole === 'admin');
    clsSelect.innerHTML = '';
    for (let c = 0; c <= 5; c++) {
      if (!isAdmin && c !== state.selectedClass) continue;
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c === 0 ? 'প্রাক-প্রাথমিক (শিশু শ্রেণি)' : `শ্রেণি ${toBN(c)} (${CLASS_BN[c]})`;
      if (c === state.selectedClass) opt.selected = true;
      clsSelect.appendChild(opt);
    }
    clsSelect.disabled = !isAdmin;
  }
  renderStudentManageList();
  m.style.display = 'flex';
}

function closeStudentModal() {
  const m = document.getElementById('student-modal');
  if (m) m.style.display = 'none';
  editingStudentRoll = null;
}

function resetStudentForm() {
  const cls = Number(document.getElementById('sm-class-select')?.value ?? state.selectedClass);
  const list = STUDENTS[cls] || [];
  const nextRoll = list.length ? Math.max(...list.map(s => s.roll)) + 1 : 1;
  const rollEl = document.getElementById('sm-roll');
  const bnEl = document.getElementById('sm-name-bn');
  const enEl = document.getElementById('sm-name-en');
  const genEl = document.getElementById('sm-gender');
  const btnEl = document.getElementById('sm-save-btn');
  if (rollEl) rollEl.value = nextRoll;
  if (bnEl) bnEl.value = '';
  if (enEl) enEl.value = '';
  if (genEl) genEl.value = 'M';
  if (btnEl) btnEl.textContent = '+ শিক্ষার্থী যোগ করুন';
  editingStudentRoll = null;
}

function renderStudentManageList() {
  const cls = Number(document.getElementById('sm-class-select')?.value ?? state.selectedClass);
  const container = document.getElementById('sm-list-container');
  if (!container) return;
  const list = (STUDENTS[cls] || []).slice().sort((a, b) => a.roll - b.roll);
  const boys = list.filter(s => s.gender === 'M').length;
  const girls = list.filter(s => s.gender === 'F').length;
  setText('sm-count-lbl', `মোট: ${toBN(list.length)} জন (ছেলে: ${toBN(boys)}, মেয়ে: ${toBN(girls)})`);

  if (!list.length) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);">এই শ্রেণিতে কোনো শিক্ষার্থী নেই</div>';
    return;
  }
  container.innerHTML = list.map(st => `
    <div class="sm-item">
      <div class="sm-item-info">
        <span class="sm-roll">রোল ${toBN(st.roll)}</span>
        <b>${st.name_bn}</b>
        <span class="gender-pill ${st.gender === 'M' ? 'gp-m' : 'gp-f'}">${st.gender === 'M' ? 'ছেলে' : 'মেয়ে'}</span>
        ${st.name_en ? `<small style="color:var(--text-sec);">(${st.name_en})</small>` : ''}
      </div>
      <div class="sm-item-actions">
        <button class="btn-mini" onclick="editStudentInModal(${cls}, ${st.roll})">✏️</button>
        <button class="btn-mini del" onclick="deleteStudentInModal(${cls}, ${st.roll})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function saveStudentFromModal() {
  const cls = Number(document.getElementById('sm-class-select')?.value ?? state.selectedClass);
  const roll = parseInt(document.getElementById('sm-roll')?.value, 10);
  const name_bn = (document.getElementById('sm-name-bn')?.value || '').trim();
  const name_en = (document.getElementById('sm-name-en')?.value || '').trim();
  const gender = document.getElementById('sm-gender')?.value || 'M';

  if (!roll || roll < 1 || !name_bn) {
    toast('রোল নম্বর এবং বাংলা নাম অবশ্যই দিতে হবে!', 'err');
    return;
  }

  const list = STUDENTS[cls] || (STUDENTS[cls] = []);
  if (editingStudentRoll !== null) {
    const idx = list.findIndex(s => s.roll === editingStudentRoll);
    if (idx !== -1) {
      if (roll !== editingStudentRoll && list.some(s => s.roll === roll)) {
        toast('এই রোল নম্বরটি ইতিমধ্যে আছে!', 'err');
        return;
      }
      list[idx] = { ...list[idx], roll, name_bn, name_en, gender };
    }
  } else {
    if (list.some(s => s.roll === roll)) {
      toast('এই রোল নম্বরটি ইতিমধ্যে আছে! অন্য রোল দিন।', 'err');
      return;
    }
    list.push({ roll, name_bn, name_en, gender, repeater: false });
  }

  list.sort((a, b) => a.roll - b.roll);
  await dbSaveClassStudents(cls, list);
  resetStudentForm();
  renderStudentManageList();
  if (cls === state.selectedClass) renderStudentMonthlyRegister();
  toast('শিক্ষার্থীর তথ্য স্থায়ীভাবে সংরক্ষিত হয়েছে ✓', 'ok');
}

function editStudentInModal(cls, roll) {
  const st = (STUDENTS[cls] || []).find(s => s.roll === roll);
  if (!st) return;
  editingStudentRoll = roll;
  document.getElementById('sm-roll').value = st.roll;
  document.getElementById('sm-name-bn').value = st.name_bn;
  document.getElementById('sm-name-en').value = st.name_en || '';
  document.getElementById('sm-gender').value = st.gender || 'M';
  document.getElementById('sm-save-btn').textContent = '✓ পরিবর্তন সংরক্ষণ করুন';
}

async function deleteStudentInModal(cls, roll) {
  if (!confirm(`রোল ${toBN(roll)} শিক্ষার্থীকে তালিকা থেকে মুছে ফেলতে চান?`)) return;
  STUDENTS[cls] = (STUDENTS[cls] || []).filter(s => s.roll !== roll);
  await dbSaveClassStudents(cls, STUDENTS[cls]);
  renderStudentManageList();
  if (cls === state.selectedClass) renderStudentMonthlyRegister();
  toast('শিক্ষার্থী মুছে ফেলা হয়েছে', 'info');
}

// ─── HOLIDAY MANAGEMENT (2026, 2027 & CUSTOM) ────────────────
function openHolidayModal() {
  const m = document.getElementById('holiday-modal');
  if (!m) return;
  renderHolidayList();
  m.style.display = 'flex';
}

function closeHolidayModal() {
  const m = document.getElementById('holiday-modal');
  if (m) m.style.display = 'none';
}

function renderHolidayList() {
  const container = document.getElementById('hm-list-container');
  if (!container) return;
  const customSet = new Set(customHolidaysList.map(h => h.date));
  const all = Array.from(holidayMap.entries())
    .map(([date, name_bn]) => ({ date, name_bn, isCustom: customSet.has(date) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  container.innerHTML = all.map(h => `
    <div class="sm-item">
      <div class="sm-item-info">
        <span class="sm-roll" style="font-family:Inter,sans-serif;">${h.date}</span>
        <b>${h.name_bn}</b>
        ${h.isCustom ? '<span class="gender-pill gp-m">যোগ করা</span>' : ''}
      </div>
      ${h.isCustom ? `<button class="btn-mini del" onclick="removeCustomHoliday('${h.date}')">🗑️</button>` : ''}
    </div>
  `).join('');
}

async function addCustomHoliday() {
  const dateEl = document.getElementById('hm-date');
  const nameEl = document.getElementById('hm-name');
  const date = (dateEl?.value || '').trim();
  const name_bn = (nameEl?.value || '').trim();
  if (!date || !name_bn) {
    toast('তারিখ এবং ছুটির কারণ লিখুন!', 'err');
    return;
  }
  await dbPutHoliday(date, name_bn);
  await loadHolidaysFromDB();
  if (dateEl) dateEl.value = '';
  if (nameEl) nameEl.value = '';
  renderHolidayList();
  renderStudentMonthlyRegister();
  toast('সরকারি ছুটি সংরক্ষিত হয়েছে ✓', 'ok');
}

async function removeCustomHoliday(date) {
  await dbDeleteHoliday(date);
  await loadHolidaysFromDB();
  renderHolidayList();
  renderStudentMonthlyRegister();
  toast('ছুটি মুছে ফেলা হয়েছে', 'info');
}

// ─── FULL BACKUP & RESTORE (LONG-TERM DATA SAFETY) ──────────
async function exportFullBackup() {
  const attendance = await dbGetAll('attendance');
  const students = await dbGetAll('students');
  const holidays = await dbGetAll('holidays');
  const payload = {
    app: 'DigitalHajira',
    version: SCHOOL_DATA.version,
    exportedAt: new Date().toISOString(),
    attendance,
    students,
    holidays
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const todayStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Digital_Hajira_Backup_${todayStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('সম্পূর্ণ ব্যাকআপ (.json) ডাউনলোড হয়েছে ✓', 'ok');
}

function triggerRestoreBackup() {
  const inp = document.getElementById('backup-file-input');
  if (inp) { inp.value = ''; inp.click(); }
}

async function handleRestoreBackupFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || data.app !== 'DigitalHajira') {
      toast('সঠিক ব্যাকআপ ফাইল নয়!', 'err');
      return;
    }
    if (!confirm('⚠️ ব্যাকআপ রিস্টোর করলে বর্তমান ডাটার সাথে ব্যাকআপের ডাটা যুক্ত/আপডেট হবে। এগিয়ে যেতে চান?')) return;

    const writeStore = (storeName, items) => new Promise((resolve) => {
      if (!db || !Array.isArray(items) || !items.length) return resolve();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    await writeStore('attendance', data.attendance);
    await writeStore('students', data.students);
    await writeStore('holidays', data.holidays);
    await loadStudentsFromDB();
    await loadHolidaysFromDB();
    await loadMonthCache();
    renderStudentMonthlyRegister();
    toast('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে ✓', 'ok');
  } catch (err) {
    toast('ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে!', 'err');
  }
}

async function init() {
  await initDB();
  await loadStudentsFromDB();
  await loadHolidaysFromDB();
  renderTeacherPortal();
}

document.addEventListener('DOMContentLoaded', init);
