/* =========================================================
   APP — UI render functions
   Depends on: data.js (QUOTES, RAHUL, CLASS, C/R/P/CO/CH,
               avg, PORTRAIT_SVG, PORTRAIT_SM, r)
               charts.js (drawLine, drawBar)
   ========================================================= */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mount = html => { document.getElementById('app').innerHTML = html; };

/* ── Metric card component ── */
function metricCard(kind, score, deltaTxt, deltaUp, formulaRows, totalLabel) {
  const info = QUOTES[kind];
  const id   = 'f-' + kind;
  const rows = formulaRows
    .map(([l, v]) => `<div class="row"><span>${l}</span><b>${v}</b></div>`)
    .join('');
  return `
  <div class="card">
    <div class="m-head">
      <div class="m-icon-wrap">${info.icon}</div>
      <div>
        <div class="m-title">${info.en.toUpperCase()}</div>
        <div class="m-sanskrit">${info.sa}</div>
      </div>
    </div>
    <div>
      <span class="m-score">${score}</span>
      <span class="m-delta ${deltaUp ? 'up' : 'down'}">${deltaUp ? '▲' : '▼'} ${deltaTxt}</span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${score}%"></div></div>
    <div class="m-quote">"${info.q}"<br><span style="font-size:.7rem">— ${info.src}</span></div>
    <button class="howbtn" data-target="${id}">How is this calculated? ▾</button>
    <div class="formula" id="${id}" hidden>${rows}
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

/* ── Shared top bar ── */
function topbarHTML(label) {
  return `
  <div class="topbar">
    <div class="brand">
      <span style="font-size:1.6rem;color:#e8c98a;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div>
        <div class="brand-name">Shastra</div>
        <div class="brand-sub">शिक्षा जो मनुष्य बनाती है</div>
      </div>
    </div>
    <div class="topbar-right">
      <span class="tpill">${label}</span>
      <button class="tlinkbtn" id="logout-btn">Switch account</button>
    </div>
  </div>`;
}
function bindLogout() { $('#logout-btn').onclick = renderLogin; }

/* =========================================================
   LOGIN
   ========================================================= */
function renderLogin() {
  mount(`
  <div class="login-bg">
    <div class="login-card">
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
      <div class="login-hint">Prototype — any password works. Try both Student &amp; Teacher roles.</div>
      <div class="mandala-bg">ॐ</div>
    </div>
  </div>`);

  let role = 'student';
  $('#role-student').onclick = () => {
    role = 'student';
    $('#role-student').classList.add('active');
    $('#role-teacher').classList.remove('active');
    $('#uname').value = 'rahul_singh';
  };
  $('#role-teacher').onclick = () => {
    role = 'teacher';
    $('#role-teacher').classList.add('active');
    $('#role-student').classList.remove('active');
    $('#uname').value = 'teacher_priya';
  };
  $('#go-btn').onclick = () =>
    role === 'student' ? renderStudent('dashboard') : renderTeacher('overview');
}

/* =========================================================
   STUDENT
   ========================================================= */
function renderStudent(tab) {
  mount(`
  ${topbarHTML('Student · Rahul Singh')}
  <div class="wrap">
    <div class="vivek-sidebar">
      ${PORTRAIT_SVG}
      <div class="content">
        <h3>Swami Vivekananda's Vision</h3>
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
  $$('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.t === tab);
    t.onclick = () => renderStudent(t.dataset.t);
  });

  if (tab === 'dashboard') studentDashboard();
  if (tab === 'learn')     studentLearn();
  if (tab === 'progress')  studentProgress();
}

function studentDashboard() {
  $('#tabbody').innerHTML = `
    <div class="q-banner">
      <span class="om" style="font-size:2.2rem;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div>
        <div class="q-text">"${QUOTES.character.q}"</div>
        <div class="q-attr">— ${QUOTES.character.src}</div>
      </div>
    </div>
    <p class="section-note">Every score below is computed from your actual session data — tap <strong>"How is this calculated?"</strong> to see the exact math.</p>
    <div class="grid">
      ${metricCard('concentration', C.total, Math.round(C.total - 70) + ' this week', true, [
        [`Focus time: ${RAHUL.today.focusSeconds}s / ${RAHUL.today.totalSeconds}s (${r(C.focusPct * 100)}%) × 60`, C.base],
        [`− Tab switches (${RAHUL.today.tabSwitches} × 4 pts)`, '−' + C.switchPenalty],
        [`+ Answer streak bonus (${RAHUL.today.correctStreak} × 5 pts)`, '+' + C.streakBonus]
      ], 'Concentration score')}
      ${metricCard('reliance', R.total, r(R.hintDrop * 100) + '% fewer hints', true, [
        [`Hint-free tasks: ${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted} × 70`, R.base],
        [`+ Hint reduction vs last week (+30 max)`, '+' + R.trendBonus]
      ], 'Self-reliance score')}
      ${metricCard('perseverance', P.total, '4 of 5 retries succeeded', true, [
        [`Success after retry: ${RAHUL.retries.eventualSuccess}/${RAHUL.retries.retriedCount} × 65`, P.base],
        [`+ Healthy retry range (avg ${RAHUL.retries.avgRetries}, ideal 2–3.2)`, '+' + P.rangeFit]
      ], 'Perseverance score')}
      ${metricCard('confidence', CO.total, r(CO.avgErr) + ' avg self-rating error', CO.avgErr < 1.5, [
        [`Calibration: 100 − (avg|self−actual| × 22) × 0.8`, CO.calibScore],
        [`+ Hard task attempt bonus`, '+' + CO.hardBonus]
      ], 'Confidence score')}
    </div>
    <div class="card" style="margin-top:18px">
      <div class="m-head">
        <div class="m-icon-wrap">${QUOTES.character.icon}</div>
        <div>
          <div class="m-title">CHARACTER — THE COMPOSITE</div>
          <div class="m-sanskrit">${QUOTES.character.sa}</div>
        </div>
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
  $('#tabbody').innerHTML = `
    <p class="section-note">Five weeks of your concentration scores — raw data, nothing adjusted.</p>
    <div class="card" style="padding:16px"><canvas id="trendChart" height="160"></canvas></div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0;color:var(--maroon)">Week-over-week changes</h3>
      <div class="formula" style="border-top:none;margin-top:0">
        <div class="row"><span>Hints used (last week → this week)</span><b>${RAHUL.week.hintsLastWeek} → ${RAHUL.week.hintsThisWeek}</b></div>
        <div class="row"><span>Tasks attempted without any hint</span><b>${RAHUL.week.tasksNoHint}/${RAHUL.week.tasksAttempted}</b></div>
        <div class="row"><span>Retries that eventually succeeded</span><b>${RAHUL.retries.eventualSuccess}/${RAHUL.retries.retriedCount}</b></div>
        <div class="row"><span>Average self-rating error</span><b>${r(CO.avgErr)} points</b></div>
      </div>
    </div>`;
  requestAnimationFrame(() => {
    const ctx = $('#trendChart').getContext('2d');
    drawLine(ctx, RAHUL.trend, ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5']);
  });
}

/* ── Learn tab ── */
let LS = { taskIdx: 0, confidence: 0, focusing: true, focusedFor: 0, hintLevel: 0 };

const TASKS = [
  { title: 'Fractions word problem', sub: 'Arithmetic',
    q: 'A tank is 3/4 full. If 15 litres more fill it completely, what is the tank\'s total capacity?', answer: '60' },
  { title: 'Algebra: solve for x', sub: 'Algebra',
    q: 'Solve: 3x − 7 = 14', answer: '7' },
  { title: 'Geometry: triangle area', sub: 'Geometry',
    q: 'Find the area of a triangle with base 10 cm and height 6 cm.', answer: '30' }
];

function studentLearn() {
  $('#tabbody').innerHTML = `
  <div class="learn-grid">
    <div class="task-list" id="task-list"></div>
    <div class="panel" id="task-panel"></div>
  </div>`;
  renderTaskList();
  renderTaskPanel();
}

function renderTaskList() {
  $('#task-list').innerHTML = TASKS.map((t, i) => `
    <button class="task-item ${i === LS.taskIdx ? 'sel' : ''}" data-i="${i}">
      <div style="font-weight:700">${t.title}</div>
      <div class="t-sub">${t.sub}</div>
    </button>`).join('');
  $$('.task-item').forEach(b => b.onclick = () => {
    LS = { taskIdx: +b.dataset.i, confidence: 0, focusing: true, focusedFor: 0, hintLevel: 0 };
    renderTaskList(); renderTaskPanel();
  });
}

function renderTaskPanel() {
  const t = TASKS[LS.taskIdx];
  $('#task-panel').innerHTML = `
    <div class="tracker">
      <span class="dot ${LS.focusing ? '' : 'off'}"></span>
      <span>${LS.focusing ? 'Focus tracking active' : 'Tracking paused'}</span>
      <span class="log">+<span id="fsecs">0</span>s</span>
    </div>
    <div class="conf-label">Rate your confidence before starting (1–5 ★)</div>
    <div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="star" data-n="${n}">★</button>`).join('')}</div>
    <div class="problem">${t.q}</div>
    <div class="ans"><input id="ans-in" placeholder="Your answer…" ${LS.confidence === 0 ? 'disabled' : ''}></div>
    <div class="btnrow">
      <button class="btn primary" id="sub-btn" ${LS.confidence === 0 ? 'disabled' : ''}>Submit Answer</button>
      <button class="btn ghost"   id="hint-btn">Need a Hint?</button>
    </div>
    <div id="fb"></div>
    <div id="hints"></div>
    <div class="live-calc">Tracking → Focus time: <b>Concentration</b> · No hint used: <b>Self-Reliance</b> · Retry after wrong: <b>Perseverance</b> · Star rating vs result: <b>Confidence</b></div>`;

  $$('.star').forEach(s => s.onclick = () => {
    LS.confidence = +s.dataset.n;
    $$('.star').forEach(x => x.classList.toggle('on', +x.dataset.n <= LS.confidence));
    $('#ans-in').disabled = false;
    $('#sub-btn').disabled = false;
  });

  $('#hint-btn').onclick = () => {
    LS.hintLevel = Math.min(LS.hintLevel + 1, 3);
    const hints = [
      'Re-read and underline every known quantity.',
      'Set up one equation with a single unknown.',
      'Isolate the unknown and compute step by step.'
    ];
    $('#hints').innerHTML =
      hints.slice(0, LS.hintLevel)
           .map((h, i) => `<div class="hint-step">💡 Hint ${i + 1}: ${h}</div>`)
           .join('') +
      `<div class="live-calc">Hints used: <b>${LS.hintLevel}</b> — reduces this task's Self-Reliance contribution.</div>`;
  };

  $('#sub-btn').onclick = () => {
    const val = $('#ans-in').value.trim(), ok = val === t.answer;
    $('#fb').innerHTML = ok
      ? `<div class="feedback ok">✅ Correct! Logged: focus time, hints = ${LS.hintLevel}, confidence = ${LS.confidence}★, outcome = solved.</div>`
      : `<div class="feedback no">❌ Not quite — try again. A retry that eventually succeeds counts toward <strong>Perseverance</strong>.</div>`;
  };

  if (LS._iv) clearInterval(LS._iv);
  LS._iv = setInterval(() => {
    if (!LS.focusing) return;
    LS.focusedFor++;
    const el = document.getElementById('fsecs');
    if (el) el.textContent = LS.focusedFor; else clearInterval(LS._iv);
  }, 1000);
}

/* =========================================================
   TEACHER
   ========================================================= */
function renderTeacher(tab) {
  mount(`
  ${topbarHTML('Teacher · Class 8B')}
  <div class="wrap">
    <div class="vivek-sidebar">
      ${PORTRAIT_SVG}
      <div class="content">
        <h3>The Teacher's Mission</h3>
        <p>"Every soul is potentially divine. The goal is to manifest this divinity within." — Vivekananda's vision: a teacher is a gardener, not a moulder. Watch each student's inner fire grow.</p>
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
  $$('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.t === tab);
    t.onclick = () => renderTeacher(t.dataset.t);
  });

  if (tab === 'overview')   teacherOverview();
  if (tab === 'analytics')  teacherAnalytics();
}

function teacherOverview() {
  $('#tabbody').innerHTML = `
    <div class="q-banner">
      <span class="om" style="font-size:2.2rem;filter:drop-shadow(0 0 6px #ffb347)">ॐ</span>
      <div>
        <div class="q-text">"The mark of a great teacher is one who has learned to see each student as the universe itself."</div>
        <div class="q-attr">— Swami Vivekananda (paraphrased)</div>
      </div>
    </div>
    <p class="section-note">Class averages use the same formula as each student's own dashboard — nothing is calculated differently for the teacher view.</p>
    <div class="grid" style="margin-bottom:22px">
      ${metricCard('concentration', avg('conc'),    'class avg', true, [['Average of all 5 students', avg('conc')]],    'Class Concentration')}
      ${metricCard('reliance',      avg('rel'),     'class avg', true, [['Average of all 5 students', avg('rel')]],     'Class Self-Reliance')}
      ${metricCard('perseverance',  avg('pers'),    'class avg', true, [['Average of all 5 students', avg('pers')]],    'Class Perseverance')}
      ${metricCard('character',     avg('overall'), 'class avg', true, [['Average of all 5 students', avg('overall')]], 'Class Character')}
    </div>
    <h3 style="color:var(--maroon)">All Students</h3>
    ${CLASS.map(s => `
      <div class="student-row">
        <div class="name">${s.name}</div>
        <div class="mini">
          <div>Conc.<b>${s.conc}</b></div>
          <div>Reliance<b>${s.rel}</b></div>
          <div>Perseverance<b>${s.pers}</b></div>
          <div>Character<b>${s.overall}</b></div>
        </div>
        ${s.flag === 'risk' ? '<span class="flag risk">⚠ needs attention</span>' : ''}
        ${s.flag === 'star' ? '<span class="flag star">★ strong growth</span>' : ''}
      </div>`).join('')}`;
  bindToggles();
}

function teacherAnalytics() {
  $('#tabbody').innerHTML = `
    <div class="card" style="padding:16px"><canvas id="classChart" height="180"></canvas></div>
    <div class="grid" style="margin-top:18px">
      <div class="card">
        <div style="font-weight:700;color:var(--warn);margin-bottom:8px">⚠ Needs Attention — Priya Nair</div>
        <p style="font-size:.84rem;margin:0">Self-reliance dropped from 58 → 40 over three weeks. Hint use doubled while task attempts stayed flat. Her retry-to-success ratio is the class lowest — she is giving up before the healthy 2–3 retry range.</p>
      </div>
      <div class="card">
        <div style="font-weight:700;color:var(--good);margin-bottom:8px">★ Strong Growth — Arjun Mehta</div>
        <p style="font-size:.84rem;margin:0">Concentration rose 9 points this month — more uninterrupted focus and longer correct-answer streaks, not fewer or easier tasks. A genuine internal improvement per the formula.</p>
      </div>
    </div>`;
  requestAnimationFrame(() => {
    const ctx = $('#classChart').getContext('2d');
    drawBar(ctx, CLASS.map(s => s.name.split(' ')[0]), [
      { label: 'Concentration', data: CLASS.map(s => s.conc),  color: '#e07020' },
      { label: 'Self-Reliance', data: CLASS.map(s => s.rel),   color: '#6b1a2a' },
      { label: 'Perseverance',  data: CLASS.map(s => s.pers),  color: '#2d6e45' }
    ]);
  });
}

/* ── Boot ── */
renderLogin();
