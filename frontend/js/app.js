/* =========================================================
   SHASTRA — Main Application
   Vivekananda Education Platform
   =========================================================

   Sections:
     1. DATA       — Quotes, sample student/class data
     2. FORMULAS   — Score calculation functions
     3. CHARTS     — Canvas line & bar helpers
     4. API        — apiFetch helper, API_BASE
     5. COMPONENTS — Reusable HTML builders
     6. SCREENS    — Login / Student / Teacher views
     7. BOOT       — Entry point
   ========================================================= */

/* ─────────────────────────────────────────────────────────
   1. DATA
   ───────────────────────────────────────────────────────── */

const QUOTES = {
  concentration: {
    sa: 'एकाग्रता', en: 'Concentration', icon: '🔥',
    q: 'The powers of the mind are like rays of light dissipated; when they are concentrated, they illumine.',
    src: 'Swami Vivekananda, Raja Yoga'
  },
  reliance: {
    sa: 'आत्मनिर्भरता', en: 'Self-Reliance', icon: '🌳',
    q: 'All the power is within you. Stand up and express the divinity within you.',
    src: 'Swami Vivekananda'
  },
  perseverance: {
    sa: 'दृढ़ता', en: 'Perseverance', icon: '⚡',
    q: 'Arise, awake, and stop not till the goal is reached.',
    src: 'Swami Vivekananda'
  },
  confidence: {
    sa: 'आत्मविश्वास', en: 'Confidence', icon: '⭐',
    q: 'If you believe yourselves to be sages, you will be sages this moment.',
    src: 'Swami Vivekananda'
  },
  character: {
    sa: 'चरित्र', en: 'Character', icon: '🛡️',
    q: 'We want that education by which character is formed, strength of mind is increased, and by which one can stand on one\'s own feet.',
    src: 'Swami Vivekananda'
  }
};

/* Sample student session data — sent to POST /api/metrics/compute for scoring */
const RAHUL = {
  name: 'Rahul Singh',
  today:  { focusSeconds: 1080, totalSeconds: 1200, tabSwitches: 1, correctStreak: 3 },
  week:   { tasksAttempted: 14, tasksNoHint: 11, hintsThisWeek: 6, hintsLastWeek: 11 },
  retries: { retriedCount: 5, eventualSuccess: 4, avgRetries: 2.4 },
  calibration: [
    { task: 'Fractions word problem',     rated: 4, actual: 3, difficulty: 3 },
    { task: 'Algebra: solve for x',       rated: 2, actual: 2, difficulty: 2 },
    { task: 'Geometry: area of triangle', rated: 5, actual: 4, difficulty: 2 },
    { task: 'Percentages',                rated: 3, actual: 2, difficulty: 2 },
    { task: 'Linear equations',           rated: 4, actual: 4, difficulty: 2 }
  ],
  trend: [61, 66, 70, 74, 78]
};

/* ─────────────────────────────────────────────────────────
   2. FORMULAS
   Scores come from POST /api/metrics/compute — no client-side
   calculation. This section only holds the display helper r().
   ───────────────────────────────────────────────────────── */

const r = n => Math.round(n * 10) / 10;

/* Cached API scores — populated by loadScores(), used by dashboard + progress */
let SCORES = null;

async function loadScores() {
  if (SCORES) return SCORES;
  const data = await apiFetch('/api/metrics/compute', {
    method: 'POST',
    body: JSON.stringify({
      today:       RAHUL.today,
      week:        RAHUL.week,
      retries:     RAHUL.retries,
      calibration: RAHUL.calibration,
    }),
  });
  SCORES = data.scores;
  return SCORES;
}

/* Class roster — demo data for the teacher view */
const CLASS = [
  { name: 'Rahul Singh',  conc: 65, rel: 69, pers: 87, overall: 74, trend: 'up' },
  { name: 'Priya Nair',   conc: 52, rel: 40, pers: 38, overall: 44, trend: 'down', flag: 'risk' },
  { name: 'Arjun Mehta',  conc: 88, rel: 91, pers: 85, overall: 89, trend: 'up',   flag: 'star' },
  { name: 'Sana Qureshi', conc: 67, rel: 70, pers: 64, overall: 67, trend: 'stable' },
  { name: 'Vikram Rao',   conc: 60, rel: 55, pers: 72, overall: 62, trend: 'up' }
];

const avg = k => r(CLASS.reduce((a, s) => a + s[k], 0) / CLASS.length);

/* ─────────────────────────────────────────────────────────
   3. CHARTS
   ───────────────────────────────────────────────────────── */

function cssVar(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function drawLine(ctx, data, labels) {
  const dpr = window.devicePixelRatio || 1;
  const W   = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width = W * dpr; ctx.canvas.height = 160 * dpr; ctx.scale(dpr, dpr);
  const w = W, h = 160, pad = 38, bot = 22;
  ctx.clearRect(0, 0, w, h);

  const lineC = cssVar('--line') || '#e2cfa4', ink = cssVar('--ink') || '#1c1207';
  const acc   = cssVar('--saffron') || '#e07020', mut = cssVar('--muted') || '#7a6348';
  const sx    = (w - pad - 14) / (data.length - 1);

  ctx.strokeStyle = lineC; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.fillStyle = mut; ctx.font = '10px Hind'; ctx.textAlign = 'right';
    ctx.fillText(v, pad - 4, y + 4);
  });

  ctx.beginPath();
  data.forEach((v, i) => { const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.lineTo(pad + sx * (data.length - 1), h - bot); ctx.lineTo(pad, h - bot); ctx.closePath();
  ctx.fillStyle = 'rgba(224,112,32,0.10)'; ctx.fill();

  ctx.beginPath();
  data.forEach((v, i) => { const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.strokeStyle = acc; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  data.forEach((v, i) => {
    const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fillStyle = acc; ctx.fill();
    ctx.fillStyle = ink; ctx.font = 'bold 11px Hind'; ctx.textAlign = 'center';
    ctx.fillText(v, x, y - 10);
    ctx.fillStyle = mut; ctx.font = '10px Hind'; ctx.fillText(labels[i], x, h - 6);
  });
  ctx.textAlign = 'left';
}

function drawBar(ctx, labels, series) {
  const dpr = window.devicePixelRatio || 1;
  const W   = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width = W * dpr; ctx.canvas.height = 180 * dpr; ctx.scale(dpr, dpr);
  const w = W, h = 180, pad = 38, bot = 24;
  ctx.clearRect(0, 0, w, h);

  const lineC = cssVar('--line') || '#e2cfa4', ink = cssVar('--ink') || '#1c1207';
  const mut   = cssVar('--muted') || '#7a6348';
  const gw    = (w - pad - 10) / labels.length, bw = gw / (series.length + 1.5);

  ctx.strokeStyle = lineC; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 6, y); ctx.stroke();
  });

  labels.forEach((lab, gi) => {
    series.forEach((s, si) => {
      const v = s.data[gi], bh = (h - pad - bot) * (v / 100);
      ctx.fillStyle = s.color;
      ctx.fillRect(pad + gi * gw + si * bw + 6, pad + (h - pad - bot) - bh, bw - 3, bh);
    });
    ctx.fillStyle = ink; ctx.font = '10px Hind'; ctx.textAlign = 'center';
    ctx.fillText(lab, pad + gi * gw + gw / 2 - bw / 2, h - 8);
  });

  ctx.textAlign = 'left'; let lx = pad;
  series.forEach(s => {
    ctx.fillStyle = s.color; ctx.fillRect(lx, 6, 10, 10);
    ctx.fillStyle = mut; ctx.font = '9px Hind'; ctx.fillText(s.label, lx + 13, 15);
    lx += ctx.measureText(s.label).width + 28;
  });
}

/* ─────────────────────────────────────────────────────────
   4. API HELPERS
   ───────────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:5000';

/**
 * Fetch wrapper: adds Content-Type, auto-attaches Bearer token,
 * parses JSON, throws on non-2xx with the server's error message.
 */
async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (err) {
    throw new Error('Network error — is the server running?');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

/* ─────────────────────────────────────────────────────────
   5. COMPONENTS — Reusable HTML builders
   ───────────────────────────────────────────────────────── */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mount = html => { document.getElementById('app').innerHTML = html; };

/* Inline SVG portrait — no external image required */
const PORTRAIT_SVG = `<svg viewBox="0 0 90 110" xmlns="http://www.w3.org/2000/svg" style="width:90px;height:110px;border-radius:10px;border:2px solid var(--saffron);flex:none"><defs><radialGradient id="bg" cx="50%" cy="50%"><stop offset="0%" stop-color="#6b2d10"/><stop offset="100%" stop-color="#2a0e04"/></radialGradient><radialGradient id="skin" cx="50%" cy="40%"><stop offset="0%" stop-color="#c87840"/><stop offset="100%" stop-color="#8b4820"/></radialGradient></defs><rect width="90" height="110" fill="url(#bg)"/><path d="M10 110 Q15 70 45 65 Q75 70 80 110Z" fill="#e07020" opacity=".9"/><path d="M28 68 Q45 80 62 68 L65 90 Q45 100 25 90Z" fill="#c87840"/><ellipse cx="45" cy="42" rx="22" ry="26" fill="url(#skin)"/><path d="M23 36 Q25 10 45 8 Q65 10 67 36 Q65 28 45 26 Q25 28 23 36Z" fill="#8b1a1a"/><path d="M23 36 Q24 24 45 22 Q66 24 67 36" fill="none" stroke="#e07020" stroke-width="1.5"/><ellipse cx="36" cy="42" rx="4.5" ry="3" fill="#1a0a04"/><ellipse cx="54" cy="42" rx="4.5" ry="3" fill="#1a0a04"/><circle cx="37" cy="41" r="1" fill="#fff" opacity=".7"/><circle cx="55" cy="41" r="1" fill="#fff" opacity=".7"/><path d="M31 37 Q36 34 41 37" stroke="#3a1a08" stroke-width="1.5" fill="none"/><path d="M49 37 Q54 34 59 37" stroke="#3a1a08" stroke-width="1.5" fill="none"/><path d="M43 44 Q41 50 45 52 Q49 50 47 44" stroke="#a05020" stroke-width="1" fill="none"/><path d="M37 55 Q45 58 53 55" stroke="#2a1008" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M39 60 Q45 63 51 60" stroke="#8b4020" stroke-width="1.2" fill="none"/><ellipse cx="23" cy="44" rx="3" ry="4.5" fill="#b86030"/><ellipse cx="67" cy="44" rx="3" ry="4.5" fill="#b86030"/><text x="38" y="100" font-size="12" fill="#e0aa30" font-family="serif">ॐ</text></svg>`;

const PORTRAIT_SM = `<svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg" style="width:50px;height:60px;border-radius:8px;border:2px solid var(--saffron)"><defs><radialGradient id="bg2" cx="50%" cy="50%"><stop offset="0%" stop-color="#6b2d10"/><stop offset="100%" stop-color="#2a0e04"/></radialGradient></defs><rect width="50" height="60" fill="url(#bg2)"/><path d="M5 60 Q10 38 25 35 Q40 38 45 60Z" fill="#e07020" opacity=".9"/><ellipse cx="25" cy="24" rx="13" ry="15" fill="#c87840"/><path d="M12 20 Q13 5 25 4 Q37 5 38 20 Q36 14 25 13 Q14 14 12 20Z" fill="#8b1a1a"/><ellipse cx="19" cy="23" rx="3" ry="2" fill="#1a0a04"/><ellipse cx="31" cy="23" rx="3" ry="2" fill="#1a0a04"/><path d="M20 31 Q25 34 30 31" stroke="#2a1008" stroke-width="1.5" fill="none" stroke-linecap="round"/><text x="19" y="55" font-size="8" fill="#e0aa30" font-family="serif">ॐ</text></svg>`;

function metricCard(kind, score, deltaTxt, deltaUp, formulaRows, totalLabel) {
  const info = QUOTES[kind], id = 'f-' + kind;
  return `<div class="card">
    <div class="m-head">
      <div class="m-icon-wrap">${info.icon}</div>
      <div><div class="m-title">${info.en.toUpperCase()}</div><div class="m-sanskrit">${info.sa}</div></div>
    </div>
    <div><span class="m-score">${score}</span>
      <span class="m-delta ${deltaUp ? 'up' : 'down'}">${deltaUp ? '▲' : '▼'} ${deltaTxt}</span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${score}%"></div></div>
    <div class="m-quote">"${info.q}"<br><span style="font-size:.7rem">— ${info.src}</span></div>
    <button class="howbtn" data-target="${id}">How is this calculated? ▾</button>
    <div class="formula" id="${id}" hidden>
      ${formulaRows.map(([l, v]) => `<div class="row"><span>${l}</span><b>${v}</b></div>`).join('')}
      <div class="total"><span>${totalLabel}</span><span>${score} / 100</span></div>
    </div>
  </div>`;
}

function bindToggles() {
  $$('.howbtn').forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById(b.dataset.target);
    t.hidden = !t.hidden;
    b.textContent = t.hidden ? 'How is this calculated? ▾' : 'Hide the math ▴';
  }));
}

function topbarHTML(label) {
  return `<div class="topbar">
    <div class="brand">
      <span style="font-size:1.6rem;color:#e8c98a;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div><div class="brand-name">Shastra</div><div class="brand-sub">शिक्षा जो मनुष्य बनाती है</div></div>
    </div>
    <div class="topbar-right">
      <span class="tpill">${label}</span>
      <button class="tlinkbtn" id="logout-btn">Switch account</button>
    </div>
  </div>`;
}
function bindLogout() {
  $('#logout-btn').onclick = () => { sessionStorage.clear(); renderLogin(); };
}

/* ─────────────────────────────────────────────────────────
   6. SCREENS
   ───────────────────────────────────────────────────────── */

/* ── Login ── */
function renderLogin() {
  sessionStorage.clear();

  mount(`<div class="login-bg"><div class="login-card">
    <div class="vivek-portrait">${PORTRAIT_SM}</div>
    <h1 class="login-title">Shastra</h1>
    <div class="login-subtitle">VIVEKANANDA EDUCATION PLATFORM</div>
    <p class="login-quote">"Education is the manifestation of the perfection already in man."</p>
    <div class="login-quote-attr">— Swami Vivekananda</div>
    <div class="role-toggle">
      <button id="role-student" class="active">🎓 Student</button>
      <button id="role-teacher">📚 Teacher</button>
    </div>
    <input class="login-input" id="uname" value="rahul_singh" placeholder="Username">
    <input class="login-input" id="pword" type="password" value="pass" placeholder="Password">
    <button class="login-go" id="go-btn">Enter the Path ›</button>
    <div id="login-error" style="color:#e44;font-size:.85rem;min-height:1.2em;margin-top:.4rem;text-align:center"></div>
    <div class="login-hint">Demo — Student: rahul_singh / pass · Teacher: teacher_priya / pass</div>
    <div class="mandala-bg">ॐ</div>
  </div></div>`);

  let role = 'student';
  $('#role-student').onclick = () => { role = 'student'; $('#role-student').classList.add('active'); $('#role-teacher').classList.remove('active'); $('#uname').value = 'rahul_singh'; };
  $('#role-teacher').onclick = () => { role = 'teacher'; $('#role-teacher').classList.add('active'); $('#role-student').classList.remove('active'); $('#uname').value = 'teacher_priya'; };

  $('#go-btn').onclick = async () => {
    const username = $('#uname').value.trim();
    const password = $('#pword').value;
    const errEl    = $('#login-error');
    const btn      = $('#go-btn');

    errEl.textContent = '';
    btn.disabled      = true;
    btn.textContent   = 'Entering…';

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      sessionStorage.setItem('token',    data.token);
      sessionStorage.setItem('role',     data.role);
      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('name',     data.name);

      if (data.role === 'teacher') {
        renderTeacher('overview');
      } else {
        renderStudent('dashboard');
      }
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled      = false;
      btn.textContent   = 'Enter the Path ›';
    }
  };
}

/* ── Student shell ── */
function renderStudent(tab) {
  learnCleanup();
  const name = sessionStorage.getItem('name') || 'Student';
  mount(`${topbarHTML(`Student · ${name}`)}
  <div class="wrap">
    <div class="vivek-sidebar">${PORTRAIT_SVG}
      <div class="content"><h3>Swami Vivekananda's Vision</h3>
        <p>"All the powers in the universe are already ours. It is we who have put our hands before our eyes and cry that it is dark." — The strength of your character is being measured here — not your marks.</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab" data-t="dashboard">📊 Dashboard</button>
      <button class="tab" data-t="learn">📖 Learn</button>
      <button class="tab" data-t="progress">📈 Progress</button>
    </div>
    <div id="tabbody"></div>
  </div>
  <div class="footer-strip">ॐ · Shastra · शिक्षा जो मनुष्य बनाती है · Inspired by Swami Vivekananda</div>`);

  bindLogout();
  $$('.tab').forEach(t => { t.classList.toggle('active', t.dataset.t === tab); t.onclick = () => renderStudent(t.dataset.t); });
  if (tab === 'dashboard') studentDashboard();
  if (tab === 'learn')     studentLearn();
  if (tab === 'progress')  studentProgress();
}

async function studentDashboard() {
  $('#tabbody').innerHTML = `
    <div class="q-banner"><span class="om" style="font-size:2.2rem;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div><div class="q-text">"${QUOTES.character.q}"</div><div class="q-attr">— ${QUOTES.character.src}</div></div>
    </div>
    <p class="section-note" id="dash-note" style="opacity:.5">Computing scores…</p>
    <div id="dash-grid"></div>`;

  let s;
  try {
    s = await loadScores();
  } catch (err) {
    $('#dash-note').textContent = `⚠ Could not load scores: ${err.message}`;
    return;
  }

  const C  = s.concentration;
  const R  = s.reliance;
  const P  = s.perseverance;
  const CO = s.confidence;
  const CH = s.character;

  $('#dash-note').textContent = 'Every score is computed server-side from your session data — tap "How is this calculated?" to see the exact math.';
  $('#dash-note').style.opacity = '';

  $('#dash-grid').innerHTML = `
    <div class="grid">
      ${metricCard('concentration', C.total, Math.round(C.total - 70) + ' this week', true,
        [[`Focus time: ${RAHUL.today.focusSeconds}s / ${RAHUL.today.totalSeconds}s (${r(C.focusPct)}%) × 60`, C.base],
         [`− Tab switches (${RAHUL.today.tabSwitches} × 4 pts)`, '−' + C.switchPenalty],
         [`+ Answer streak bonus (${RAHUL.today.correctStreak} × 5 pts)`, '+' + C.streakBonus]], 'Concentration score')}
      ${metricCard('reliance', R.total, r(R.hintDrop) + '% fewer hints', true,
        [[`Hint-free tasks: ${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted} × 70`, R.base],
         [`+ Hint reduction vs last week`, '+' + R.trendBonus]], 'Self-reliance score')}
      ${metricCard('perseverance', P.total, r(P.successRate) + '% success on retries', true,
        [[`Success after retry: ${r(P.successRate)}% × 65`, P.base],
         [`+ Healthy retry range (avg ${RAHUL.retries.avgRetries}, ideal 2–3.2)`, '+' + P.rangeFit]], 'Perseverance score')}
      ${metricCard('confidence', CO.total, r(CO.avgErr) + ' avg error', CO.avgErr < 1.5,
        [[`Calibration score × 0.8`, CO.calibScore],
         [`+ Hard task bonus (difficulty ≥ 3)`, '+' + CO.hardBonus]], 'Confidence score')}
    </div>
    <div class="card" style="margin-top:18px">
      <div class="m-head"><div class="m-icon-wrap">${QUOTES.character.icon}</div>
        <div><div class="m-title">CHARACTER — THE COMPOSITE</div><div class="m-sanskrit">${QUOTES.character.sa}</div></div>
      </div>
      <div><span class="m-score" style="color:var(--maroon)">${CH.total}</span><span class="m-delta up">▲ Growing</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${CH.total}%"></div></div>
      <div class="m-quote">"${QUOTES.character.q}"<br><span style="font-size:.7rem">— ${QUOTES.character.src}</span></div>
      <button class="howbtn" data-target="f-character">How is this calculated? ▾</button>
      <div class="formula" id="f-character" hidden>
        <div class="row"><span>Concentration × 25%</span><b>${r(C.total * .25)}</b></div>
        <div class="row"><span>Self-Reliance × 25%</span><b>${r(R.total * .25)}</b></div>
        <div class="row"><span>Perseverance × 25%</span><b>${r(P.total * .25)}</b></div>
        <div class="row"><span>Confidence × 25%</span><b>${r(CO.total * .25)}</b></div>
        <div class="total"><span>Character Score</span><span>${CH.total} / 100</span></div>
      </div>
    </div>`;
  bindToggles();
}

function studentProgress() {
  const avgErr = SCORES ? r(SCORES.confidence.avgErr) : '—';
  $('#tabbody').innerHTML = `
    <p class="section-note">Five weeks of concentration scores — raw data, nothing adjusted.</p>
    <div class="card" style="padding:16px"><canvas id="trendChart" height="160"></canvas></div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0;color:var(--maroon)">Week-over-week changes</h3>
      <div class="formula" style="border-top:none;margin-top:0">
        <div class="row"><span>Hints used (last → this week)</span><b>${RAHUL.week.hintsLastWeek} → ${RAHUL.week.hintsThisWeek}</b></div>
        <div class="row"><span>Hint-free tasks</span><b>${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted}</b></div>
        <div class="row"><span>Retries that eventually succeeded</span><b>${RAHUL.retries.eventualSuccess}/${RAHUL.retries.retriedCount}</b></div>
        <div class="row"><span>Avg self-rating error</span><b>${avgErr} pts</b></div>
      </div>
    </div>`;
  requestAnimationFrame(() => drawLine($('#trendChart').getContext('2d'), RAHUL.trend, ['Wk1','Wk2','Wk3','Wk4','Wk5']));
}

/* ─────────────────────────────────────────────────────────
   Learn state — all mutable state for the Learn tab
   ───────────────────────────────────────────────────────── */
let LS = {
  tasks: [],       // loaded from GET /api/tasks
  taskIdx:    0,
  confidence: 0,
  focusing:   true,
  focusedFor: 0,   // active focus seconds
  totalSecs:  0,   // wall-clock seconds since task selected
  hintLevel:  0,   // how many hints revealed
  hintsData:  [],  // hint text from API (cached after first fetch)
  retryCount: 0,   // wrong-answer attempts before eventual success
  solved:     false,
  submitting: false,
  tabSwitches: 0,
  _iv:    null,    // focus interval
  _visEl: null,    // document visibilitychange handler ref
};

/* Stop timer + remove visibility listener — call on every tab/screen change */
function learnCleanup() {
  if (LS._iv)    { clearInterval(LS._iv); LS._iv = null; }
  if (LS._visEl) { document.removeEventListener('visibilitychange', LS._visEl); LS._visEl = null; }
}

/* Reset per-task fields (keep tasks array) */
function resetTaskState() {
  learnCleanup();
  LS.confidence = 0;
  LS.focusing   = true;
  LS.focusedFor = 0;
  LS.totalSecs  = 0;
  LS.hintLevel  = 0;
  LS.hintsData  = [];
  LS.retryCount = 0;
  LS.solved     = false;
  LS.submitting = false;
  LS.tabSwitches = 0;
}

/* ── studentLearn: load tasks from API, then render ── */
async function studentLearn() {
  $('#tabbody').innerHTML = `
    <div class="learn-grid">
      <div class="task-list" id="task-list">
        <p class="section-note" style="padding:16px;opacity:.7">Loading tasks…</p>
      </div>
      <div class="panel" id="task-panel"></div>
    </div>`;

  learnCleanup();
  LS.tasks = [];

  try {
    const data = await apiFetch('/api/tasks');
    LS.tasks = data.tasks || [];
    if (!LS.tasks.length) {
      $('#task-list').innerHTML = `<p class="section-note" style="padding:16px">No tasks available.</p>`;
      return;
    }
    LS.taskIdx = 0;
    renderLearnList();
    selectLearnTask(0);
  } catch (err) {
    $('#task-list').innerHTML = `
      <div class="feedback no" style="margin:16px">
        ⚠ Backend unavailable: ${err.message}
        <br><small>Make sure the server is running on localhost:5000, then refresh.</small>
      </div>`;
  }
}

function renderLearnList() {
  $('#task-list').innerHTML = LS.tasks.map((t, i) => `
    <button class="task-item ${i === LS.taskIdx ? 'sel' : ''}" data-i="${i}">
      <div style="font-weight:700">${t.title}</div>
      <div class="t-sub">${t.subject}</div>
    </button>`).join('');
  $$('.task-item').forEach(b => b.onclick = () => selectLearnTask(+b.dataset.i));
}

function selectLearnTask(idx) {
  resetTaskState();
  LS.taskIdx = idx;
  $$('.task-item').forEach(b => b.classList.toggle('sel', +b.dataset.i === idx));
  renderLearnPanel();
}

function renderLearnPanel() {
  const t = LS.tasks[LS.taskIdx];
  if (!t) return;

  $('#task-panel').innerHTML = `
    <div class="tracker">
      <span class="dot${LS.focusing ? '' : ' off'}"></span>
      <span>${LS.focusing ? 'Focus tracking active' : 'Paused'}</span>
      <span class="log">+<span id="fsecs">${LS.focusedFor}</span>s focus</span>
    </div>
    <div class="conf-label">Rate your confidence before starting (1–5 ★)</div>
    <div class="stars">${[1,2,3,4,5].map(n =>
      `<button class="star${n <= LS.confidence ? ' on' : ''}" data-n="${n}">★</button>`).join('')}
    </div>
    <div class="problem">${t.question}</div>
    <div class="ans">
      <input id="ans-in" placeholder="Your answer…">
    </div>
    <div class="btnrow">
      <button class="btn primary" id="sub-btn" ${LS.confidence === 0 ? 'disabled' : ''} title="${LS.confidence === 0 ? 'Select a confidence rating above first' : ''}">Submit Answer</button>
      <button class="btn ghost" id="hint-btn">Need a Hint?</button>
    </div>
    ${LS.confidence === 0 ? '<div style="font-size:.8rem;opacity:.6;margin-top:-6px">★ Rate your confidence above to unlock Submit</div>' : ''}
    <div id="fb"></div>
    <div id="hints"></div>
    <div class="live-calc">Tracking → Focus: <b>Concentration</b> · No hint: <b>Self-Reliance</b> · Retry: <b>Perseverance</b> · Star vs result: <b>Confidence</b></div>`;

  /* confidence stars */
  $$('.star').forEach(s => s.onclick = () => {
    LS.confidence = +s.dataset.n;
    $$('.star').forEach(x => x.classList.toggle('on', +x.dataset.n <= LS.confidence));
    $('#sub-btn').disabled = false;
    const hint = document.querySelector('.btnrow + div');
    if (hint) hint.remove();
  });

  /* hint button — fetch once, reveal progressively */
  $('#hint-btn').onclick = async () => {
    const btn = $('#hint-btn');
    btn.disabled = true;

    if (!LS.hintsData.length) {
      try {
        const data  = await apiFetch(`/api/tasks/${t.id}/hints`);
        LS.hintsData = data.hints || [];
      } catch {
        LS.hintsData = ['Work through the problem step by step.'];
      }
    }

    const maxHints = LS.hintsData.length;
    if (LS.hintLevel < maxHints) LS.hintLevel++;

    $('#hints').innerHTML =
      LS.hintsData.slice(0, LS.hintLevel)
        .map((h, i) => `<div class="hint-step">💡 Hint ${i + 1}: ${h}</div>`)
        .join('') +
      `<div class="live-calc">Hints used: <b>${LS.hintLevel}</b></div>`;

    if (LS.hintLevel < maxHints) btn.disabled = false;
  };

  /* submit button — calls API, guards double-click */
  $('#sub-btn').onclick = async () => {
    if (LS.submitting || LS.solved) return;
    LS.submitting = true;
    const btn = $('#sub-btn');
    btn.disabled = true;
    btn.textContent = 'Checking…';

    try {
      const result = await apiFetch(`/api/tasks/${t.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          studentId:    sessionStorage.getItem('username'),
          answer:       $('#ans-in').value.trim(),
          hintsUsed:    LS.hintLevel,
          selfRating:   LS.confidence,
          focusSeconds: LS.focusedFor,
          totalSeconds: LS.totalSecs,
          tabSwitches:  LS.tabSwitches,
          correctStreak: 0,
        }),
      });

      if (result.correct) {
        LS.solved = true;
        learnCleanup();
        $('#fb').innerHTML = `<div class="feedback ok">✅ Correct! Saving your session…</div>`;
        await saveLearnSession(t.id, 'solved');
      } else {
        LS.retryCount++;
        $('#fb').innerHTML = `<div class="feedback no">❌ Not quite — try again. A retry that succeeds counts toward <strong>Perseverance</strong>.</div>`;
        btn.textContent   = 'Submit Answer';
        btn.disabled      = false;
        LS.submitting     = false;
      }
    } catch (err) {
      $('#fb').innerHTML = `<div class="feedback no">⚠ ${err.message}</div>`;
      btn.textContent   = 'Submit Answer';
      btn.disabled      = false;
      LS.submitting     = false;
    }
  };

  /* focus timer — one interval, clears itself when DOM node is gone */
  LS._iv = setInterval(() => {
    const el = document.getElementById('fsecs');
    if (!el) { clearInterval(LS._iv); LS._iv = null; return; }
    LS.totalSecs++;
    if (LS.focusing) { LS.focusedFor++; el.textContent = LS.focusedFor; }
  }, 1000);

  /* tab-visibility tracking */
  LS._visEl = () => {
    if (document.hidden) {
      LS.focusing = false;
      LS.tabSwitches++;
    } else {
      LS.focusing = true;
    }
    const dot = document.querySelector('.dot');
    if (dot) dot.classList.toggle('off', !LS.focusing);
    const tracker = document.querySelector('.tracker span:nth-child(2)');
    if (tracker) tracker.textContent = LS.focusing ? 'Focus tracking active' : 'Paused';
  };
  document.addEventListener('visibilitychange', LS._visEl);
}

async function saveLearnSession(taskId, outcome) {
  const username = sessionStorage.getItem('username');
  const payload  = {
    taskId,
    focusSeconds:  LS.focusedFor,
    totalSeconds:  LS.totalSecs,
    tabSwitches:   LS.tabSwitches,
    correctStreak: 0,
    hintsUsed:     LS.hintLevel,
    selfRating:    LS.confidence,
    outcome,
    attempts:      LS.retryCount + 1,
  };

  try {
    await apiFetch(`/api/students/${username}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    $('#fb').innerHTML = `
      <div class="feedback ok">
        ✅ Session recorded!
        Focus: <b>${LS.focusedFor}s</b> · Hints: <b>${LS.hintLevel}</b> ·
        Confidence: <b>${LS.confidence}★</b> · Attempts: <b>${LS.retryCount + 1}</b>
        <br><small>This data will count toward your character metrics.</small>
      </div>`;
  } catch (err) {
    $('#fb').innerHTML = `
      <div class="feedback ok">
        ✅ Correct! (Session save failed: ${err.message})
      </div>`;
  }
}

/* ── Teacher shell ── */
function renderTeacher(tab) {
  const tName = sessionStorage.getItem('name') || 'Teacher';
  mount(`${topbarHTML(`Teacher · ${tName}`)}
  <div class="wrap">
    <div class="vivek-sidebar">${PORTRAIT_SVG}
      <div class="content"><h3>The Teacher's Mission</h3>
        <p>"Every soul is potentially divine. The goal is to manifest this divinity within." — A teacher is a gardener, not a moulder. Watch each student's inner fire grow.</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab" data-t="overview">🏫 Class Overview</button>
      <button class="tab" data-t="analytics">📊 Analytics</button>
    </div>
    <div id="tabbody"></div>
  </div>
  <div class="footer-strip">ॐ · Shastra · शिक्षा जो मनुष्य बनाती है · Inspired by Swami Vivekananda</div>`);

  bindLogout();
  $$('.tab').forEach(t => { t.classList.toggle('active', t.dataset.t === tab); t.onclick = () => renderTeacher(t.dataset.t); });
  if (tab === 'overview')  teacherOverview();
  if (tab === 'analytics') teacherAnalytics();
}

function teacherOverview() {
  $('#tabbody').innerHTML = `
    <div class="q-banner"><span class="om" style="font-size:2.2rem;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div><div class="q-text">"The mark of a great teacher is one who has learned to see each student as the universe itself."</div>
        <div class="q-attr">— Swami Vivekananda (paraphrased)</div></div>
    </div>
    <p class="section-note">Class averages use the same formula as each student's own dashboard.</p>
    <div class="grid" style="margin-bottom:22px">
      ${metricCard('concentration', avg('conc'),    'class avg', true, [['Average of 5 students', avg('conc')]],    'Class Concentration')}
      ${metricCard('reliance',      avg('rel'),     'class avg', true, [['Average of 5 students', avg('rel')]],     'Class Self-Reliance')}
      ${metricCard('perseverance',  avg('pers'),    'class avg', true, [['Average of 5 students', avg('pers')]],    'Class Perseverance')}
      ${metricCard('character',     avg('overall'), 'class avg', true, [['Average of 5 students', avg('overall')]], 'Class Character')}
    </div>
    <h3 style="color:var(--maroon)">All Students</h3>
    ${CLASS.map(s=>`<div class="student-row">
      <div class="name">${s.name}</div>
      <div class="mini"><div>Conc.<b>${s.conc}</b></div><div>Reliance<b>${s.rel}</b></div><div>Perseverance<b>${s.pers}</b></div><div>Character<b>${s.overall}</b></div></div>
      ${s.flag==='risk'?'<span class="flag risk">⚠ needs attention</span>':''}
      ${s.flag==='star'?'<span class="flag star">★ strong growth</span>':''}
    </div>`).join('')}`;
  bindToggles();
}

function teacherAnalytics() {
  $('#tabbody').innerHTML = `
    <div class="card" style="padding:16px"><canvas id="classChart" height="180"></canvas></div>
    <div class="grid" style="margin-top:18px">
      <div class="card"><div style="font-weight:700;color:var(--warn);margin-bottom:8px">⚠ Needs Attention — Priya Nair</div>
        <p style="font-size:.84rem;margin:0">Self-reliance dropped 58→40 over three weeks. Hint use doubled while task attempts stayed flat. She is giving up before the healthy 2–3 retry range.</p></div>
      <div class="card"><div style="font-weight:700;color:var(--good);margin-bottom:8px">★ Strong Growth — Arjun Mehta</div>
        <p style="font-size:.84rem;margin:0">Concentration rose 9 points this month — more uninterrupted focus and longer correct-answer streaks, not fewer tasks. A genuine internal improvement.</p></div>
    </div>`;
  requestAnimationFrame(() => drawBar($('#classChart').getContext('2d'),
    CLASS.map(s => s.name.split(' ')[0]),
    [{label:'Concentration',data:CLASS.map(s=>s.conc),color:'#e07020'},
     {label:'Self-Reliance',data:CLASS.map(s=>s.rel), color:'#6b1a2a'},
     {label:'Perseverance', data:CLASS.map(s=>s.pers),color:'#2d6e45'}]));
}

/* ─────────────────────────────────────────────────────────
   7. BOOT
   ───────────────────────────────────────────────────────── */
renderLogin();
