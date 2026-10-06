/* =========================================================
   SHASTRA — Main Application
   Vivekananda Education Platform
   =========================================================

   Sections:
     1. DATA       — Quotes, sample student/class data
     2. FORMULAS   — Score calculation functions
     3. CHARTS     — Canvas line & bar helpers
     4. COMPONENTS — Reusable HTML builders
     5. SCREENS    — Login / Student / Teacher views
     6. BOOT       — Entry point
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

/* Sample student session data — replace with API calls in production */
const RAHUL = {
  name: 'Rahul Singh',
  today:  { focusSeconds: 1080, totalSeconds: 1200, tabSwitches: 1, correctStreak: 3 },
  week:   { tasksAttempted: 14, tasksNoHint: 11, hintsThisWeek: 6, hintsLastWeek: 11 },
  retries: { failuresThisWeek: 5, retriedCount: 5, eventualSuccess: 4, avgRetries: 2.4 },
  calibration: [
    { task: 'Fractions word problem',    rated: 4, actual: 3 },
    { task: 'Algebra: solve for x',      rated: 2, actual: 2 },
    { task: 'Geometry: area of triangle',rated: 5, actual: 4 },
    { task: 'Percentages',               rated: 3, actual: 2 },
    { task: 'Linear equations',          rated: 4, actual: 4 }
  ],
  trend: [61, 66, 70, 74, 78]
};

/* Practice tasks */
const TASKS = [
  { title: 'Fractions word problem', sub: 'Arithmetic',
    q: 'A tank is 3/4 full. If 15 litres more fill it completely, what is the tank\'s total capacity?', answer: '60' },
  { title: 'Algebra: solve for x',   sub: 'Algebra',
    q: 'Solve: 3x − 7 = 14', answer: '7' },
  { title: 'Geometry: triangle area',sub: 'Geometry',
    q: 'Find the area of a triangle with base 10 cm and height 6 cm.', answer: '30' }
];

/* ─────────────────────────────────────────────────────────
   2. FORMULAS
   ───────────────────────────────────────────────────────── */

const r = n => Math.round(n * 10) / 10;

function calcConcentration(d) {
  const fp            = d.focusSeconds / d.totalSeconds;
  const base          = r(fp * 60);
  const switchPenalty = Math.min(d.tabSwitches * 4, 15);
  const streakBonus   = Math.min(d.correctStreak * 5, 25);
  return { base, switchPenalty, streakBonus, focusPct: fp,
           total: Math.max(0, Math.min(100, r(base - switchPenalty + streakBonus))) };
}

function calcReliance(d) {
  const nhp        = d.tasksNoHint / d.tasksAttempted;
  const base       = r(nhp * 70);
  const hd         = d.hintsLastWeek > 0 ? (d.hintsLastWeek - d.hintsThisWeek) / d.hintsLastWeek : 0;
  const trendBonus = r(Math.max(0, hd) * 30);
  return { base, trendBonus, noHintPct: nhp, hintDrop: hd,
           total: Math.max(0, Math.min(100, r(base + trendBonus))) };
}

function calcPerseverance(d) {
  const sr   = d.eventualSuccess / d.retriedCount;
  const base = r(sr * 65);
  const rf   = d.avgRetries >= 2 && d.avgRetries <= 3.2
    ? 35 : Math.max(0, 35 - Math.abs(d.avgRetries - 2.5) * 12);
  return { base, rangeFit: r(rf), successRate: sr,
           total: Math.max(0, Math.min(100, r(base + r(rf)))) };
}

function calcConfidence(rows) {
  const errs = rows.map(r => Math.abs(r.rated - r.actual));
  const ae   = errs.reduce((a, b) => a + b, 0) / errs.length;
  const cs   = r(Math.max(0, 100 - ae * 22));
  const ah   = rows.filter(x => x.rated >= 4).length;
  const hb   = Math.min(ah * 4, 20);
  return { avgErr: r(ae), calibScore: cs, hardBonus: hb,
           total: Math.max(0, Math.min(100, r(cs * 0.8 + hb))) };
}

function calcCharacter(c, rv, p, co) {
  return { total: r(c * 0.25 + rv * 0.25 + p * 0.25 + co * 0.25) };
}

/* Pre-compute Rahul's scores */
const C  = calcConcentration(RAHUL.today);
const R  = calcReliance(RAHUL.week);
const P  = calcPerseverance(RAHUL.retries);
const CO = calcConfidence(RAHUL.calibration);
const CH = calcCharacter(C.total, R.total, P.total, CO.total);

/* Class roster — Rahul patched with live scores */
const CLASS = [
  { name: 'Rahul Singh',  conc: C.total,  rel: R.total,  pers: P.total,  overall: CH.total, trend: 'up' },
  { name: 'Priya Nair',   conc: 52,  rel: 40,  pers: 38,  overall: 44,  trend: 'down', flag: 'risk' },
  { name: 'Arjun Mehta',  conc: 88,  rel: 91,  pers: 85,  overall: 89,  trend: 'up',   flag: 'star' },
  { name: 'Sana Qureshi', conc: 67,  rel: 70,  pers: 64,  overall: 67,  trend: 'stable' },
  { name: 'Vikram Rao',   conc: 60,  rel: 55,  pers: 72,  overall: 62,  trend: 'up' }
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
   4. COMPONENTS
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
function bindLogout() { $('#logout-btn').onclick = renderLogin; }

/* ─────────────────────────────────────────────────────────
   5. SCREENS
   ───────────────────────────────────────────────────────── */

/* ── Login ── */
function renderLogin() {
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
    <div class="login-hint">Demo — Student: rahul_singh / pass · Teacher: teacher_priya / pass</div>
    <div class="mandala-bg">ॐ</div>
  </div></div>`);

  let role = 'student';
  $('#role-student').onclick = () => { role = 'student'; $('#role-student').classList.add('active'); $('#role-teacher').classList.remove('active'); $('#uname').value = 'rahul_singh'; };
  $('#role-teacher').onclick = () => { role = 'teacher'; $('#role-teacher').classList.add('active'); $('#role-student').classList.remove('active'); $('#uname').value = 'teacher_priya'; };
  $('#go-btn').onclick = () => role === 'student' ? renderStudent('dashboard') : renderTeacher('overview');
}

/* ── Student shell ── */
function renderStudent(tab) {
  mount(`${topbarHTML('Student · Rahul Singh')}
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

function studentDashboard() {
  $('#tabbody').innerHTML = `
    <div class="q-banner"><span class="om" style="font-size:2.2rem;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div><div class="q-text">"${QUOTES.character.q}"</div><div class="q-attr">— ${QUOTES.character.src}</div></div>
    </div>
    <p class="section-note">Every score is computed from your actual session data — tap <strong>"How is this calculated?"</strong> to see the exact math.</p>
    <div class="grid">
      ${metricCard('concentration', C.total, Math.round(C.total-70)+' this week', true,
        [[`Focus time: ${RAHUL.today.focusSeconds}s / ${RAHUL.today.totalSeconds}s (${r(C.focusPct*100)}%) × 60`, C.base],
         [`− Tab switches (${RAHUL.today.tabSwitches} × 4 pts)`, '−'+C.switchPenalty],
         [`+ Answer streak bonus (${RAHUL.today.correctStreak} × 5 pts)`, '+'+C.streakBonus]], 'Concentration score')}
      ${metricCard('reliance', R.total, r(R.hintDrop*100)+'% fewer hints', true,
        [[`Hint-free tasks: ${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted} × 70`, R.base],
         [`+ Hint reduction vs last week`, '+'+R.trendBonus]], 'Self-reliance score')}
      ${metricCard('perseverance', P.total, '4 of 5 retries succeeded', true,
        [[`Success after retry: ${RAHUL.retries.eventualSuccess}/${RAHUL.retries.retriedCount} × 65`, P.base],
         [`+ Healthy retry range (avg ${RAHUL.retries.avgRetries}, ideal 2–3.2)`, '+'+P.rangeFit]], 'Perseverance score')}
      ${metricCard('confidence', CO.total, r(CO.avgErr)+' avg error', CO.avgErr<1.5,
        [[`Calibration score × 0.8`, CO.calibScore],
         [`+ Hard task bonus`, '+'+CO.hardBonus]], 'Confidence score')}
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
        <div class="row"><span>Concentration × 25%</span><b>${r(C.total*.25)}</b></div>
        <div class="row"><span>Self-Reliance × 25%</span><b>${r(R.total*.25)}</b></div>
        <div class="row"><span>Perseverance × 25%</span><b>${r(P.total*.25)}</b></div>
        <div class="row"><span>Confidence × 25%</span><b>${r(CO.total*.25)}</b></div>
        <div class="total"><span>Character Score</span><span>${CH.total} / 100</span></div>
      </div>
    </div>`;
  bindToggles();
}

function studentProgress() {
  $('#tabbody').innerHTML = `
    <p class="section-note">Five weeks of concentration scores — raw data, nothing adjusted.</p>
    <div class="card" style="padding:16px"><canvas id="trendChart" height="160"></canvas></div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0;color:var(--maroon)">Week-over-week changes</h3>
      <div class="formula" style="border-top:none;margin-top:0">
        <div class="row"><span>Hints used (last → this week)</span><b>${RAHUL.week.hintsLastWeek} → ${RAHUL.week.hintsThisWeek}</b></div>
        <div class="row"><span>Hint-free tasks</span><b>${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted}</b></div>
        <div class="row"><span>Retries that eventually succeeded</span><b>${RAHUL.retries.eventualSuccess}/${RAHUL.retries.retriedCount}</b></div>
        <div class="row"><span>Avg self-rating error</span><b>${r(CO.avgErr)} pts</b></div>
      </div>
    </div>`;
  requestAnimationFrame(() => drawLine($('#trendChart').getContext('2d'), RAHUL.trend, ['Wk1','Wk2','Wk3','Wk4','Wk5']));
}

let LS = { taskIdx: 0, confidence: 0, focusing: true, focusedFor: 0, hintLevel: 0 };

function studentLearn() {
  $('#tabbody').innerHTML = `<div class="learn-grid"><div class="task-list" id="task-list"></div><div class="panel" id="task-panel"></div></div>`;
  renderTaskList(); renderTaskPanel();
}
function renderTaskList() {
  $('#task-list').innerHTML = TASKS.map((t, i) => `<button class="task-item ${i===LS.taskIdx?'sel':''}" data-i="${i}"><div style="font-weight:700">${t.title}</div><div class="t-sub">${t.sub}</div></button>`).join('');
  $$('.task-item').forEach(b => b.onclick = () => { LS = {taskIdx:+b.dataset.i,confidence:0,focusing:true,focusedFor:0,hintLevel:0}; renderTaskList(); renderTaskPanel(); });
}
function renderTaskPanel() {
  const t = TASKS[LS.taskIdx];
  $('#task-panel').innerHTML = `
    <div class="tracker"><span class="dot ${LS.focusing?'':'off'}"></span><span>${LS.focusing?'Focus tracking active':'Paused'}</span><span class="log">+<span id="fsecs">0</span>s</span></div>
    <div class="conf-label">Rate your confidence before starting (1–5 ★)</div>
    <div class="stars">${[1,2,3,4,5].map(n=>`<button class="star" data-n="${n}">★</button>`).join('')}</div>
    <div class="problem">${t.q}</div>
    <div class="ans"><input id="ans-in" placeholder="Your answer…" ${LS.confidence===0?'disabled':''}></div>
    <div class="btnrow">
      <button class="btn primary" id="sub-btn" ${LS.confidence===0?'disabled':''}>Submit Answer</button>
      <button class="btn ghost" id="hint-btn">Need a Hint?</button>
    </div>
    <div id="fb"></div><div id="hints"></div>
    <div class="live-calc">Tracking → Focus time: <b>Concentration</b> · No hint: <b>Self-Reliance</b> · Retry: <b>Perseverance</b> · Star vs result: <b>Confidence</b></div>`;

  $$('.star').forEach(s => s.onclick = () => {
    LS.confidence = +s.dataset.n;
    $$('.star').forEach(x => x.classList.toggle('on', +x.dataset.n <= LS.confidence));
    $('#ans-in').disabled = false; $('#sub-btn').disabled = false;
  });
  $('#hint-btn').onclick = () => {
    LS.hintLevel = Math.min(LS.hintLevel + 1, 3);
    const hints = ['Re-read and underline every known quantity.','Set up one equation with a single unknown.','Isolate the unknown and compute step by step.'];
    $('#hints').innerHTML = hints.slice(0, LS.hintLevel).map((h,i)=>`<div class="hint-step">💡 Hint ${i+1}: ${h}</div>`).join('') + `<div class="live-calc">Hints: <b>${LS.hintLevel}</b></div>`;
  };
  $('#sub-btn').onclick = () => {
    const ok = $('#ans-in').value.trim() === t.answer;
    $('#fb').innerHTML = ok
      ? `<div class="feedback ok">✅ Correct! Logged: hints=${LS.hintLevel}, confidence=${LS.confidence}★</div>`
      : `<div class="feedback no">❌ Not quite — try again. A retry that succeeds counts toward <strong>Perseverance</strong>.</div>`;
  };
  if (LS._iv) clearInterval(LS._iv);
  LS._iv = setInterval(() => { if (!LS.focusing) return; LS.focusedFor++; const el=document.getElementById('fsecs'); if(el) el.textContent=LS.focusedFor; else clearInterval(LS._iv); }, 1000);
}

/* ── Teacher shell ── */
function renderTeacher(tab) {
  mount(`${topbarHTML('Teacher · Class 8B')}
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
   6. BOOT
   ───────────────────────────────────────────────────────── */
renderLogin();
