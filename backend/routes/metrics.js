const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');

/* Mirrors the formulas in frontend/js/app.js — keep in sync */
const _r = n => Math.round(n * 10) / 10;

function calcConcentration({ focusSeconds=0, totalSeconds=1, tabSwitches=0, correctStreak=0 }) {
  const fp = focusSeconds / totalSeconds;
  const base = _r(fp * 60);
  const switchPenalty = Math.min(tabSwitches * 4, 15);
  const streakBonus   = Math.min(correctStreak * 5, 25);
  return { base, switchPenalty, streakBonus, focusPct: _r(fp * 100),
           total: Math.max(0, Math.min(100, _r(base - switchPenalty + streakBonus))) };
}

function calcReliance({ tasksAttempted=1, tasksNoHint=0, hintsThisWeek=0, hintsLastWeek=0 }) {
  const nhp = tasksNoHint / tasksAttempted;
  const base = _r(nhp * 70);
  const hd = hintsLastWeek > 0 ? (hintsLastWeek - hintsThisWeek) / hintsLastWeek : 0;
  const trendBonus = _r(Math.max(0, hd) * 30);
  return { base, trendBonus, noHintPct: _r(nhp * 100), hintDrop: _r(hd * 100),
           total: Math.max(0, Math.min(100, _r(base + trendBonus))) };
}

function calcPerseverance({ retriedCount=1, eventualSuccess=0, avgRetries=0 }) {
  const sr = eventualSuccess / retriedCount;
  const base = _r(sr * 65);
  const rf = avgRetries >= 2 && avgRetries <= 3.2
    ? 35 : Math.max(0, 35 - Math.abs(avgRetries - 2.5) * 12);
  return { base, rangeFit: _r(rf), successRate: _r(sr * 100),
           total: Math.max(0, Math.min(100, _r(base + _r(rf)))) };
}

function calcConfidence(calibration=[]) {
  if (!calibration.length) return { avgErr: 0, calibScore: 0, hardBonus: 0, total: 0 };
  const errs = calibration.map(c => Math.abs(c.rated - c.actual));
  const ae = errs.reduce((a, b) => a + b, 0) / errs.length;
  const cs = _r(Math.max(0, 100 - ae * 22));
  const hb = Math.min(calibration.filter(c => c.rated >= 4).length * 4, 20);
  return { avgErr: _r(ae), calibScore: cs, hardBonus: hb,
           total: Math.max(0, Math.min(100, _r(cs * 0.8 + hb))) };
}

/**
 * POST /api/metrics/compute
 * Computes all 5 scores from raw session data.
 *
 * Body:
 * {
 *   today:       { focusSeconds, totalSeconds, tabSwitches, correctStreak },
 *   week:        { tasksAttempted, tasksNoHint, hintsThisWeek, hintsLastWeek },
 *   retries:     { retriedCount, eventualSuccess, avgRetries },
 *   calibration: [ { rated, actual }, ... ]
 * }
 */
router.post('/compute', authMiddleware, (req, res) => {
  const { today = {}, week = {}, retries = {}, calibration = [] } = req.body;

  const conc = calcConcentration(today);
  const rel  = calcReliance(week);
  const pers = calcPerseverance(retries);
  const conf = calcConfidence(calibration);
  const char = { total: _r(conc.total*.25 + rel.total*.25 + pers.total*.25 + conf.total*.25) };

  res.json({
    scores: { concentration: conc, reliance: rel, perseverance: pers, confidence: conf, character: char }
  });
});

/**
 * GET /api/metrics/formulas
 * Returns human-readable description of all formulas
 */
router.get('/formulas', (req, res) => {
  res.json({
    concentration: 'base = (focusSeconds/totalSeconds)×60  −  tabSwitches×4  +  min(correctStreak×5, 25)',
    reliance:      'base = (tasksNoHint/tasksAttempted)×70  +  hintReductionVsLastWeek×30',
    perseverance:  'base = (eventualSuccess/retriedCount)×65  +  rangeFitBonus (35 when avgRetries ∈ [2,3.2])',
    confidence:    'base = max(0, 100−avgAbsError×22)×0.8  +  min(hardTaskAttempts×4, 20)',
    character:     'average of all four scores (25% each)'
  });
});

module.exports = router;
