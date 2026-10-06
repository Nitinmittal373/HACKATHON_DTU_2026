/* =========================================================
   DATA — quotes, sample records, and score formulas
   ========================================================= */

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

/* ── Sample student session data ── */
const RAHUL = {
  name: 'Rahul Singh',
  today: { focusSeconds: 1080, totalSeconds: 1200, tabSwitches: 1, correctStreak: 3 },
  week:  { tasksAttempted: 14, tasksNoHint: 11, hintsThisWeek: 6, hintsLastWeek: 11 },
  retries: { failuresThisWeek: 5, retriedCount: 5, eventualSuccess: 4, avgRetries: 2.4 },
  calibration: [
    { task: 'Fractions word problem',   rated: 4, actual: 3 },
    { task: 'Algebra: solve for x',     rated: 2, actual: 2 },
    { task: 'Geometry: area of triangle', rated: 5, actual: 4 },
    { task: 'Percentages',              rated: 3, actual: 2 },
    { task: 'Linear equations',         rated: 4, actual: 4 }
  ],
  trend: [61, 66, 70, 74, 78]
};

/* ── Class roster (used in teacher views) ── */
const CLASS = [
  { name: 'Rahul Singh',  conc: null, rel: null, pers: null, overall: null, trend: 'up' },
  { name: 'Priya Nair',   conc: 52,   rel: 40,   pers: 38,   overall: 44,   trend: 'down', flag: 'risk' },
  { name: 'Arjun Mehta',  conc: 88,   rel: 91,   pers: 85,   overall: 89,   trend: 'up',   flag: 'star' },
  { name: 'Sana Qureshi', conc: 67,   rel: 70,   pers: 64,   overall: 67,   trend: 'stable' },
  { name: 'Vikram Rao',   conc: 60,   rel: 55,   pers: 72,   overall: 62,   trend: 'up' }
];

/* ── Score formulas ── */
const r = n => Math.round(n * 10) / 10;

function calcC(d) {
  const fp = d.focusSeconds / d.totalSeconds;
  const base = r(fp * 60);
  const switchPenalty = Math.min(d.tabSwitches * 4, 15);
  const streakBonus   = Math.min(d.correctStreak * 5, 25);
  return { base, switchPenalty, streakBonus, focusPct: fp,
           total: Math.max(0, Math.min(100, r(base - switchPenalty + streakBonus))) };
}

function calcR(d) {
  const nhp  = d.tasksNoHint / d.tasksAttempted;
  const base  = r(nhp * 70);
  const hd    = d.hintsLastWeek > 0 ? (d.hintsLastWeek - d.hintsThisWeek) / d.hintsLastWeek : 0;
  const trendBonus = r(Math.max(0, hd) * 30);
  return { base, trendBonus, noHintPct: nhp, hintDrop: hd,
           total: Math.max(0, Math.min(100, r(base + trendBonus))) };
}

function calcP(d) {
  const sr   = d.eventualSuccess / d.retriedCount;
  const base  = r(sr * 65);
  const rf    = d.avgRetries >= 2 && d.avgRetries <= 3.2
    ? 35
    : Math.max(0, 35 - Math.abs(d.avgRetries - 2.5) * 12);
  return { base, rangeFit: r(rf), successRate: sr,
           total: Math.max(0, Math.min(100, r(base + r(rf)))) };
}

function calcCO(rows) {
  const errs = rows.map(r => Math.abs(r.rated - r.actual));
  const ae   = errs.reduce((a, b) => a + b, 0) / errs.length;
  const cs   = r(Math.max(0, 100 - ae * 22));
  const ah   = rows.filter(x => x.rated >= 4).length;
  const hb   = Math.min(ah * 4, 20);
  return { avgErr: r(ae), calibScore: cs, hardBonus: hb,
           total: Math.max(0, Math.min(100, r(cs * 0.8 + hb))) };
}

function calcCH(c, rv, p, co) {
  return { total: r(c * 0.25 + rv * 0.25 + p * 0.25 + co * 0.25) };
}

/* ── Pre-compute Rahul's scores ── */
const C  = calcC(RAHUL.today);
const R  = calcR(RAHUL.week);
const P  = calcP(RAHUL.retries);
const CO = calcCO(RAHUL.calibration);
const CH = calcCH(C.total, R.total, P.total, CO.total);

/* Patch Rahul's row in CLASS with live scores */
CLASS[0].conc    = C.total;
CLASS[0].rel     = R.total;
CLASS[0].pers    = P.total;
CLASS[0].overall = CH.total;

const avg = k => r(CLASS.reduce((a, s) => a + s[k], 0) / CLASS.length);

/* ── SVG portraits (no external image dependency) ── */
const PORTRAIT_SVG = `
<svg viewBox="0 0 90 110" xmlns="http://www.w3.org/2000/svg" style="width:90px;height:110px;border-radius:10px;border:2px solid var(--saffron);flex:none">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%"><stop offset="0%" stop-color="#6b2d10"/><stop offset="100%" stop-color="#2a0e04"/></radialGradient>
    <radialGradient id="skin" cx="50%" cy="40%"><stop offset="0%" stop-color="#c87840"/><stop offset="100%" stop-color="#8b4820"/></radialGradient>
  </defs>
  <rect width="90" height="110" fill="url(#bg)"/>
  <path d="M10 110 Q15 70 45 65 Q75 70 80 110Z" fill="#e07020" opacity=".9"/>
  <path d="M28 68 Q45 80 62 68 L65 90 Q45 100 25 90Z" fill="#c87840"/>
  <ellipse cx="45" cy="42" rx="22" ry="26" fill="url(#skin)"/>
  <path d="M23 36 Q25 10 45 8 Q65 10 67 36 Q65 28 45 26 Q25 28 23 36Z" fill="#8b1a1a"/>
  <path d="M23 36 Q24 24 45 22 Q66 24 67 36" fill="none" stroke="#e07020" stroke-width="1.5"/>
  <ellipse cx="36" cy="42" rx="4.5" ry="3" fill="#1a0a04"/>
  <ellipse cx="54" cy="42" rx="4.5" ry="3" fill="#1a0a04"/>
  <circle cx="37" cy="41" r="1" fill="#fff" opacity=".7"/>
  <circle cx="55" cy="41" r="1" fill="#fff" opacity=".7"/>
  <path d="M31 37 Q36 34 41 37" stroke="#3a1a08" stroke-width="1.5" fill="none"/>
  <path d="M49 37 Q54 34 59 37" stroke="#3a1a08" stroke-width="1.5" fill="none"/>
  <path d="M43 44 Q41 50 45 52 Q49 50 47 44" stroke="#a05020" stroke-width="1" fill="none"/>
  <path d="M37 55 Q45 58 53 55" stroke="#2a1008" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M39 60 Q45 63 51 60" stroke="#8b4020" stroke-width="1.2" fill="none"/>
  <ellipse cx="23" cy="44" rx="3" ry="4.5" fill="#b86030"/>
  <ellipse cx="67" cy="44" rx="3" ry="4.5" fill="#b86030"/>
  <text x="38" y="100" font-size="12" fill="#e0aa30" font-family="serif">ॐ</text>
</svg>`;

const PORTRAIT_SM = `
<svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg" style="width:50px;height:60px;border-radius:8px;border:2px solid var(--saffron)">
  <defs><radialGradient id="bg2" cx="50%" cy="50%"><stop offset="0%" stop-color="#6b2d10"/><stop offset="100%" stop-color="#2a0e04"/></radialGradient></defs>
  <rect width="50" height="60" fill="url(#bg2)"/>
  <path d="M5 60 Q10 38 25 35 Q40 38 45 60Z" fill="#e07020" opacity=".9"/>
  <ellipse cx="25" cy="24" rx="13" ry="15" fill="#c87840"/>
  <path d="M12 20 Q13 5 25 4 Q37 5 38 20 Q36 14 25 13 Q14 14 12 20Z" fill="#8b1a1a"/>
  <ellipse cx="19" cy="23" rx="3" ry="2" fill="#1a0a04"/>
  <ellipse cx="31" cy="23" rx="3" ry="2" fill="#1a0a04"/>
  <path d="M20 31 Q25 34 30 31" stroke="#2a1008" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <text x="19" y="55" font-size="8" fill="#e0aa30" font-family="serif">ॐ</text>
</svg>`;
