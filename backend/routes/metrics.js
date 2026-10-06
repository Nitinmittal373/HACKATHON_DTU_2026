const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');

/* ── Shared utilities ───────────────────────────────────── */

/** Round to 1 decimal place. */
const _r = n => Math.round(n * 10) / 10;

/** Clamp n to [lo, hi]. */
const _clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Return n if it is a finite non-negative number; otherwise return def. */
const _nn = (n, def = 0) => (Number.isFinite(n) && n >= 0) ? n : def;

/** Guarantee a finite number; replace NaN/Infinity with 0. */
const _safe = n => (Number.isFinite(n) ? n : 0);

/* ═══════════════════════════════════════════════════════════
   METRIC FUNCTIONS
   Each function accepts a plain object, sanitizes every field,
   guards every division, and guarantees:
     • no NaN, no Infinity
     • total ∈ [0, 100]
   ═════════════════════════════════════════════════════════ */

/**
 * Concentration (एकाग्रता)
 *
 * base           = (focusSeconds / totalSeconds) × 60
 * switchPenalty  = min(tabSwitches × 4, 15)
 * streakBonus    = min(correctStreak × 5, 25)
 * total          = clamp(base − switchPenalty + streakBonus, 0, 100)
 *
 * Guards:
 *   totalSeconds = 0  → return zeroed result (no session elapsed)
 *   focusSeconds > totalSeconds → clamped to totalSeconds
 *   negative inputs → treated as 0
 */
function calcConcentration({ focusSeconds = 0, totalSeconds = 0, tabSwitches = 0, correctStreak = 0 } = {}) {
  const ts = _nn(totalSeconds);
  if (ts <= 0) {
    return { base: 0, switchPenalty: 0, streakBonus: 0, focusPct: 0, total: 0 };
  }

  const fs = _clamp(_nn(focusSeconds), 0, ts);   // focus ≤ total
  const sw = _nn(tabSwitches);
  const cs = _nn(correctStreak);

  const fp            = fs / ts;
  const base          = _r(fp * 60);
  const switchPenalty = _clamp(_r(sw * 4), 0, 15);
  const streakBonus   = _clamp(_r(cs * 5), 0, 25);

  return {
    base,
    switchPenalty,
    streakBonus,
    focusPct: _r(fp * 100),
    total: _clamp(_r(base - switchPenalty + streakBonus), 0, 100),
  };
}

/**
 * Self-Reliance (आत्मनिर्भरता)
 *
 * noHintRatio  = tasksNoHint / tasksAttempted
 * base         = noHintRatio × 70
 * hintDrop     = (hintsLastWeek − hintsThisWeek) / hintsLastWeek
 * trendBonus   = max(0, hintDrop) × 30
 * total        = clamp(base + trendBonus, 0, 100)
 *
 * Guards:
 *   tasksAttempted = 0 → return zeroed result; flag insufficient: true
 *   tasksNoHint > tasksAttempted → clamped to tasksAttempted
 *   hintsLastWeek = 0 → trendBonus = 0 (no improvement measurable)
 *   negative inputs → treated as 0
 */
function calcReliance({ tasksAttempted = 0, tasksNoHint = 0, hintsThisWeek = 0, hintsLastWeek = 0 } = {}) {
  const ta = _nn(tasksAttempted);
  if (ta <= 0) {
    return { base: 0, trendBonus: 0, noHintPct: 0, hintDrop: 0, total: 0, insufficient: true };
  }

  const nh = _clamp(_nn(tasksNoHint), 0, ta);  // no-hint ≤ attempted
  const tw = _nn(hintsThisWeek);
  const lw = _nn(hintsLastWeek);

  const nhp        = nh / ta;
  const base       = _r(nhp * 70);
  const hd         = lw > 0 ? _clamp((lw - tw) / lw, -1, 1) : 0;
  const trendBonus = _r(_clamp(hd, 0, 1) * 30);  // only reward reduction, not punish increase

  return {
    base,
    trendBonus,
    noHintPct: _r(nhp * 100),
    hintDrop:  _r(hd * 100),
    total:     _clamp(_r(base + trendBonus), 0, 100),
  };
}

/**
 * Perseverance (दृढ़ता)
 *
 * successRate  = eventualSuccess / retriedCount
 * base         = successRate × 65
 * rangeFit     = 35   (if avgRetries ∈ [2.0, 3.2])
 *              = max(0, 35 − |avgRetries − 2.5| × 12)   (otherwise)
 * total        = clamp(base + rangeFit, 0, 100)
 *
 * Guards:
 *   retriedCount = 0 → student solved everything on first try;
 *     return base = 65 (100% implied success), rangeFit for avgRetries=0
 *     Flag firstTryOnly: true so callers can note "no retry data"
 *   eventualSuccess > retriedCount → clamped to retriedCount
 *   avgRetries < 0 → treated as 0
 *   negative inputs → treated as 0
 */
function calcPerseverance({ retriedCount = 0, eventualSuccess = 0, avgRetries = 0 } = {}) {
  const rc = _nn(retriedCount);
  const ar = _clamp(_nn(avgRetries), 0, 100);

  if (rc <= 0) {
    // No tasks needed retrying: treat success rate as 100%, rangeFit for avgRetries=0
    const rf = _clamp(_r(35 - Math.abs(0 - 2.5) * 12), 0, 35);  // = 5
    return { base: 65, rangeFit: rf, successRate: 100, total: _clamp(_r(65 + rf), 0, 100), firstTryOnly: true };
  }

  const es   = _clamp(_nn(eventualSuccess), 0, rc);  // success ≤ retried
  const sr   = es / rc;
  const base = _r(sr * 65);
  const rf   = (ar >= 2 && ar <= 3.2)
    ? 35
    : _clamp(_r(35 - Math.abs(ar - 2.5) * 12), 0, 35);

  return {
    base,
    rangeFit:    _r(rf),
    successRate: _r(sr * 100),
    total:       _clamp(_r(base + _r(rf)), 0, 100),
  };
}

/**
 * Confidence (आत्मविश्वास)
 *
 * avgAbsError  = mean of |rated − actual| for each calibration entry
 * calibScore   = max(0, 100 − avgAbsError × 22)
 * hardBonus    = min(count of entries with difficulty ≥ 3, 5) × 4
 * total        = clamp(calibScore × 0.8 + hardBonus, 0, 100)
 *
 * Note on hardBonus: rewards students who attempted genuinely hard tasks
 * (difficulty ≥ 3 from the task bank), NOT simply those who self-rated ≥ 4.
 * Calibration entries must include { rated, actual, difficulty }.
 *
 * Guards:
 *   empty calibration → return zeroed result; flag insufficient: true
 *   invalid rated/actual (out of [1,5]) → entry skipped
 *   missing difficulty → treated as difficulty 1 (not a hard task)
 */
function calcConfidence(calibration = []) {
  if (!Array.isArray(calibration) || calibration.length === 0) {
    return { avgErr: 0, calibScore: 0, hardBonus: 0, total: 0, insufficient: true };
  }

  const valid = calibration.filter(c =>
    Number.isFinite(c.rated)  && c.rated  >= 1 && c.rated  <= 5 &&
    Number.isFinite(c.actual) && c.actual >= 1 && c.actual <= 5
  );

  if (valid.length === 0) {
    return { avgErr: 0, calibScore: 0, hardBonus: 0, total: 0, insufficient: true };
  }

  const errs = valid.map(c => Math.abs(c.rated - c.actual));
  const ae   = _safe(errs.reduce((a, b) => a + b, 0) / errs.length);
  const cs   = _r(Math.max(0, 100 - ae * 22));

  // Hard-task bonus: tied to task difficulty, not self-confidence level
  const hardCount = valid.filter(c => (_nn(c.difficulty, 1)) >= 3).length;
  const hb        = _clamp(hardCount * 4, 0, 20);

  return {
    avgErr:     _r(ae),
    calibScore: cs,
    hardBonus:  hb,
    total:      _clamp(_r(cs * 0.8 + hb), 0, 100),
  };
}

/* ═══════════════════════════════════════════════════════════
   ROUTE HANDLERS
   ═════════════════════════════════════════════════════════ */

/**
 * POST /api/metrics/compute
 * Computes all 5 scores from raw session data.
 *
 * Body:
 * {
 *   today: { focusSeconds, totalSeconds, tabSwitches, correctStreak },
 *   week:  { tasksAttempted, tasksNoHint, hintsThisWeek, hintsLastWeek },
 *   retries: { retriedCount, eventualSuccess, avgRetries },
 *   calibration: [{ rated, actual, difficulty }, ...]
 * }
 */
router.post('/compute', authMiddleware, (req, res) => {
  const { today = {}, week = {}, retries = {}, calibration = [] } = req.body;

  // Reject clearly non-object payloads early
  if (typeof today !== 'object' || Array.isArray(today) ||
      typeof week  !== 'object' || Array.isArray(week)  ||
      typeof retries !== 'object' || Array.isArray(retries) ||
      !Array.isArray(calibration)) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  const conc = calcConcentration(today);
  const rel  = calcReliance(week);
  const pers = calcPerseverance(retries);
  const conf = calcConfidence(calibration);
  const char = { total: _clamp(_r(conc.total * 0.25 + rel.total * 0.25 + pers.total * 0.25 + conf.total * 0.25), 0, 100) };

  res.json({
    scores: { concentration: conc, reliance: rel, perseverance: pers, confidence: conf, character: char },
  });
});

/**
 * GET /api/metrics/formulas
 * Returns the exact formulas used in the backend (matches METRICS.md).
 */
router.get('/formulas', (req, res) => {
  res.json({
    concentration: [
      'focusPct       = clamp(focusSeconds, 0, totalSeconds) / totalSeconds × 100',
      'base           = focusPct × 0.6',
      'switchPenalty  = min(tabSwitches × 4, 15)',
      'streakBonus    = min(correctStreak × 5, 25)',
      'Concentration  = clamp(base − switchPenalty + streakBonus, 0, 100)',
      'Guard: totalSeconds = 0 → 0',
    ],
    reliance: [
      'noHintRatio    = clamp(tasksNoHint, 0, tasksAttempted) / tasksAttempted',
      'base           = noHintRatio × 70',
      'hintDrop       = (hintsLastWeek − hintsThisWeek) / hintsLastWeek',
      'trendBonus     = max(0, hintDrop) × 30',
      'Self-Reliance  = clamp(base + trendBonus, 0, 100)',
      'Guard: tasksAttempted = 0 → 0 (insufficient data)',
    ],
    perseverance: [
      'successRate    = clamp(eventualSuccess, 0, retriedCount) / retriedCount',
      'base           = successRate × 65',
      'rangeFit       = 35   if avgRetries ∈ [2.0, 3.2]',
      '               = max(0, 35 − |avgRetries − 2.5| × 12)   otherwise',
      'Perseverance   = clamp(base + rangeFit, 0, 100)',
      'Guard: retriedCount = 0 → base = 65 (first-try-only, no retry data)',
    ],
    confidence: [
      'avgAbsError    = mean(|rated − actual|) over valid calibration entries',
      'calibScore     = max(0, 100 − avgAbsError × 22)',
      'hardBonus      = min(count(difficulty ≥ 3) × 4, 20)',
      'Confidence     = clamp(calibScore × 0.8 + hardBonus, 0, 100)',
      'Guard: empty calibration → 0 (insufficient data)',
      'Note: hardBonus requires calibration entries to include difficulty field',
    ],
    character: [
      'Character = (Concentration + Self-Reliance + Perseverance + Confidence) / 4',
    ],
  });
});

module.exports = router;

/* Export functions for unit testing */
module.exports.calcConcentration = calcConcentration;
module.exports.calcReliance      = calcReliance;
module.exports.calcPerseverance  = calcPerseverance;
module.exports.calcConfidence    = calcConfidence;
