/* =========================================================
   SHASTRA — Main Application
   =========================================================
   1. DATA       — Quotes, sample data
   2. API        — apiFetch helper
   3. CHARTS     — Canvas helpers
   4. ICONS      — Inline SVG icon set
   5. COMPONENTS — Shared builders (sidebar, metric card)
   6. SCREENS    — Landing / Login / Student / Teacher
   7. BOOT
   ========================================================= */

/* ─────────────────────────────────────────────────────────
   1. DATA
   ───────────────────────────────────────────────────────── */

const QUOTES = {
  concentration: { sa:'एकाग्रता',   en:'Concentration', icon:'🔥',
    q:'The powers of the mind are like rays of light dissipated; when they are concentrated, they illumine.',
    src:'Swami Vivekananda, Raja Yoga' },
  reliance:      { sa:'आत्मनिर्भरता', en:'Self-Reliance', icon:'🌳',
    q:'All the power is within you. Stand up and express the divinity within you.',
    src:'Swami Vivekananda' },
  perseverance:  { sa:'दृढ़ता',       en:'Perseverance',  icon:'⚡',
    q:'Arise, awake, and stop not till the goal is reached.',
    src:'Swami Vivekananda' },
  confidence:    { sa:'आत्मविश्वास', en:'Confidence',    icon:'⭐',
    q:'If you believe yourselves to be sages, you will be sages this moment.',
    src:'Swami Vivekananda' },
  character:     { sa:'चरित्र',      en:'Character',     icon:'🛡️',
    q:"We want that education by which character is formed, strength of mind is increased, and by which one can stand on one's own feet.",
    src:'Swami Vivekananda' },
};

const RAHUL = {
  name: 'Rahul Singh',
  today:  { focusSeconds:1080, totalSeconds:1200, tabSwitches:1, correctStreak:3 },
  week:   { tasksAttempted:14, tasksNoHint:11, hintsThisWeek:6, hintsLastWeek:11 },
  retries:{ retriedCount:5, eventualSuccess:4, avgRetries:2.4 },
  calibration: [
    { task:'Fractions word problem',     rated:4, actual:3, difficulty:3 },
    { task:'Algebra: solve for x',       rated:2, actual:2, difficulty:2 },
    { task:'Geometry: area of triangle', rated:5, actual:4, difficulty:2 },
    { task:'Percentages',                rated:3, actual:2, difficulty:2 },
    { task:'Linear equations',           rated:4, actual:4, difficulty:2 },
  ],
  trend: [61,66,70,74,78],
};

const CLASS = [
  { name:'Rahul Singh',   conc:72, rel:68, pers:75, conf:70, overall:71, trend:'up'   },
  { name:'Priya Nair',    conc:65, rel:72, pers:68, conf:68, overall:68, trend:'flat' },
  { name:'Arjun Mehta',   conc:60, rel:78, pers:78, conf:64, overall:64, trend:'up',  flag:'star' },
  { name:'Sana Qureshi',  conc:70, rel:72, pers:72, conf:73, overall:73, trend:'flat' },
  { name:'Vikram Rao',    conc:58, rel:80, pers:62, conf:62, overall:62, trend:'up'  },
];

const CLASS_TEACHER = 'teacher_priya';

const avg = k => Math.round(CLASS.reduce((a,s) => a + s[k], 0) / CLASS.length);

const r = n => Math.round(n * 10) / 10;
const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

/* cached API scores */
let SCORES = null;
async function loadScores() {
  if (SCORES) return SCORES;
  const data = await apiFetch('/api/metrics/compute', {
    method: 'POST',
    body: JSON.stringify({ today:RAHUL.today, week:RAHUL.week, retries:RAHUL.retries, calibration:RAHUL.calibration }),
  });
  SCORES = data.scores;
  return SCORES;
}

/* ─────────────────────────────────────────────────────────
   2. API HELPERS
   ───────────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:5000';

async function apiFetch(url, options = {}) {
  const token   = sessionStorage.getItem('token');
  const headers = { 'Content-Type':'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try { res = await fetch(`${API_BASE}${url}`, { ...options, headers }); }
  catch { throw new Error('Network error — is the server running?'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

/* ─────────────────────────────────────────────────────────
   3. CHARTS
   ───────────────────────────────────────────────────────── */

function cssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function drawMultiLine(ctx, seriesList, labels) {
  const dpr = window.devicePixelRatio || 1;
  const W   = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width = W * dpr; ctx.canvas.height = 180 * dpr; ctx.scale(dpr, dpr);
  const w = W, h = 180, pad = 38, bot = 24;
  ctx.clearRect(0, 0, w, h);

  const gridC = 'rgba(255,255,255,0.06)', mut = cssVar('--muted') || '#94A3B8';
  const n = labels.length;
  const sx = (w - pad - 14) / (n - 1);

  ctx.strokeStyle = gridC; ctx.lineWidth = 1;
  [0,25,50,75,100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v/100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.fillStyle = mut; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(v, pad - 5, y + 4);
  });

  labels.forEach((lab, i) => {
    const x = pad + sx * i;
    ctx.fillStyle = mut; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(lab, x, h - 6);
  });

  seriesList.forEach(({ data, color }) => {
    ctx.beginPath();
    data.forEach((v, i) => { const x = pad+sx*i, y = pad+(h-pad-bot)*(1-v/100); i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
    data.forEach((v, i) => {
      const x = pad+sx*i, y = pad+(h-pad-bot)*(1-v/100);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fillStyle = color; ctx.fill();
    });
  });
  ctx.textAlign = 'left';
}

function drawBar(ctx, labels, series) {
  const dpr = window.devicePixelRatio || 1;
  const W   = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width = W * dpr; ctx.canvas.height = 200 * dpr; ctx.scale(dpr, dpr);
  const w = W, h = 200, pad = 38, bot = 24;
  ctx.clearRect(0, 0, w, h);

  const gridC = 'rgba(255,255,255,0.06)', mut = cssVar('--muted') || '#94A3B8';
  const gw  = (w - pad - 10) / labels.length;
  const bw  = gw / (series.length + 1.5);

  ctx.strokeStyle = gridC; ctx.lineWidth = 1;
  [0,25,50,75,100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v/100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w-6, y); ctx.stroke();
  });

  labels.forEach((lab, gi) => {
    series.forEach((s, si) => {
      const v = s.data[gi], bh = (h - pad - bot) * (v/100);
      ctx.fillStyle = s.color;
      ctx.fillRect(pad + gi*gw + si*bw + 6, pad + (h-pad-bot) - bh, bw-3, bh);
    });
    ctx.fillStyle = mut; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(lab, pad + gi*gw + gw/2, h-8);
  });

  ctx.textAlign = 'left';
  let lx = pad;
  series.forEach(s => {
    ctx.fillStyle = s.color; ctx.fillRect(lx, 6, 10, 10);
    ctx.fillStyle = mut; ctx.font = '9px Inter'; ctx.fillText(s.label, lx+13, 15);
    lx += ctx.measureText(s.label).width + 30;
  });
}

/* ─────────────────────────────────────────────────────────
   4. ICONS
   ───────────────────────────────────────────────────────── */

const IC = {
  dashboard: `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  tasks:     `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  focus:     `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  progress:  `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  learning:  `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.42A12.08 12.08 0 0118.82 17a11.95 11.95 0 01-6.82 2.05A11.95 11.95 0 015.18 17a12.08 12.08 0 01.66-6.42L12 14z"/></svg>`,
  quotes:    `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>`,
  settings:  `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  students:  `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  analytics: `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  insights:  `<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  logout:    `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
  arrow:     `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  back:      `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  clock:     `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  google:    `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
};

/* ─────────────────────────────────────────────────────────
   5. COMPONENTS — shared builders
   ───────────────────────────────────────────────────────── */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mount = html => { document.getElementById('app').innerHTML = html; };

/* Real Vivekananda photograph */
const VIVEK_SM = `<img src="assets/vivekananda.png" alt="Swami Vivekananda" style="width:70px;height:85px;object-fit:cover;object-position:top center;border-radius:10px;border:2px solid rgba(217,119,6,.5)">`;

const VIVEK_LG = `<img src="assets/vivekananda.png" alt="Swami Vivekananda" style="width:320px;height:400px;object-fit:cover;object-position:top center;border-radius:16px;box-shadow:0 0 60px rgba(217,119,6,.25),0 0 120px rgba(180,60,10,.15)">`;

function sidebarHTML(activeTab, role) {
  const name     = sessionStorage.getItem('name') || (role === 'teacher' ? 'Teacher' : 'Student');
  const username = sessionStorage.getItem('username') || '';
  const initial  = name.charAt(0).toUpperCase();

  const studentNav = [
    { id:'dashboard',  icon: IC.dashboard, label:'Dashboard'   },
    { id:'learn',      icon: IC.tasks,     label:'My Tasks'    },
    { id:'activities', icon: IC.focus,     label:'Activities'  },
    { id:'progress',   icon: IC.progress,  label:'My Progress' },
    { id:'quotes',     icon: IC.quotes,    label:'Quotes'      },
    { id:'settings',   icon: IC.settings,  label:'Settings'    },
  ];
  const teacherNav = [
    { id:'overview',  icon: IC.dashboard,  label:'Dashboard'    },
    { id:'students',  icon: IC.students,   label:'My Students'  },
    { id:'analytics', icon: IC.analytics,  label:'Class Analytics' },
    { id:'settings',  icon: IC.settings,   label:'Settings'     },
  ];
  const nav = role === 'teacher' ? teacherNav : studentNav;

  return `<aside class="sidebar">
    <div class="sb-brand">
      <span class="om">ॐ</span>
      <span>Shastra</span>
    </div>
    <nav class="sb-nav">
      ${nav.map(n => `
        <button class="sb-item ${n.id === activeTab ? 'active' : ''}" data-tab="${n.id}">
          ${n.icon}<span>${n.label}</span>
        </button>`).join('')}
    </nav>
    <div class="sb-user">
      <div class="sb-avatar">${initial}</div>
      <div>
        <div class="sb-user-name">${name}</div>
        <div class="sb-user-role">${role === 'teacher' ? 'Teacher' : 'Student'}</div>
      </div>
      <button class="sb-logout" title="Sign out" id="sb-logout-btn">${IC.logout}</button>
    </div>
  </aside>

  <!-- Mobile Bottom Floating Glass Nav -->
  <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
    ${nav.map(n => `
      <button class="mb-item ${n.id === activeTab ? 'active' : ''}" data-tab="${n.id}" title="${n.label}">
        ${n.icon}<span>${n.label}</span>
      </button>`).join('')}
  </nav>`;
}

function bindSidebarNav(role) {
  if ($('#sb-logout-btn')) $('#sb-logout-btn').onclick = () => { sessionStorage.clear(); SCORES = null; renderLogin(); };
  $$('.sb-item, .mb-item').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      if (role === 'teacher') renderTeacher(tab);
      else renderStudent(tab);
    };
  });
}

/* Metric colour config */
const METRIC_CFG = {
  concentration: { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  reliance:      { color:'#10B981', bg:'rgba(16,185,129,0.15)' },
  perseverance:  { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)' },
  confidence:    { color:'#3B82F6', bg:'rgba(59,130,246,0.15)' },
  character:     { color:'#EC4899', bg:'rgba(236,72,153,0.15)' },
};

function metricCard(key, score, deltaText, isUp) {
  const q   = QUOTES[key];
  const cfg = METRIC_CFG[key];
  return `<div class="mc">
    <div class="mc-top">
      <div class="mc-icon" style="background:${cfg.bg};color:${cfg.color}">${q.icon}</div>
      <div class="mc-name">${q.en.toUpperCase()}</div>
    </div>
    <div>
      <span class="mc-score">${score}</span>
      <span class="mc-delta ${isUp ? 'up' : 'down'}">${isUp ? '↑' : '↓'} ${deltaText}</span>
    </div>
    <div class="mc-bar"><div class="mc-bar-fill" style="width:${score}%;background:${cfg.color}"></div></div>
  </div>`;
}

/* ─────────────────────────────────────────────────────────
   6. SCREENS
   ───────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */

function renderLanding() {
  mount(`
  <div class="landing">
    <nav class="land-nav">
      <div class="brand">
        <span class="om">ॐ</span>
        <span>Shastra</span>
      </div>
      <ul class="land-nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">How it Works</a></li>
        <li><a href="#">Impact</a></li>
      </ul>
      <div class="land-nav-actions">
        <button class="btn-login" id="land-login-btn">Login</button>
        <button class="btn btn-amber btn-sm" id="land-start-btn">Get Started ${IC.arrow}</button>
      </div>
    </nav>

    <div class="hero">
      <div class="hero-left">
        <div class="hero-badge">✦ Vivekananda-Inspired Education Platform</div>
        <h1><span class="om-word">ॐ Shastra</span></h1>
        <div class="hero-tag">Awakening Education</div>
        <p class="tagline" style="font-size:1.35rem;font-family:var(--font-head);color:var(--text2);margin-bottom:12px">Beyond Marks. Towards a Stronger You.</p>
        <p>An AI-powered learning platform inspired by Swami Vivekananda's teachings to measure what truly matters — your growth, character, and potential.</p>
        <div class="hero-actions">
          <button class="btn btn-amber btn-lg" id="land-start-btn2">Get Started</button>
          <button class="btn btn-outline btn-lg" style="border-color:rgba(255,255,255,.2)">Watch Demo</button>
        </div>
      </div>
      <div class="hero-right">
        <div class="portrait-glow">
          ${VIVEK_LG}
          <div class="hero-quote-bubble">
            <p>"Arise, awake, and stop not till the goal is reached."</p>
            <small>— Swami Vivekananda</small>
          </div>
        </div>
      </div>
    </div>

    <div class="metric-strip">
      <div class="strip-item">
        <div class="strip-icon" style="background:rgba(245,158,11,0.15);color:#F59E0B">🔥</div>
        <div class="strip-name">Concentration</div>
        <div class="strip-sub">Focus your mind</div>
      </div>
      <div class="strip-item">
        <div class="strip-icon" style="background:rgba(16,185,129,0.15);color:#10B981">🌳</div>
        <div class="strip-name">Self-Reliance</div>
        <div class="strip-sub">Trust your abilities</div>
      </div>
      <div class="strip-item">
        <div class="strip-icon" style="background:rgba(139,92,246,0.15);color:#8B5CF6">⚡</div>
        <div class="strip-name">Perseverance</div>
        <div class="strip-sub">Keep going</div>
      </div>
      <div class="strip-item">
        <div class="strip-icon" style="background:rgba(59,130,246,0.15);color:#3B82F6">⭐</div>
        <div class="strip-name">Confidence</div>
        <div class="strip-sub">Believe in yourself</div>
      </div>
      <div class="strip-item">
        <div class="strip-icon" style="background:rgba(236,72,153,0.15);color:#EC4899">🛡️</div>
        <div class="strip-name">Character</div>
        <div class="strip-sub">Be the best version</div>
      </div>
    </div>
  </div>`);

  $('#land-login-btn').onclick   = renderLogin;
  $('#land-start-btn').onclick   = renderLogin;
  $('#land-start-btn2').onclick  = renderLogin;
}

/* ══════════════════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════════════════ */

function renderLogin() {
  sessionStorage.clear();
  SCORES = null;

  mount(`
  <div class="auth-page">
    <div class="auth-split">
      <div class="auth-left">
        <a href="landingpage.html" class="brand" style="text-decoration:none"><span class="om">ॐ</span><span>Shastra</span></a>
        <div>
          <p class="auth-left-quote">"All the power is within you. You can do anything and everything."</p>
          <p class="auth-left-attr">— Swami Vivekananda</p>
        </div>
        <div class="auth-left-portrait" style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:24px">
          <img src="assets/vivekananda.png" alt="Swami Vivekananda"
            style="width:160px;height:200px;object-fit:cover;object-position:top center;
                   border-radius:14px;border:2px solid rgba(217,119,6,.4);
                   box-shadow:0 0 40px rgba(200,80,10,.35)">
        </div>
        <div style="margin-top:16px;font-size:.75rem;color:rgba(200,137,74,.6);text-align:center">
          Education is the manifestation of the perfection already in man.
        </div>
      </div>

      <div class="auth-right">
        <div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:1.3rem;color:var(--amber-l);filter:drop-shadow(0 0 8px rgba(245,158,11,.4))">ॐ</span>
            <span style="font-family:var(--font-head);font-size:1.05rem;font-weight:700;color:var(--muted);letter-spacing:.04em">Shastra</span>
          </div>
          <h2>Welcome Back</h2>
          <p class="auth-sub">Continue your journey beyond marks — Awakening education for character &amp; growth.</p>
        </div>

        <div class="field">
          <label for="uname">Username</label>
          <div class="field-wrap">
            <span class="field-icon"><svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <input class="login-input" id="uname" value="rahul_singh" placeholder="Enter your username" autocomplete="username">
          </div>
        </div>
        <div class="field">
          <label for="pword">Password</label>
          <div class="field-wrap">
            <span class="field-icon"><svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
            <input class="login-input" id="pword" type="password" value="pass" placeholder="Enter your password" autocomplete="current-password">
          </div>
        </div>

        <div class="auth-row">
          <label><input type="checkbox" class="auth-remember" checked> Remember me</label>
          <a href="#" style="color:var(--amber-l)">Forgot password?</a>
        </div>

        <div id="login-error"></div>

        <button class="btn btn-amber" style="width:100%;margin-bottom:4px;font-size:.95rem;padding:13px" id="go-btn">Sign In to Shastra</button>

        <div class="auth-divider"><span>OR</span></div>

        <button class="btn-google">
          ${IC.google} Continue with Google
        </button>

        <div class="auth-link">
          New here? <a href="#">Create a new student account</a>
        </div>

        <div class="auth-demo">
          <div class="auth-demo-title">⚡ Quick Demo Login</div>
          <div class="auth-demo-chips">
            <button type="button" class="demo-chip" id="demo-student" title="Click to fill student credentials">
              <span class="chip-role">Student</span> rahul_singh
            </button>
            <button type="button" class="demo-chip" id="demo-teacher" title="Click to fill teacher credentials">
              <span class="chip-role">Teacher</span> teacher_priya
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`);

  $('#go-btn').onclick = async () => {
    const username = $('#uname').value.trim();
    const password = $('#pword').value;
    const errEl    = $('#login-error');
    const btn      = $('#go-btn');

    errEl.textContent = '';
    btn.disabled      = true;
    btn.textContent   = 'Authenticating…';

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      sessionStorage.setItem('token',    data.token);
      sessionStorage.setItem('role',     data.role);
      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('name',     data.name);

      if (data.role === 'teacher') renderTeacher('overview');
      else                          renderStudent('dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled      = false;
      btn.innerHTML     = 'Sign In to Shastra';
    }
  };

  /* Demo account click autofill */
  if ($('#demo-student')) {
    $('#demo-student').onclick = () => {
      $('#uname').value = 'rahul_singh';
      $('#pword').value = 'pass';
      $('#go-btn').focus();
    };
  }
  if ($('#demo-teacher')) {
    $('#demo-teacher').onclick = () => {
      $('#uname').value = 'teacher_priya';
      $('#pword').value = 'pass';
      $('#go-btn').focus();
    };
  }

  /* allow Enter key */
  ['uname','pword'].forEach(id => {
    $(` #${id}`).addEventListener('keydown', e => { if (e.key === 'Enter') $('#go-btn').click(); });
  });
}

/* ══════════════════════════════════════════════════════════
   STUDENT SHELL
   ══════════════════════════════════════════════════════════ */

function renderStudent(tab) {
  learnCleanup();
  mount(`
  <div class="app-shell">
    ${sidebarHTML(tab, 'student')}
    <main class="main-content" id="main-content"></main>
  </div>`);
  bindSidebarNav('student');

  if (tab === 'dashboard')  studentDashboard();
  if (tab === 'learn')      studentLearn();
  if (tab === 'activities') studentActivities();
  if (tab === 'progress')   studentProgress();
  if (tab === 'quotes')     studentQuotes();
  if (tab === 'settings')   studentSettings();
}

/* ── Dashboard ── */
async function studentDashboard() {
  const name = sessionStorage.getItem('name') || 'Student';
  const firstName = name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  $('#main-content').innerHTML = `
    <div class="dash-header">
      <h2>${greet}, ${firstName}! 👋</h2>
      <p>Every small step forward is a big step towards a stronger you.</p>
      <div class="dash-meta">
        <span class="dash-date">${dateStr}</span>
        <span class="streak-badge">🔥 5 day streak</span>
      </div>
    </div>

    <div class="metric-row" id="metric-row">
      <div class="loading-state" style="grid-column:1/-1;padding:32px 0;font-size:.85rem">Computing scores…</div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-title">
          Your Growth Journey
          <small>Last 5 weeks</small>
        </div>
        <div class="chart-legend">
          <div class="cl-item"><div class="cl-dot" style="background:#F59E0B"></div>Concentration</div>
          <div class="cl-item"><div class="cl-dot" style="background:#10B981"></div>Self-Reliance</div>
          <div class="cl-item"><div class="cl-dot" style="background:#8B5CF6"></div>Perseverance</div>
          <div class="cl-item"><div class="cl-dot" style="background:#3B82F6"></div>Confidence</div>
        </div>
        <canvas id="growthChart"></canvas>
      </div>

      <div class="card today-task">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>Today's Challenge</span>
          <span style="font-size:.8rem;color:var(--amber-l);font-weight:700">⭐ ${getEarnedStars()} stars</span>
        </div>
        <div class="task-name">Personal Growth Challenge System</div>
        <div class="task-meta">
          <span class="task-badge medium">🔥 6 Categories</span>
          <span class="task-badge easy">${IC.clock} Daily Practice</span>
        </div>
        <div>
          <div class="task-progress-row"><span>Progress</span><span>${getCompletedTasks().length} challenges completed</span></div>
          <div class="task-prog-bar"><div class="task-prog-fill" style="width:${Math.min(100, Math.round((getCompletedTasks().length / 32) * 100))}%"></div></div>
        </div>
        <button class="btn btn-amber" style="width:100%;margin-top:8px" id="start-learn-btn">
          Open My Tasks ${IC.arrow}
        </button>
      </div>
    </div>

    <!-- Interactive Assessment Activities Quick Section -->
    <div class="card" style="margin-top:20px">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span>Character &amp; Cognitive Assessments</span>
        <button class="btn btn-ghost btn-sm" id="dash-all-act-btn">View Activities ${IC.arrow}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:10px">
        <div class="dash-quick-act">
          <div>
            <div style="font-size:.74rem;font-weight:700;color:var(--amber-l);text-transform:uppercase;letter-spacing:.05em">Mind &amp; Focus</div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--text);margin-top:2px">Focus Grid</div>
            <div style="font-size:.82rem;color:var(--muted);margin-top:2px" id="dash-fg-score-text">Measuring Concentration</div>
          </div>
          <button class="btn btn-amber btn-sm" id="dash-launch-fg-btn">Assess</button>
        </div>
        <div class="dash-quick-act">
          <div>
            <div style="font-size:.74rem;font-weight:700;color:#A78BFA;text-transform:uppercase;letter-spacing:.05em">Character &amp; Growth</div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--text);margin-top:2px">Keep Going</div>
            <div style="font-size:.82rem;color:var(--muted);margin-top:2px" id="dash-kg-score-text">Measuring Perseverance</div>
          </div>
          <button class="btn btn-amber btn-sm" style="background:linear-gradient(135deg,#7C3AED,#6D28D9)" id="dash-launch-kg-btn">Assess</button>
        </div>
      </div>
    </div>`;

  /* draw growth chart */
  requestAnimationFrame(() => {
    const c = $('#growthChart');
    if (c) drawMultiLine(c.getContext('2d'), [
      { data:[58,63,67,70,72], color:'#F59E0B' },
      { data:[55,60,63,66,68], color:'#10B981' },
      { data:[68,71,74,74,75], color:'#8B5CF6' },
      { data:[62,64,67,69,70], color:'#3B82F6' },
    ], ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5']);
  });

  $('#start-learn-btn').onclick = () => renderStudent('learn');

  /* wire up activity buttons */
  const actScores = getActivityScores();
  if (actScores['focus-grid']) {
    const fg = actScores['focus-grid'];
    if ($('#dash-fg-score-text')) $('#dash-fg-score-text').innerHTML = `Last Score: <strong>${fg.score}/100</strong> (${fg.category})`;
    if ($('#dash-launch-fg-btn')) $('#dash-launch-fg-btn').textContent = 'Retake';
  }
  if (actScores['keep-going']) {
    const kg = actScores['keep-going'];
    if ($('#dash-kg-score-text')) $('#dash-kg-score-text').innerHTML = `Last Score: <strong>${kg.score}/100</strong> (${kg.category})`;
    if ($('#dash-launch-kg-btn')) $('#dash-launch-kg-btn').textContent = 'Retake';
  }
  if ($('#dash-all-act-btn')) $('#dash-all-act-btn').onclick = () => renderStudent('activities');
  if ($('#dash-launch-fg-btn')) $('#dash-launch-fg-btn').onclick = () => { renderStudent('activities'); startFocusGrid(); };
  if ($('#dash-launch-kg-btn')) $('#dash-launch-kg-btn').onclick = () => { renderStudent('activities'); startKeepGoing(); };

  /* load live metric scores */
  try {
    const s = await loadScores();
    const C = s.concentration, R = s.reliance, P = s.perseverance, CO = s.confidence, CH = s.character;
    $('#metric-row').innerHTML =
      metricCard('concentration', C.total,  Math.abs(Math.round(C.total - 70))  + '% this week', C.total >= 70) +
      metricCard('reliance',      R.total,  Math.abs(Math.round(R.total - 62))  + '% this week', R.total >= 62) +
      metricCard('perseverance',  P.total,  Math.abs(Math.round(P.total - 65))  + '% this week', P.total >= 65) +
      metricCard('confidence',    CO.total, Math.abs(Math.round(CO.total - 63)) + '% this week', CO.total >= 63) +
      metricCard('character',     CH.total, 'Your Overall Score', true);
  } catch (err) {
    /* fallback to static demo scores */
    $('#metric-row').innerHTML =
      metricCard('concentration', 72, '12%', true) +
      metricCard('reliance',      68, '8%',  true) +
      metricCard('perseverance',  75, '15%', true) +
      metricCard('confidence',    70, '10%', true) +
      metricCard('character',     71, 'Your Overall Score', true);
  }
}

/* ── Progress ── */
async function studentProgress() {
  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>My Growth Insights</h2>
      <p>See how you are evolving over time.</p>
    </div>

    <div class="prog-filters">
      <button class="pf-btn" data-range="7">Last 7 Days</button>
      <button class="pf-btn active" data-range="30">Last 30 Days</button>
      <button class="pf-btn" data-range="90">Last 3 Months</button>
    </div>

    <div class="stat-row">
      <div class="stat-box"><div class="sv">72</div><div class="sl">Concentration</div></div>
      <div class="stat-box"><div class="sv">68</div><div class="sl">Self-Reliance</div></div>
      <div class="stat-box"><div class="sv">75</div><div class="sl">Perseverance</div></div>
      <div class="stat-box"><div class="sv">70</div><div class="sl">Confidence</div></div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title">Metric Trends</div>
      <div class="chart-legend">
        <div class="cl-item"><div class="cl-dot" style="background:#F59E0B"></div>Concentration</div>
        <div class="cl-item"><div class="cl-dot" style="background:#10B981"></div>Self-Reliance</div>
        <div class="cl-item"><div class="cl-dot" style="background:#8B5CF6"></div>Perseverance</div>
        <div class="cl-item"><div class="cl-dot" style="background:#3B82F6"></div>Confidence</div>
      </div>
      <canvas id="progressChart"></canvas>
    </div>

    <div class="insight-row">
      <div class="insight-card strength">
        <h4>✅ Strengths</h4>
        <p>Great improvement in <strong>Self-Reliance</strong> — you used 45% fewer hints this week compared to last week. Your perseverance score is at its highest this month.</p>
      </div>
      <div class="insight-card focus-area">
        <h4>🎯 Areas to Focus</h4>
        <p>Try to reduce hint usage to improve <strong>Self-Reliance</strong> further. Work on consistent focus sessions to boost your Concentration score beyond 75.</p>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    const c = $('#progressChart');
    if (c) drawMultiLine(c.getContext('2d'), [
      { data:[58,63,67,70,72], color:'#F59E0B' },
      { data:[55,60,63,66,68], color:'#10B981' },
      { data:[68,71,74,74,75], color:'#8B5CF6' },
      { data:[62,64,67,69,70], color:'#3B82F6' },
    ], ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5']);
  });

  $$('.pf-btn').forEach(b => b.onclick = () => {
    $$('.pf-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
}

/* ── Quotes ── */
function studentQuotes() {
  const all   = Object.values(QUOTES);
  const keys  = Object.keys(QUOTES);
  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>Vivekananda's Wisdom</h2>
      <p>Let these words guide your journey.</p>
    </div>

    <!-- Feature banner with real photo -->
    <div style="display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center;
                background:linear-gradient(135deg,rgba(120,40,8,.55) 0%,rgba(20,10,5,.8) 100%);
                border:1px solid rgba(217,119,6,.2);border-radius:18px;padding:28px;margin-bottom:28px;overflow:hidden">
      <img src="assets/vivekananda.png" alt="Swami Vivekananda"
        style="width:200px;height:240px;object-fit:cover;object-position:top center;
               border-radius:12px;border:2px solid rgba(217,119,6,.4);
               box-shadow:0 0 40px rgba(200,80,10,.4)">
      <div>
        <div style="font-size:2.5rem;color:var(--amber-l);margin-bottom:8px;filter:drop-shadow(0 0 8px rgba(245,158,11,.4))">ॐ</div>
        <div style="font-family:var(--font-head);font-style:italic;font-size:1.3rem;color:#f5debb;line-height:1.6;margin-bottom:14px">
          "Arise, awake, and stop not till the goal is reached."
        </div>
        <div style="font-size:.85rem;color:var(--amber-l)">— Swami Vivekananda</div>
        <div style="margin-top:10px;font-size:.8rem;color:var(--muted)">
          Inspiring millions since 1863. Shastra is built on his vision of education that builds character, not just knowledge.
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      ${all.map((q, i) => `
        <div class="card" style="border-left:3px solid ${METRIC_CFG[keys[i]].color}">
          <div style="font-size:1.5rem;margin-bottom:10px">${q.icon}</div>
          <div style="font-family:var(--font-head);font-style:italic;font-size:1rem;color:var(--text2);line-height:1.6;margin-bottom:12px">"${q.q}"</div>
          <div style="font-size:.78rem;color:var(--muted)">— ${q.src}</div>
          <div style="margin-top:8px;font-size:.78rem;color:var(--amber-l);font-weight:600">${q.en} · ${q.sa}</div>
        </div>`).join('')}
    </div>`;
}

/* ── Settings ── */
function studentSettings() {
  const name = sessionStorage.getItem('name') || '';
  const user = sessionStorage.getItem('username') || '';
  $('#main-content').innerHTML = `
    <div class="section-head"><h2>Settings</h2><p>Manage your account.</p></div>
    <div class="card" style="max-width:480px">
      <div class="card-title">Account</div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px">
        <div class="sb-avatar" style="width:48px;height:48px;font-size:1.1rem">${name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:600;color:var(--text)">${name}</div>
          <div style="font-size:.82rem;color:var(--muted)">@${user} · Student</div>
        </div>
      </div>
      <button class="btn btn-outline" style="width:100%;border-color:var(--red-dim);color:var(--red)" id="settings-logout">
        ${IC.logout} Sign Out
      </button>
    </div>`;
  $('#settings-logout').onclick = () => { sessionStorage.clear(); SCORES = null; renderLogin(); };
}

/* ══════════════════════════════════════════════════════════
   LEARN — task list + panel
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   LEARN — PERSONAL GROWTH CHALLENGE SYSTEM (My Tasks)
   ══════════════════════════════════════════════════════════ */

let LS = {
  tasks:[], taskIdx:0, confidence:0,
  focusing:true, focusedFor:0, totalSecs:0,
  hintLevel:0, hintsData:[], retryCount:0,
  solved:false, submitting:false, tabSwitches:0,
  _iv:null, _visEl:null,
};

let selectedTaskCategory   = 'all';
let selectedTaskDifficulty = 'all';

const TASK_CATEGORIES = [
  { id: 'all',             label: 'All' },
  { id: 'Concentration',   label: '🧠 Concentration' },
  { id: 'Perseverance',    label: '💪 Perseverance' },
  { id: 'Discipline',      label: '🎯 Discipline' },
  { id: 'Empathy',         label: '🤝 Empathy' },
  { id: 'Learning',        label: '📚 Learning' },
  { id: 'Self Reflection', label: '🪞 Self Reflection' },
];

const TASK_DIFFICULTIES = [
  { id: 'all',       label: 'All' },
  { id: 'Easy',      label: 'Easy' },
  { id: 'Medium',    label: 'Medium' },
  { id: 'Hard',      label: 'Hard' },
  { id: 'Challenge', label: 'Challenge' },
];

function getCompletedTasks() {
  const username = sessionStorage.getItem('username') || 'student';
  try {
    const raw = localStorage.getItem(`shastra_completed_tasks_${username}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function getEarnedStars() {
  const username = sessionStorage.getItem('username') || 'student';
  try {
    const raw = localStorage.getItem(`shastra_earned_stars_${username}`);
    return raw ? Number(raw) || 0 : 0;
  } catch (_) {
    return 0;
  }
}

function saveCompletedTask(taskId, points) {
  const username = sessionStorage.getItem('username') || 'student';
  try {
    const completed = getCompletedTasks();
    if (!completed.includes(taskId)) {
      completed.push(taskId);
      localStorage.setItem(`shastra_completed_tasks_${username}`, JSON.stringify(completed));

      const currentStars = getEarnedStars();
      const newStars = currentStars + (points || 10);
      localStorage.setItem(`shastra_earned_stars_${username}`, String(newStars));
    }
  } catch (_) {}
}

function getCategoryIcon(cat) {
  if (cat === 'Concentration')   return '🧠';
  if (cat === 'Perseverance')    return '💪';
  if (cat === 'Discipline')      return '🎯';
  if (cat === 'Empathy')         return '🤝';
  if (cat === 'Learning')        return '📚';
  if (cat === 'Self Reflection') return '🪞';
  return '⭐';
}

function getDifficultyClass(diff) {
  if (diff === 'Easy')      return 'easy';
  if (diff === 'Medium')    return 'medium';
  if (diff === 'Hard')      return 'hard';
  if (diff === 'Challenge') return 'challenge';
  return 'medium';
}

function learnCleanup() {
  if (LS._iv)    { clearInterval(LS._iv); LS._iv = null; }
  if (LS._visEl) { document.removeEventListener('visibilitychange', LS._visEl); LS._visEl = null; }
}

function resetTaskState() {
  learnCleanup();
  LS.confidence = 0; LS.focusing = true;
  LS.focusedFor = 0; LS.totalSecs = 0;
  LS.hintLevel  = 0; LS.hintsData = [];
  LS.retryCount = 0; LS.solved    = false;
  LS.submitting = false; LS.tabSwitches = 0;
}

async function studentLearn() {
  learnCleanup();
  LS.tasks = [];

  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>My Tasks</h2>
      <p>Personal Growth Challenge System — small actions building stronger character.</p>
    </div>

    <!-- 🌟 Today's Challenge Highlight -->
    <div id="today-challenge-container"></div>

    <!-- 📊 Growth Progress Card -->
    <div class="task-progress-card" id="task-progress-card">
      <div class="tp-stats-left">
        <div class="tp-completed-text" id="tp-completed-text">Completed: 0 / 0</div>
        <div class="tp-prog-bar-wrap">
          <div class="tp-prog-bar-fill" id="tp-prog-fill" style="width:0%"></div>
        </div>
        <div id="tp-pct-text" style="font-size:.82rem;font-weight:700;color:var(--text)">0%</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="tp-tier-badge" id="tp-tier-badge">🌱 Novice Explorer</div>
        <div class="tp-stars-counter" id="tp-stars-counter">⭐ 0 stars earned</div>
      </div>
    </div>

    <!-- 🔍 Filter Controls (Category & Difficulty) -->
    <div class="tasks-filter-container">
      <div class="tf-row">
        <div class="tf-label">Category</div>
        <div class="tf-pills" id="cat-pills">
          ${TASK_CATEGORIES.map(c => `
            <button class="tf-pill ${selectedTaskCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="tf-row">
        <div class="tf-label">Difficulty</div>
        <div class="tf-pills" id="diff-pills">
          ${TASK_DIFFICULTIES.map(d => `
            <button class="tf-pill ${selectedTaskDifficulty === d.id ? 'active' : ''}" data-diff="${d.id}">${d.label}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Main Grid: Task list + Task panel -->
    <div class="learn-grid">
      <div class="task-list-panel" id="task-list">
        <div class="loading-state">Loading challenges…</div>
      </div>
      <div id="task-panel"></div>
    </div>
  `;

  // Bind filter button events
  $$('#cat-pills .tf-pill').forEach(btn => {
    btn.onclick = () => {
      $$('#cat-pills .tf-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTaskCategory = btn.dataset.cat;
      renderLearnList();
    };
  });

  $$('#diff-pills .tf-pill').forEach(btn => {
    btn.onclick = () => {
      $$('#diff-pills .tf-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTaskDifficulty = btn.dataset.diff;
      renderLearnList();
    };
  });

  try {
    const data = await apiFetch('/api/tasks');
    LS.tasks = data.tasks || [];
    if (!LS.tasks.length) {
      $('#task-list').innerHTML = `<div class="loading-state">No challenges available.</div>`;
      return;
    }
    LS.taskIdx = 0;
    renderTodayChallenge();
    updateProgressDisplay();
    renderLearnList();
    selectLearnTask(0);
  } catch (err) {
    $('#task-list').innerHTML = `<div class="error-state">⚠ ${err.message}<br><small>Make sure the server is running on port 5000.</small></div>`;
  }
}

function renderTodayChallenge() {
  if (!LS.tasks || !LS.tasks.length) return;
  const container = document.getElementById('today-challenge-container');
  if (!container) return;

  // Select a featured challenge from the pool
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const challengeIdx = dayOfYear % LS.tasks.length;
  const t = LS.tasks[challengeIdx] || LS.tasks[0];
  const completed = getCompletedTasks().includes(t.id);
  const catIcon = getCategoryIcon(t.category);
  const diffClass = getDifficultyClass(t.difficulty);

  container.innerHTML = `
    <div class="today-challenge-card">
      <div class="tc-badge-bar">
        <div class="tc-highlight-badge">
          <span>🌟</span> Today's Challenge
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:.78rem;font-weight:700;color:var(--text2)">${catIcon} ${t.category || t.subject || 'Growth'}</span>
          <span class="tl-badge ${diffClass}">[ ${t.difficulty || 'Medium'} ]</span>
        </div>
      </div>
      <div class="tc-title">${t.title}</div>
      <div class="tc-desc">${t.description || t.question}</div>
      <div class="tc-footer">
        <div class="tc-meta">
          <span>${IC.clock} ${t.estimatedTime || '~15 min'}</span>
          <span class="tc-meta-stars">⭐ ${t.points || 20} stars</span>
          ${completed ? '<span class="tl-completed-tag">✓ Completed</span>' : ''}
        </div>
        <button class="btn btn-amber btn-sm" id="tc-start-btn">
          ${completed ? 'Review Challenge' : 'Start Challenge'} ${IC.arrow}
        </button>
      </div>
    </div>
  `;

  if ($('#tc-start-btn')) {
    $('#tc-start-btn').onclick = () => {
      selectLearnTask(challengeIdx);
      const panel = document.getElementById('task-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth' });
    };
  }
}

function updateProgressDisplay() {
  const completed = getCompletedTasks();
  const total = LS.tasks.length;
  const compCount = completed.filter(id => LS.tasks.some(t => t.id === id)).length;
  const pct = total > 0 ? Math.round((compCount / total) * 100) : 0;
  const earnedStars = getEarnedStars();

  if ($('#tp-completed-text')) $('#tp-completed-text').textContent = `Completed: ${compCount} / ${total}`;
  if ($('#tp-prog-fill')) $('#tp-prog-fill').style.width = `${pct}%`;
  if ($('#tp-pct-text')) $('#tp-pct-text').textContent = `${pct}%`;
  if ($('#tp-stars-counter')) $('#tp-stars-counter').innerHTML = `⭐ ${earnedStars} stars earned`;

  let tier = '🌱 Novice Explorer';
  if (compCount >= 15) tier = '👑 Character Master';
  else if (compCount >= 8) tier = '🌟 Growth Achiever';
  else if (compCount >= 3) tier = '🌿 Diligent Practitioner';
  if ($('#tp-tier-badge')) $('#tp-tier-badge').textContent = tier;
}

function renderLearnList() {
  const completed = getCompletedTasks();

  // Filter tasks by active category and difficulty
  const filtered = LS.tasks.map((t, originalIdx) => ({ t, originalIdx })).filter(({ t }) => {
    const matchCat = selectedTaskCategory === 'all' || (t.category && t.category.toLowerCase() === selectedTaskCategory.toLowerCase());
    const matchDiff = selectedTaskDifficulty === 'all' || (t.difficulty && t.difficulty.toLowerCase() === selectedTaskDifficulty.toLowerCase());
    return matchCat && matchDiff;
  });

  const listEl = $('#task-list');
  if (!listEl) return;

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="tl-empty-state">
        <p>No tasks found matching your filter criteria.</p>
        <button class="btn btn-ghost btn-sm" id="reset-filter-btn">View All Tasks</button>
      </div>
    `;
    if ($('#reset-filter-btn')) {
      $('#reset-filter-btn').onclick = () => {
        selectedTaskCategory = 'all';
        selectedTaskDifficulty = 'all';
        $$('#cat-pills .tf-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
        $$('#diff-pills .tf-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        renderLearnList();
      };
    }
    return;
  }

  listEl.innerHTML = filtered.map(({ t, originalIdx }) => {
    const isCompleted = completed.includes(t.id);
    const catIcon = getCategoryIcon(t.category);
    const diffClass = getDifficultyClass(t.difficulty);
    const isActive = originalIdx === LS.taskIdx;

    return `
      <button class="tl-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-i="${originalIdx}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
          <span style="font-size:.72rem;color:var(--muted);font-weight:600">${catIcon} ${t.category || t.subject || 'Learning'}</span>
          <span class="tl-badge ${diffClass}">[ ${t.difficulty || 'Medium'} ]</span>
        </div>
        <div class="tl-item-title">${t.title}</div>
        <div class="tl-meta-row">
          <span>${IC.clock} ${t.estimatedTime || '~10 min'}</span>
          <span>⭐ ${t.points || 10}</span>
          ${isCompleted ? '<span class="tl-completed-tag">✓ Completed</span>' : ''}
        </div>
      </button>
    `;
  }).join('');

  $$('.tl-item').forEach(b => b.onclick = () => selectLearnTask(+b.dataset.i));
}

function selectLearnTask(idx) {
  resetTaskState();
  LS.taskIdx = idx;
  $$('.tl-item').forEach(b => b.classList.toggle('active', +b.dataset.i === idx));
  renderLearnPanel();
}

function renderLearnPanel() {
  const t = LS.tasks[LS.taskIdx];
  if (!t) return;
  const tot = LS.tasks.length;
  const completed = getCompletedTasks().includes(t.id);
  const catIcon = getCategoryIcon(t.category);
  const diffClass = getDifficultyClass(t.difficulty);
  const isQuestionType = Boolean(t.formula || t.answer);

  $('#task-panel').innerHTML = `
    <button class="learn-back" id="learn-back-btn">${IC.back} Back to Tasks</button>

    <div class="learn-topbar">
      <span class="learn-q-label">Challenge ${LS.taskIdx + 1} of ${tot}</span>
      <div class="learn-prog-track">
        <div class="learn-prog-fill" style="width:${((LS.taskIdx + 1)/tot)*100}%"></div>
      </div>
      <span class="learn-timer">${IC.clock} <span id="timer-disp">${fmt(LS.totalSecs)}</span></span>
    </div>

    <!-- Task Header Card -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:18px 22px;margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:.82rem;font-weight:700;color:var(--amber-l)">${catIcon} ${t.category || t.subject || 'Learning'}</span>
          <span class="tl-badge ${diffClass}">[ ${t.difficulty || 'Medium'} ]</span>
        </div>
        <div style="display:flex;align-items:center;gap:14px;font-size:.84rem;font-weight:600">
          <span>${IC.clock} ${t.estimatedTime || '~15 min'}</span>
          <span style="color:var(--amber-l)">⭐ ${t.points || 20}</span>
          ${completed ? '<span class="tl-completed-tag">✓ Completed</span>' : ''}
        </div>
      </div>
      <h3 style="font-family:var(--font-head);font-size:1.35rem;color:var(--text);margin-bottom:4px">${t.title}</h3>
      <p style="font-size:.88rem;color:var(--text2);line-height:1.6">${t.description || ''}</p>
    </div>

    <div class="focus-band">
      <div class="focus-dot${LS.focusing ? '' : ' off'}" id="focus-dot"></div>
      <span id="focus-status">${LS.focusing ? 'Focus tracking active' : 'Paused'}</span>
      <span style="margin-left:auto;font-size:.76rem;color:var(--dim);font-family:var(--font-mono)">Focus: <b style="color:var(--amber-l)"><span id="focus-secs">${LS.focusedFor}</span>s</b></span>
    </div>

    <!-- Existing Confidence Stars (Preserved!) -->
    <div class="conf-section">
      <div class="conf-label">Before you start</div>
      <div class="conf-sub">How confident are you about completing this challenge? (1–5 stars)</div>
      <div class="stars">
        ${[1,2,3,4,5].map(n => `<button class="star${n <= LS.confidence ? ' on':''}" data-n="${n}">★</button>`).join('')}
      </div>
    </div>

    <div class="task-body">
      <div class="q-box">
        <div class="q-box-label">${isQuestionType ? 'Question' : 'Challenge Instructions'}</div>
        <div class="q-text">${t.question}</div>
        ${t.formula ? `<div class="q-formula">${t.formula}</div>` : ''}
      </div>
      <div class="hint-box">
        <div class="hint-box-label">Guidance &amp; Hints</div>
        <div class="hint-btn-inner">
          <button class="hint-action amber" id="hint-btn">💡 Show Hint ${isQuestionType ? '(−5 points)' : ''}</button>
          <button class="hint-action" id="skip-btn">⏭ Skip Challenge</button>
        </div>
        <div id="hints-list"></div>
      </div>
    </div>

    <div class="ans-section">
      <div class="ans-label">${isQuestionType ? 'Your Answer' : 'Your Completion Notes / Reflections'}</div>
      ${isQuestionType
        ? `<input class="ans-input" id="ans-in" placeholder="Enter your answer here…">`
        : `<textarea class="ans-input" id="ans-in" rows="3" style="resize:vertical" placeholder="Write what you accomplished, observed, or learned during this challenge…"></textarea>`}
    </div>

    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-amber" id="sub-btn" ${completed ? 'disabled' : ''}>
        ${completed ? '✓ Challenge Completed' : `Complete Challenge (+${t.points || 10} ⭐)`}
      </button>
      ${LS.taskIdx < LS.tasks.length - 1 ? `<button class="btn btn-ghost" id="next-task-btn">Next Task</button>` : ''}
    </div>

    <div id="fb">
      ${completed ? `<div class="feedback-box feedback-ok">✓ You completed this challenge and earned ⭐ ${t.points || 10} stars. Great character development!</div>` : ''}
    </div>
    <div class="live-track">Tracking → Focus: <b>Concentration</b> · Independent Effort: <b>Self-Reliance</b> · Retries: <b>Perseverance</b> · Star vs result: <b>Confidence</b></div>
  `;

  /* back button */
  $('#learn-back-btn').onclick = () => renderStudent('learn');

  /* confidence stars */
  $$('.star').forEach(s => s.onclick = () => {
    LS.confidence = +s.dataset.n;
    $$('.star').forEach(x => x.classList.toggle('on', +x.dataset.n <= LS.confidence));
    if (!completed) $('#fb').innerHTML = '';
  });

  /* hint button */
  $('#hint-btn').onclick = async () => {
    const btn = $('#hint-btn');
    btn.disabled = true;
    if (!LS.hintsData.length) {
      try {
        const data = await apiFetch(`/api/tasks/${t.id}/hints`);
        LS.hintsData = data.hints || [];
      } catch {
        LS.hintsData = ['Approach the challenge with patience and focus. Break it down step by step.'];
      }
    }
    if (LS.hintLevel < LS.hintsData.length) LS.hintLevel++;
    $('#hints-list').innerHTML = LS.hintsData.slice(0, LS.hintLevel)
      .map((h, i) => `<div class="hint-item">💡 Hint ${i+1}: ${h}</div>`).join('');
    if (LS.hintLevel < LS.hintsData.length) btn.disabled = false;
    else btn.textContent = '💡 All guidance shown';
  };

  /* skip button */
  if ($('#skip-btn')) $('#skip-btn').onclick = () => {
    if (LS.taskIdx < LS.tasks.length - 1) selectLearnTask(LS.taskIdx + 1);
    else renderStudent('learn');
  };

  /* next task button */
  if ($('#next-task-btn')) $('#next-task-btn').onclick = () => selectLearnTask(LS.taskIdx + 1);

  /* submit */
  $('#sub-btn').onclick = async () => {
    if (LS.submitting || LS.solved || completed) return;

    if (LS.confidence === 0) {
      $('#fb').innerHTML = `<div class="feedback-box feedback-no">★ Please rate your confidence (1–5 stars) before submitting.</div>`;
      return;
    }
    if (!$('#ans-in').value.trim()) {
      $('#fb').innerHTML = `<div class="feedback-box feedback-no">✏ Please write your answer or reflection before submitting.</div>`;
      return;
    }

    LS.submitting = true;
    const btn = $('#sub-btn');
    btn.disabled = true; btn.textContent = 'Verifying…';

    try {
      const result = await apiFetch(`/api/tasks/${t.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: sessionStorage.getItem('username'),
          answer: $('#ans-in').value.trim(),
          hintsUsed: LS.hintLevel,
          selfRating: LS.confidence,
          focusSeconds: LS.focusedFor,
          totalSeconds: LS.totalSecs,
          tabSwitches: LS.tabSwitches,
          correctStreak: 0,
        }),
      });

      if (result.correct) {
        LS.solved = true;
        learnCleanup();
        saveCompletedTask(t.id, t.points || 10);
        updateProgressDisplay();
        renderTodayChallenge();
        renderLearnList();

        const focusPct = LS.totalSecs > 0 ? Math.round((LS.focusedFor / LS.totalSecs) * 100) : 0;
        $('#fb').innerHTML = `
          <div style="text-align:center;padding:28px 16px">
            <div class="result-icon correct" style="margin:0 auto 12px">✅</div>
            <div class="result-title correct">Challenge Completed!</div>
            <div class="result-sub" style="color:var(--amber-l);font-weight:700">⭐ +${t.points || 10} Stars Earned!</div>
            <div class="result-sub">Completed in ${fmt(LS.totalSecs)}. Your character and effort have been logged.</div>
            <div class="result-stats">
              <div class="rs"><div class="rv">${focusPct}%</div><div class="rl">Focus Time</div></div>
              <div class="rs"><div class="rv">${LS.confidence} ★</div><div class="rl">Confidence</div></div>
              <div class="rs"><div class="rv">${LS.hintLevel}</div><div class="rl">Hints Used</div></div>
            </div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              ${LS.taskIdx < LS.tasks.length - 1
                ? `<button class="btn btn-amber" id="next-q-btn">Next Challenge ${IC.arrow}</button>` : ''}
              <button class="btn btn-ghost" id="back-tasks-btn">Back to All Tasks</button>
            </div>
          </div>`;

        await saveLearnSession(t.id, 'solved');
        if ($('#next-q-btn')) $('#next-q-btn').onclick = () => selectLearnTask(LS.taskIdx + 1);
        if ($('#back-tasks-btn')) $('#back-tasks-btn').onclick = () => renderStudent('learn');
      } else {
        LS.retryCount++;
        $('#fb').innerHTML = `<div class="feedback-box feedback-no">❌ Not quite — try again. A retry that succeeds counts toward <strong>Perseverance</strong>.</div>`;
        btn.textContent = `Complete Challenge (+${t.points || 10} ⭐)`;
        btn.disabled = false;
        LS.submitting = false;
      }
    } catch (err) {
      $('#fb').innerHTML = `<div class="feedback-box feedback-no">⚠ ${err.message}</div>`;
      btn.textContent = `Complete Challenge (+${t.points || 10} ⭐)`;
      btn.disabled = false;
      LS.submitting = false;
    }
  };

  /* focus timer */
  LS._iv = setInterval(() => {
    const disp = document.getElementById('timer-disp');
    const secs = document.getElementById('focus-secs');
    if (!disp) { clearInterval(LS._iv); LS._iv = null; return; }
    LS.totalSecs++;
    if (LS.focusing) { LS.focusedFor++; if (secs) secs.textContent = LS.focusedFor; }
    disp.textContent = fmt(LS.totalSecs);
  }, 1000);

  /* tab visibility */
  LS._visEl = () => {
    if (document.hidden) { LS.focusing = false; LS.tabSwitches++; }
    else { LS.focusing = true; }
    const dot = document.getElementById('focus-dot');
    const st  = document.getElementById('focus-status');
    if (dot) dot.classList.toggle('off', !LS.focusing);
    if (st)  st.textContent = LS.focusing ? 'Focus tracking active' : 'Paused — tab switched';
  };
  document.addEventListener('visibilitychange', LS._visEl);
}

async function saveLearnSession(taskId, outcome) {
  const username = sessionStorage.getItem('username');
  try {
    await apiFetch(`/api/students/${username}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        taskId, focusSeconds:LS.focusedFor, totalSeconds:LS.totalSecs,
        tabSwitches:LS.tabSwitches, correctStreak:0,
        hintsUsed:LS.hintLevel, selfRating:LS.confidence,
        outcome, attempts:LS.retryCount+1,
      }),
    });
  } catch (_) { /* session save failed silently */ }
}

/* ══════════════════════════════════════════════════════════
   INTERACTIVE ASSESSMENT ACTIVITIES
   Activity 1: Focus Grid (Concentration)
   Activity 2: Keep Going (Perseverance)
   ══════════════════════════════════════════════════════════ */

function getActivityScores() {
  const username = sessionStorage.getItem('username') || 'student';
  try {
    const raw = localStorage.getItem(`shastra_activities_${username}`);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

async function saveActivityScore(activityId, data) {
  const username = sessionStorage.getItem('username') || 'student';
  try {
    const current = getActivityScores();
    current[activityId] = {
      ...data,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
    };
    localStorage.setItem(`shastra_activities_${username}`, JSON.stringify(current));
  } catch (_) {}

  /* Also record into student session history if backend is active */
  try {
    await apiFetch(`/api/students/${username}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        taskId: `activity-${activityId}`,
        focusSeconds: Math.max(1, data.durationSeconds || 60),
        totalSeconds: Math.max(1, data.durationSeconds || 60),
        tabSwitches: 0,
        correctStreak: data.streak || 0,
        hintsUsed: data.hintsUsed || 0,
        selfRating: Math.min(5, Math.max(1, Math.round(data.score / 20))),
        outcome: data.score >= 50 ? 'solved' : 'failed',
        attempts: data.attempts || 1,
      }),
    });
  } catch (_) { /* fallback silent */ }
}

function getScoreCategory(score) {
  if (score >= 80) return { label: 'Strong', cssClass: 'strong' };
  if (score >= 60) return { label: 'Developing', cssClass: 'developing' };
  if (score >= 40) return { label: 'Needs Practice', cssClass: 'needs-practice' };
  return { label: 'Early Stage', cssClass: 'early-stage' };
}

/* ── Activity Selection Hub ── */
function studentActivities() {
  const scores = getActivityScores();
  const fg = scores['focus-grid'];
  const kg = scores['keep-going'];

  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>Character &amp; Cognitive Activities</h2>
      <p>Interactive assessment activities grounded in Swami Vivekananda's ideals of concentration, character, and mental fortitude.</p>
    </div>

    <div class="activities-grid">
      <!-- Activity 1: Focus Grid -->
      <div class="act-card" id="card-focus-grid">
        <div class="act-badge-row">
          <span class="act-category-badge focus">Mind &amp; Focus</span>
          ${fg ? `<span class="act-prev-score">Latest: <strong>${fg.score}/100</strong> · ${fg.category}</span>` : `<span class="act-prev-score">Not Attempted</span>`}
        </div>
        <div class="act-title">Focus Grid</div>
        <div class="act-desc">
          Remember the pattern. Recreate it before it disappears. Measures your visual working memory span, attentional control, and recall precision under progressive grid density.
        </div>
        <div class="act-meta-list">
          <div class="act-meta-item">
            <span class="label">What it Measures</span>
            <span class="value" style="color:var(--amber-l)">Concentration</span>
          </div>
          <div class="act-meta-item">
            <span class="label">Estimated Duration</span>
            <span class="value">${IC.clock} 2–4 minutes</span>
          </div>
          <div class="act-meta-item">
            <span class="label">Difficulty Range</span>
            <span class="value">Level 1 (3×3) to Level 7 (5×5)</span>
          </div>
        </div>
        <button class="btn btn-amber" id="hub-start-fg-btn" style="width:100%;margin-top:auto">
          ${fg ? 'Retake Focus Grid' : 'Start Assessment'} ${IC.arrow}
        </button>
      </div>

      <!-- Activity 2: Keep Going -->
      <div class="act-card" id="card-keep-going">
        <div class="act-badge-row">
          <span class="act-category-badge perseverance">Character &amp; Growth</span>
          ${kg ? `<span class="act-prev-score">Latest: <strong>${kg.score}/100</strong> · ${kg.category}</span>` : `<span class="act-prev-score">Not Attempted</span>`}
        </div>
        <div class="act-title">Keep Going</div>
        <div class="act-desc">
          Face increasingly difficult challenges and see how you respond to setbacks. Measures perseverance, constructive resilience, and recovery after unsuccessful attempts.
        </div>
        <div class="act-meta-list">
          <div class="act-meta-item">
            <span class="label">What it Measures</span>
            <span class="value" style="color:#A78BFA">Perseverance</span>
          </div>
          <div class="act-meta-item">
            <span class="label">Estimated Duration</span>
            <span class="value">${IC.clock} 3–5 minutes</span>
          </div>
          <div class="act-meta-item">
            <span class="label">Challenge Sequence</span>
            <span class="value">5 Progressive Rule-Deduction Puzzles</span>
          </div>
        </div>
        <button class="btn btn-amber" id="hub-start-kg-btn" style="width:100%;margin-top:auto;background:linear-gradient(135deg,#7C3AED,#6D28D9);box-shadow:0 4px 16px rgba(124,58,237,.35)">
          ${kg ? 'Retake Keep Going' : 'Start Assessment'} ${IC.arrow}
        </button>
      </div>
    </div>
  `;

  $('#hub-start-fg-btn').onclick = () => startFocusGrid();
  $('#hub-start-kg-btn').onclick = () => startKeepGoing();
}

/* ── Activity 1: Focus Grid (Concentration) ── */
const FG_LEVELS = [
  { level: 1, size: 3, targets: 3, previewMs: 2500, label: 'Level 1: 3×3 Grid · 3 Tiles' },
  { level: 2, size: 3, targets: 4, previewMs: 2200, label: 'Level 2: 3×3 Grid · 4 Tiles' },
  { level: 3, size: 4, targets: 4, previewMs: 2000, label: 'Level 3: 4×4 Grid · 4 Tiles' },
  { level: 4, size: 4, targets: 5, previewMs: 1800, label: 'Level 4: 4×4 Grid · 5 Tiles' },
  { level: 5, size: 4, targets: 6, previewMs: 1600, label: 'Level 5: 4×4 Grid · 6 Tiles' },
  { level: 6, size: 5, targets: 7, previewMs: 1500, label: 'Level 6: 5×5 Grid · 7 Tiles' },
  { level: 7, size: 5, targets: 8, previewMs: 1300, label: 'Level 7: 5×5 Grid · 8 Tiles' },
];

function startFocusGrid() {
  let curLvlIdx = 0;
  let strikesLeft = 3;
  let correctClicks = 0;
  let wrongClicks = 0;
  let targetSet = new Set();
  let correctSet = new Set();
  let wrongSet = new Set();
  let reactionTimes = [];
  let recallStart = 0;
  let sessionStart = Date.now();
  let highestLevelReached = 1;
  let activeTimers = [];

  function clearTimers() {
    activeTimers.forEach(t => clearTimeout(t));
    activeTimers = [];
  }

  function renderIntro() {
    clearTimers();
    $('#main-content').innerHTML = `
      <div class="activity-stage">
        <div class="act-top-bar">
          <div class="act-top-title">
            <span style="color:var(--amber-l)">⚡</span> Focus Grid
          </div>
          <button class="btn btn-ghost btn-sm" id="fg-exit-btn">${IC.back} Activities</button>
        </div>

        <div style="text-align:center;padding:24px 10px">
          <div style="font-size:3rem;margin-bottom:12px">🎯</div>
          <h2 style="font-family:var(--font-head);font-size:1.8rem;margin-bottom:10px;color:var(--text)">Test Your Visual Concentration</h2>
          <p style="color:var(--muted);max-width:480px;margin:0 auto 24px;line-height:1.6">
            A pattern of illuminated tiles will appear briefly. When the pattern disappears, select the exact tiles in their correct positions.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:540px;margin:0 auto 30px;text-align:left">
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:var(--muted);text-transform:uppercase;font-weight:700">1. Memorize</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">Tiles light up amber. Hold their positions in working memory.</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:var(--muted);text-transform:uppercase;font-weight:700">2. Recreate</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">Tap the exact tiles before making 3 total mistakes.</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:var(--muted);text-transform:uppercase;font-weight:700">3. Progress</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">Grid scales from 3×3 up to 5×5 with faster preview speeds.</div>
            </div>
          </div>

          <button class="btn btn-amber btn-lg" id="fg-begin-btn" style="min-width:200px">
            Start Challenge ${IC.arrow}
          </button>
        </div>
      </div>
    `;

    $('#fg-exit-btn').onclick = () => { clearTimers(); studentActivities(); };
    $('#fg-begin-btn').onclick = () => runCountdown();
  }

  function runCountdown() {
    clearTimers();
    const cfg = FG_LEVELS[curLvlIdx];
    highestLevelReached = Math.max(highestLevelReached, curLvlIdx + 1);

    $('#main-content').innerHTML = `
      <div class="activity-stage">
        <div class="act-top-bar">
          <div class="act-top-title"><span style="color:var(--amber-l)">⚡</span> Focus Grid</div>
          <div class="act-top-stats">
            <span class="act-stat-pill" style="color:var(--amber-l)">Level ${curLvlIdx + 1} of ${FG_LEVELS.length}</span>
            <div class="fg-strikes" title="${strikesLeft} strikes left">
              ${[1,2,3].map(i => `<div class="fg-strike-dot ${i > strikesLeft ? 'spent' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="act-prog-track">
          <div class="act-prog-fill" style="width:${((curLvlIdx) / FG_LEVELS.length) * 100}%;background:linear-gradient(90deg,var(--amber),var(--amber-l))"></div>
        </div>

        <div style="text-align:center;padding:60px 10px" id="fg-countdown-box">
          <div style="font-size:.9rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:8px">Get Ready for Level ${curLvlIdx + 1}</div>
          <div style="font-family:var(--font-head);font-size:3.8rem;color:var(--amber-l);line-height:1" id="fg-countdown-num">3</div>
          <div style="font-size:.85rem;color:var(--text2);margin-top:12px">${cfg.label}</div>
        </div>
      </div>
    `;

    let count = 3;
    const interval = setInterval(() => {
      count--;
      const el = document.getElementById('fg-countdown-num');
      if (!el) { clearInterval(interval); return; }
      if (count > 0) {
        el.textContent = count;
      } else {
        clearInterval(interval);
        startMemorizePhase();
      }
    }, 800);
  }

  function startMemorizePhase() {
    clearTimers();
    const cfg = FG_LEVELS[curLvlIdx];
    const totalTiles = cfg.size * cfg.size;

    /* Generate random target tiles */
    targetSet = new Set();
    while (targetSet.size < cfg.targets) {
      targetSet.add(Math.floor(Math.random() * totalTiles));
    }
    correctSet = new Set();
    wrongSet = new Set();

    $('#main-content').innerHTML = `
      <div class="activity-stage">
        <div class="act-top-bar">
          <div class="act-top-title"><span style="color:var(--amber-l)">⚡</span> Focus Grid</div>
          <div class="act-top-stats">
            <span class="act-stat-pill" style="color:var(--amber-l)">Level ${curLvlIdx + 1} / ${FG_LEVELS.length}</span>
            <div class="fg-strikes" title="${strikesLeft} strikes left">
              ${[1,2,3].map(i => `<div class="fg-strike-dot ${i > strikesLeft ? 'spent' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="act-prog-track">
          <div class="act-prog-fill" id="fg-timer-bar" style="width:100%;background:linear-gradient(90deg,var(--amber),var(--amber-l));transition:width ${cfg.previewMs}ms linear"></div>
        </div>

        <div class="fg-phase-banner memorize" id="fg-phase-banner">
          👁 Memorize the illuminated tiles (${(cfg.previewMs / 1000).toFixed(1)}s)...
        </div>

        <div class="focus-grid-wrap">
          <div class="focus-grid" id="fg-grid" style="grid-template-columns:repeat(${cfg.size}, 1fr)">
            ${Array.from({ length: totalTiles }, (_, i) => `
              <div class="fg-tile ${targetSet.has(i) ? 'preview-active locked' : 'locked'}" data-index="${i}"></div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    /* trigger bar shrink transition */
    requestAnimationFrame(() => {
      const bar = document.getElementById('fg-timer-bar');
      if (bar) bar.style.width = '0%';
    });

    const timer = setTimeout(() => {
      startRecallPhase();
    }, cfg.previewMs);
    activeTimers.push(timer);
  }

  function startRecallPhase() {
    clearTimers();
    const cfg = FG_LEVELS[curLvlIdx];
    recallStart = Date.now();

    const banner = document.getElementById('fg-phase-banner');
    if (banner) {
      banner.className = 'fg-phase-banner recall';
      banner.textContent = `🎯 Recall Phase: Tap the ${cfg.targets} target tiles! (0 / ${cfg.targets} found)`;
    }

    const grid = document.getElementById('fg-grid');
    if (!grid) return;

    /* Reset preview highlight and remove locked */
    $$('.fg-tile').forEach(tile => {
      tile.className = 'fg-tile';
      const idx = Number(tile.dataset.index);

      tile.onclick = () => {
        if (correctSet.has(idx) || wrongSet.has(idx)) return;
        const now = Date.now();
        reactionTimes.push(now - recallStart);

        if (targetSet.has(idx)) {
          /* Correct click */
          correctSet.add(idx);
          correctClicks++;
          tile.className = 'fg-tile selected-correct locked';

          if (banner) {
            banner.textContent = `🎯 Recall Phase: Tap the ${cfg.targets} target tiles! (${correctSet.size} / ${cfg.targets} found)`;
          }

          if (correctSet.size === targetSet.size) {
            /* Level Cleared! */
            $$('.fg-tile').forEach(t => t.classList.add('locked'));
            if (banner) {
              banner.className = 'fg-phase-banner success';
              banner.textContent = `🎉 Brilliant Recall! Level ${curLvlIdx + 1} Cleared!`;
            }

            const t = setTimeout(() => {
              if (curLvlIdx + 1 < FG_LEVELS.length) {
                curLvlIdx++;
                runCountdown();
              } else {
                finishFocusGrid(true);
              }
            }, 1200);
            activeTimers.push(t);
          }
        } else {
          /* Wrong click */
          wrongSet.add(idx);
          wrongClicks++;
          strikesLeft--;
          tile.className = 'fg-tile selected-wrong locked';

          /* Update strike dots */
          const dots = $$('.fg-strike-dot');
          dots.forEach((dot, dIdx) => {
            if (dIdx >= strikesLeft) dot.classList.add('spent');
          });

          if (strikesLeft <= 0) {
            /* Out of strikes! Reveal missed targets */
            $$('.fg-tile').forEach(t => {
              t.classList.add('locked');
              const tIdx = Number(t.dataset.index);
              if (targetSet.has(tIdx) && !correctSet.has(tIdx)) {
                t.classList.add('preview-active');
              }
            });
            if (banner) {
              banner.className = 'fg-phase-banner error';
              banner.textContent = `⚠ 3 Strikes Reached! Finalizing your concentration score...`;
            }
            const t = setTimeout(() => {
              finishFocusGrid(false);
            }, 1600);
            activeTimers.push(t);
          } else {
            if (banner) {
              banner.className = 'fg-phase-banner error';
              banner.textContent = `❌ Mistake! ${strikesLeft} ${strikesLeft === 1 ? 'strike' : 'strikes'} remaining. Keep focusing!`;
            }
          }
        }
      };
    });
  }

  function finishFocusGrid(completedAll) {
    clearTimers();
    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStart) / 1000));
    const totalClicks = correctClicks + wrongClicks;
    const accuracy = totalClicks > 0 ? Math.round((correctClicks / totalClicks) * 100) : 0;
    const avgResponseTimeSec = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
      : '2.00';

    /* Transparent Concentration Score formula */
    const levelScore = Math.round((highestLevelReached / FG_LEVELS.length) * 40);
    const accuracyScore = Math.round((accuracy / 100) * 40);
    const avgSec = Number(avgResponseTimeSec);
    const speedScore = avgSec <= 1.2 ? 20 : avgSec <= 1.8 ? 16 : avgSec <= 2.5 ? 12 : 8;

    const totalScore = Math.min(100, Math.max(0, levelScore + accuracyScore + speedScore));
    const cat = getScoreCategory(totalScore);

    const resultData = {
      score: totalScore,
      category: cat.label,
      levelReached: highestLevelReached,
      accuracy,
      correctClicks,
      wrongClicks,
      avgResponseTimeSec,
      durationSeconds,
    };

    saveActivityScore('focus-grid', resultData);

    renderActivityResultScreen({
      activityId: 'focus-grid',
      activityTitle: 'Focus Grid',
      measureName: 'Concentration Score',
      score: totalScore,
      category: cat.label,
      cssClass: cat.cssClass,
      summaryText: `Your score reflects visual-spatial pattern retention, precision under expanding grid density, and rapid recall without attentional drift.`,
      metrics: [
        { label: 'Highest Level', value: `Level ${highestLevelReached} of 7` },
        { label: 'Recall Accuracy', value: `${accuracy}%` },
        { label: 'Correct Tiles', value: correctClicks },
        { label: 'Errors / Distractions', value: wrongClicks },
        { label: 'Avg Reaction Speed', value: `${avgResponseTimeSec}s` },
        { label: 'Total Duration', value: `${fmt(durationSeconds)}` },
      ],
      onTryAgain: () => startFocusGrid(),
    });
  }

  renderIntro();
}

/* ── Activity 2: Keep Going (Perseverance) ── */
const KG_CHALLENGES = [
  {
    level: 1,
    theme: 'Foundational Sequence Delta',
    prompt: 'Observe the progressive growth pattern and deduce the next logical term:',
    sequence: '4  ➔  7  ➔  13  ➔  25  ➔  [ ? ]',
    options: [
      { key: 'A', text: '37' },
      { key: 'B', text: '49' },
      { key: 'C', text: '50' },
      { key: 'D', text: '52' },
    ],
    correctKey: 'B',
    retryHint: 'Look closely at the increments between terms: +3, +6, +12. Notice how each step doubles the previous difference.',
  },
  {
    level: 2,
    theme: 'Dual-Stream Logic',
    prompt: 'Track both the alphabetical jumps and the numerical multiplier to determine the next pair:',
    sequence: '[A, 3]  ➔  [C, 6]  ➔  [F, 12]  ➔  [J, 24]  ➔  [ ? ]',
    options: [
      { key: 'A', text: '[M, 48]' },
      { key: 'B', text: '[N, 36]' },
      { key: 'C', text: '[O, 48]' },
      { key: 'D', text: '[P, 48]' },
    ],
    correctKey: 'C',
    retryHint: 'Separate the two streams. Letters advance by increasing gaps (+2: A→C, +3: C→F, +4: F→J, +5: J→O), while numbers consistently double (3, 6, 12, 24, 48).',
  },
  {
    level: 3,
    theme: 'Geometric Vertex Parity',
    prompt: 'Each shape bears an energetic value equal to its vertex count. Which element balances the second triad to 22?',
    sequence: '▲ (3) + ■ (4) + ✦ (10) = 17\n⬟ (5) + ⬡ (6) + [ ? ] = 22',
    options: [
      { key: 'A', text: 'Octagon ⯃ (8 vertices)' },
      { key: 'B', text: 'Nonagon ⯄ (9 vertices)' },
      { key: 'C', text: '11-Pointed Star ✴ (11 vertices)' },
      { key: 'D', text: 'Dodecagon ⬢ (12 vertices)' },
    ],
    correctKey: 'C',
    retryHint: 'Sum the known shapes in row 2: 5 + 6 = 11. To satisfy the equilibrium 11 + [ ? ] = 22, the remaining figure requires exactly 11 vertices.',
  },
  {
    level: 4,
    theme: 'Modular Resonance Function',
    prompt: 'A cognitive filter evaluates two inputs via: Output = (Node_A × Node_B) mod 9 + 1. Calculate the output for Node_A = 7 and Node_B = 8:',
    sequence: 'F(7, 8) = (7 × 8) mod 9 + 1 = [ ? ]',
    options: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '5' },
      { key: 'D', text: '7' },
    ],
    correctKey: 'B',
    retryHint: 'Multiply first: 7 × 8 = 56. When 56 is divided by 9, the quotient is 6 (54) with a remainder of 2. Then add 1: 2 + 1 = 3.',
  },
  {
    level: 5,
    theme: 'The Shraddha Equilibrium',
    prompt: 'Three harmonic rows fulfill: Row 1 = 24, Row 2 = 36, Row 3 = 48. Row 3 is formed by [X, 2X, X + 8]. Find the core value of X:',
    sequence: 'X + 2X + (X + 8) = 48  ➔  What is X?',
    options: [
      { key: 'A', text: 'X = 8' },
      { key: 'B', text: 'X = 10' },
      { key: 'C', text: 'X = 12' },
      { key: 'D', text: 'X = 14' },
    ],
    correctKey: 'B',
    retryHint: 'Combine algebraic terms: X + 2X + X = 4X. Then solve 4X + 8 = 48 ➔ 4X = 40 ➔ X = 10.',
  },
];

function startKeepGoing() {
  let currentLevel = 0;
  let attemptsThisLevel = 0;
  let hadFailureThisLevel = false;
  let selectedOption = null;
  let challengesAttempted = 0;
  let challengesCompleted = 0;
  let totalFailures = 0;
  let retriesAfterFailure = 0;
  let recoveries = 0;
  let sessionStart = Date.now();
  let highestLevelReached = 1;

  function renderIntro() {
    $('#main-content').innerHTML = `
      <div class="activity-stage">
        <div class="act-top-bar">
          <div class="act-top-title">
            <span style="color:#A78BFA">🏔</span> Keep Going
          </div>
          <button class="btn btn-ghost btn-sm" id="kg-exit-btn">${IC.back} Activities</button>
        </div>

        <div style="text-align:center;padding:24px 10px">
          <div style="font-size:3rem;margin-bottom:12px">🧗</div>
          <h2 style="font-family:var(--font-head);font-size:1.8rem;margin-bottom:10px;color:var(--text)">Test Your Perseverance</h2>
          <p style="color:var(--muted);max-width:480px;margin:0 auto 24px;line-height:1.6">
            Face increasingly difficult analytical challenges. When an attempt doesn't work, will you analyze the setback, adapt your thinking, and persist?
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:540px;margin:0 auto 30px;text-align:left">
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:#A78BFA;text-transform:uppercase;font-weight:700">1. Deduce</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">Carefully examine the progressive cipher logic on each card.</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:#A78BFA;text-transform:uppercase;font-weight:700">2. Face Setbacks</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">If an attempt fails, you are given helpful cues to rethink and retry.</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
              <div style="font-size:.78rem;color:#A78BFA;text-transform:uppercase;font-weight:700">3. Grow Resilience</div>
              <div style="font-size:.85rem;color:var(--text2);margin-top:4px">Your score rewards persistence, recovery after mistakes, and completion.</div>
            </div>
          </div>

          <button class="btn btn-amber btn-lg" id="kg-begin-btn" style="min-width:200px;background:linear-gradient(135deg,#7C3AED,#6D28D9);box-shadow:0 4px 16px rgba(124,58,237,.35)">
            Start Challenge ${IC.arrow}
          </button>
        </div>
      </div>
    `;

    $('#kg-exit-btn').onclick = () => studentActivities();
    $('#kg-begin-btn').onclick = () => renderChallenge();
  }

  function renderChallenge(bannerNotice = '') {
    const ch = KG_CHALLENGES[currentLevel];
    highestLevelReached = Math.max(highestLevelReached, currentLevel + 1);
    challengesAttempted = Math.max(challengesAttempted, currentLevel + 1);
    selectedOption = null;

    $('#main-content').innerHTML = `
      <div class="activity-stage">
        <div class="act-top-bar">
          <div class="act-top-title">
            <span style="color:#A78BFA">🏔</span> Keep Going
          </div>
          <div class="act-top-stats">
            <span class="act-stat-pill" style="color:#A78BFA">Level ${currentLevel + 1} of ${KG_CHALLENGES.length}</span>
            <span class="act-stat-pill" id="kg-attempts-pill">Attempt ${attemptsThisLevel + 1}</span>
          </div>
        </div>

        <div class="act-prog-track">
          <div class="act-prog-fill" style="width:${(currentLevel / KG_CHALLENGES.length) * 100}%;background:linear-gradient(90deg,#7C3AED,#A78BFA)"></div>
        </div>

        ${bannerNotice ? `
          <div style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:var(--r-md);padding:10px 16px;font-size:.88rem;color:#DDD6FE;margin-bottom:16px;text-align:center">
            ${bannerNotice}
          </div>
        ` : ''}

        <div class="kg-challenge-card">
          <div class="kg-challenge-theme">${ch.theme}</div>
          <div class="kg-challenge-prompt">${ch.prompt}</div>
          <div class="kg-sequence-box">${ch.sequence.replace(/\n/g, '<br>')}</div>

          <div id="kg-feedback-area"></div>

          <div class="kg-options-grid" id="kg-options-grid">
            ${ch.options.map(opt => `
              <button class="kg-opt-btn" data-key="${opt.key}">
                <div class="kg-opt-key">${opt.key}</div>
                <span>${opt.text}</span>
              </button>
            `).join('')}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:20px" id="kg-actions-row">
            <button class="btn btn-ghost btn-sm" id="kg-giveup-btn">Conclude Activity</button>
            <button class="btn btn-amber" id="kg-submit-btn" style="background:linear-gradient(135deg,#7C3AED,#6D28D9);box-shadow:0 4px 16px rgba(124,58,237,.35)">
              Verify Answer ${IC.arrow}
            </button>
          </div>
        </div>
      </div>
    `;

    $('#kg-giveup-btn').onclick = () => finishKeepGoing();

    /* Options selection */
    $$('.kg-opt-btn').forEach(btn => {
      btn.onclick = () => {
        $$('.kg-opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOption = btn.dataset.key;
      };
    });

    $('#kg-submit-btn').onclick = () => {
      if (!selectedOption) {
        $('#kg-feedback-area').innerHTML = `
          <div style="color:#FCA5A5;font-size:.85rem;margin-bottom:12px">⚠ Please choose an option before submitting.</div>
        `;
        return;
      }
      verifyAttempt();
    };
  }

  function verifyAttempt() {
    const ch = KG_CHALLENGES[currentLevel];
    attemptsThisLevel++;

    if (selectedOption === ch.correctKey) {
      /* CORRECT ANSWER */
      challengesCompleted++;
      const isRecovery = attemptsThisLevel > 1 && hadFailureThisLevel;
      if (isRecovery) {
        recoveries++;
      }

      $$('.kg-opt-btn').forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
        if (b.dataset.key === ch.correctKey) {
          b.style.borderColor = '#10B981';
          b.style.background = 'rgba(16,185,129,.2)';
        }
      });

      const fb = $('#kg-feedback-area');
      fb.innerHTML = `
        <div class="kg-success-card">
          <div style="font-size:1.8rem;margin-bottom:6px">🌟</div>
          <div style="font-weight:700;font-size:1.1rem;color:var(--green);margin-bottom:4px">
            ${isRecovery ? 'Good recovery — you solved it on your next attempt!' : 'Brilliant deduction! Challenge solved.'}
          </div>
          <div style="font-size:.88rem;color:var(--muted)">
            ${isRecovery ? 'You persisted through a setback, analyzed the pattern, and found the correct solution.' : 'You observed the relationship with complete precision.'}
          </div>
        </div>
      `;

      $('#kg-actions-row').innerHTML = `
        <div></div>
        <button class="btn btn-amber" id="kg-next-btn" style="background:linear-gradient(135deg,#7C3AED,#6D28D9);box-shadow:0 4px 16px rgba(124,58,237,.35)">
          ${currentLevel + 1 < KG_CHALLENGES.length ? `Continue to Level ${currentLevel + 2} ${IC.arrow}` : `View Assessment Results ${IC.arrow}`}
        </button>
      `;

      $('#kg-next-btn').onclick = () => {
        if (currentLevel + 1 < KG_CHALLENGES.length) {
          currentLevel++;
          attemptsThisLevel = 0;
          hadFailureThisLevel = false;
          renderChallenge('You reached a harder level. Keep going.');
        } else {
          finishKeepGoing();
        }
      };
    } else {
      /* INCORRECT ATTEMPT (SETBACK) */
      totalFailures++;
      hadFailureThisLevel = true;

      /* Update attempts pill */
      const pill = document.getElementById('kg-attempts-pill');
      if (pill) pill.textContent = `Attempt ${attemptsThisLevel}`;

      const fb = $('#kg-feedback-area');
      fb.innerHTML = `
        <div class="kg-setback-card">
          <div class="kg-setback-title">
            <span>⚠</span> That attempt didn't work. Try a different approach.
          </div>
          <div class="kg-setback-text">
            "Never say 'no', never say 'I cannot', for you are infinite." — Swami Vivekananda.
            Setbacks are natural in difficult tasks; real perseverance comes from pausing, adjusting your hypothesis, and continuing.
          </div>
          <div class="kg-hint-box">
            💡 <strong>Guidance:</strong> ${ch.retryHint}
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
            <button class="btn btn-amber btn-sm" id="kg-retry-now-btn" style="background:linear-gradient(135deg,#7C3AED,#6D28D9)">
              🔄 Try Again (Keep Going)
            </button>
            <button class="btn btn-ghost btn-sm" id="kg-conclude-now-btn">
              Conclude Session
            </button>
          </div>
        </div>
      `;

      $('#kg-submit-btn').style.display = 'none';

      $('#kg-retry-now-btn').onclick = () => {
        retriesAfterFailure++;
        selectedOption = null;
        $$('.kg-opt-btn').forEach(b => b.classList.remove('selected'));
        fb.innerHTML = '';
        $('#kg-submit-btn').style.display = 'inline-flex';
      };

      $('#kg-conclude-now-btn').onclick = () => {
        finishKeepGoing();
      };
    }
  }

  function finishKeepGoing() {
    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStart) / 1000));
    const completionRate = Math.round((challengesCompleted / KG_CHALLENGES.length) * 100);

    /* Transparent Perseverance Score calculation */
    /* 1. Completion component: up to 40 points */
    const completionPts = Math.round((challengesCompleted / KG_CHALLENGES.length) * 40);

    /* 2. Resilience / Recovery component: up to 35 points */
    let recoveryPts = 0;
    if (totalFailures > 0) {
      const recoveryRate = recoveries / Math.max(1, challengesCompleted);
      const retryRate = Math.min(1, retriesAfterFailure / Math.max(1, totalFailures));
      recoveryPts = Math.round((recoveryRate * 20) + (retryRate * 15));
    } else if (challengesCompleted > 0) {
      recoveryPts = 35; /* Perfect run */
    }

    /* 3. Progression component: up to 25 points */
    const progressPts = Math.round((highestLevelReached / KG_CHALLENGES.length) * 25);

    const totalScore = Math.min(100, Math.max(0, completionPts + recoveryPts + progressPts));
    const cat = getScoreCategory(totalScore);

    const resultData = {
      score: totalScore,
      category: cat.label,
      challengesAttempted,
      challengesCompleted,
      totalFailures,
      retriesAfterFailure,
      recoveries,
      highestLevelReached,
      completionRate,
      durationSeconds,
    };

    saveActivityScore('keep-going', resultData);

    renderActivityResultScreen({
      activityId: 'keep-going',
      activityTitle: 'Keep Going',
      measureName: 'Perseverance Score',
      score: totalScore,
      category: cat.label,
      cssClass: cat.cssClass,
      summaryText: `Your score reflects how you responded to challenges and setbacks during this activity.`,
      metrics: [
        { label: 'Challenges Solved', value: `${challengesCompleted} of ${KG_CHALLENGES.length}` },
        { label: 'Highest Level Reached', value: `Level ${highestLevelReached} of 5` },
        { label: 'Setbacks Encountered', value: totalFailures },
        { label: 'Retries After Setbacks', value: retriesAfterFailure },
        { label: 'Successful Recoveries', value: recoveries },
        { label: 'Total Duration', value: `${fmt(durationSeconds)}` },
      ],
      onTryAgain: () => startKeepGoing(),
    });
  }

  renderIntro();
}

/* ── Unified Activity Result Screen ── */
function renderActivityResultScreen({
  activityId,
  activityTitle,
  measureName,
  score,
  category,
  cssClass,
  summaryText,
  metrics,
  onTryAgain,
}) {
  $('#main-content').innerHTML = `
    <div class="activity-stage">
      <div class="act-top-bar">
        <div class="act-top-title">
          <span>${activityId === 'focus-grid' ? '⚡' : '🏔'}</span> ${activityTitle} Assessment
        </div>
        <button class="btn btn-ghost btn-sm" id="res-back-btn">${IC.back} Activities</button>
      </div>

      <div class="act-result-card">
        <div class="act-result-circle ${cssClass}">
          <div class="act-result-num">${score}</div>
          <div class="act-result-den">out of 100</div>
        </div>

        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.35);border-radius:999px;padding:6px 18px;font-size:.88rem;font-weight:700;color:var(--amber-l);margin-bottom:14px;box-shadow:0 4px 14px rgba(217,119,6,.2)">⭐ +${Math.round(score * 0.4)} stars earned</div>

        <div style="font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:6px">${measureName}</div>
        <div class="act-level-badge ${cssClass}">${category}</div>

        <div class="act-summary-text">
          ${summaryText}
        </div>

        <div class="act-metrics-breakdown">
          ${metrics.map(m => `
            <div class="act-mb-box">
              <div class="act-mb-val">${m.value}</div>
              <div class="act-mb-lbl">${m.label}</div>
            </div>
          `).join('')}
        </div>

        <div class="act-disclaimer">
          ⚖️ <strong>Performance Note:</strong> This score reflects your performance in this activity and is intended for self-awareness, not clinical assessment.
        </div>

        <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap">
          <button class="btn btn-amber" id="res-retry-btn">
            🔄 Try Again
          </button>
          <button class="btn btn-outline" id="res-act-btn">
            Back to Activities
          </button>
        </div>
      </div>
    </div>
  `;

  $('#res-back-btn').onclick = () => studentActivities();
  $('#res-act-btn').onclick  = () => studentActivities();
  $('#res-retry-btn').onclick = () => onTryAgain();
}

/* ══════════════════════════════════════════════════════════
   TEACHER SHELL
   ══════════════════════════════════════════════════════════ */

function renderTeacher(tab) {
  mount(`
  <div class="app-shell">
    ${sidebarHTML(tab, 'teacher')}
    <main class="main-content" id="main-content"></main>
  </div>`);
  bindSidebarNav('teacher');

  if (tab === 'overview'  || tab === 'dashboard') teacherOverview();
  if (tab === 'students')  teacherStudents();
  if (tab === 'analytics') teacherAnalytics();
  if (tab === 'settings')  teacherSettings();
}

function teacherOverview() {
  const clsAvg = avg('overall');
  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>Class Overview</h2>
      <p>Track your students' character development.</p>
    </div>

    <div class="class-avg-banner">
      <div class="cab-left">
        <div class="cab-label">Class Average</div>
        <div><span class="cab-score">${clsAvg}</span><span class="cab-delta">↑ 10%</span></div>
      </div>
      <div class="cab-metrics">
        ${[['concentration','Concentration'],['reliance','Self-Reliance'],['perseverance','Perseverance'],['confidence','Confidence'],['character','Character']].map(([k,l]) => {
          const cfg = METRIC_CFG[k];
          const val = k === 'character' ? avg('overall') : avg(k==='concentration'?'conc':k==='reliance'?'rel':k==='perseverance'?'pers':k==='confidence'?'conf':'overall');
          return `<div class="cam">
            <div class="cam-label" style="color:${cfg.color}">${QUOTES[k].icon} ${l}</div>
            <div class="cam-score" style="color:${cfg.color}">${val}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Students Performance</div>
      <div class="students-table-wrap">
        <table class="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th style="color:#F59E0B">🔥 Conc.</th>
              <th style="color:#10B981">🌳 Reliance</th>
              <th style="color:#8B5CF6">⚡ Persev.</th>
              <th style="color:#3B82F6">⭐ Conf.</th>
              <th style="color:#EC4899">🛡️ Character</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            ${CLASS.map(s => `
              <tr>
                <td>
                  <div class="st-name">
                    <div class="st-avatar">${s.name.charAt(0)}</div>
                    <div>
                      <div>${s.name}</div>
                      ${s.flag === 'risk' ? '<div><span class="risk-flag">⚠ needs attention</span></div>' : ''}
                      ${s.flag === 'star' ? '<div><span class="star-flag">★ strong growth</span></div>'   : ''}
                    </div>
                  </div>
                </td>
                <td class="st-score">${s.conc}</td>
                <td class="st-score">${s.rel}</td>
                <td class="st-score">${s.pers}</td>
                <td class="st-score">${s.conf}</td>
                <td class="st-score" style="color:var(--amber-l);font-size:1rem">${s.overall}</td>
                <td class="${s.trend==='up'?'trend-up':s.trend==='down'?'trend-down':'trend-flat'}">
                  ${s.trend==='up'?'↑ Up':s.trend==='down'?'↓ Down':'→ Stable'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function teacherStudents() {
  /* full student list with detail */
  teacherOverview();
}

function teacherAnalytics() {
  $('#main-content').innerHTML = `
    <div class="section-head">
      <h2>Class Analytics</h2>
      <p>Visualise character metrics across the class.</p>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">Metric Comparison</div>
      <canvas id="classChart"></canvas>
    </div>
    <div class="insight-row">
      <div class="insight-card focus-area">
        <h4>⚠ Needs Attention — Priya Nair</h4>
        <p>Self-reliance dropped over three weeks. Hint use doubled while task attempts stayed flat. She may be giving up before the healthy 2–3 retry range.</p>
      </div>
      <div class="insight-card strength">
        <h4>★ Strong Growth — Arjun Mehta</h4>
        <p>Concentration rose 9 points this month — more uninterrupted focus and longer correct-answer streaks. A genuine internal improvement worth celebrating.</p>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    const c = $('#classChart');
    if (c) drawBar(c.getContext('2d'),
      CLASS.map(s => s.name.split(' ')[0]),
      [{ label:'Concentration', data:CLASS.map(s=>s.conc),    color:'#F59E0B' },
       { label:'Self-Reliance', data:CLASS.map(s=>s.rel),     color:'#10B981' },
       { label:'Perseverance',  data:CLASS.map(s=>s.pers),    color:'#8B5CF6' },
       { label:'Confidence',    data:CLASS.map(s=>s.conf),    color:'#3B82F6' }]);
  });
}

function teacherSettings() {
  const name = sessionStorage.getItem('name') || '';
  const user = sessionStorage.getItem('username') || '';
  $('#main-content').innerHTML = `
    <div class="section-head"><h2>Settings</h2><p>Manage your account.</p></div>
    <div class="card" style="max-width:480px">
      <div class="card-title">Account</div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px">
        <div class="sb-avatar" style="width:48px;height:48px;font-size:1.1rem">${name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:600;color:var(--text)">${name}</div>
          <div style="font-size:.82rem;color:var(--muted)">@${user} · Teacher</div>
        </div>
      </div>
      <button class="btn btn-outline" style="width:100%;border-color:var(--red-dim);color:var(--red)" id="t-settings-logout">
        ${IC.logout} Sign Out
      </button>
    </div>`;
  $('#t-settings-logout').onclick = () => { sessionStorage.clear(); SCORES = null; renderLogin(); };
}

/* ─────────────────────────────────────────────────────────
   7. BOOT
   ───────────────────────────────────────────────────────── */
(function boot() {
  const params = new URLSearchParams(window.location.search);
  const token  = sessionStorage.getItem('token');
  const role   = sessionStorage.getItem('role');

  /* coming from landingpage.html CTA → clean URL and go straight to login */
  if (params.get('go') === 'login') {
    try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
    renderLogin();
  } else if (token && role) {
    /* restore active session on refresh */
    if (role === 'teacher') renderTeacher('overview');
    else renderStudent('dashboard');
  } else {
    /* app entry point default: show login screen */
    renderLogin();
  }
})();
