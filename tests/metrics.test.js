const {
  calcConcentration,
  calcReliance,
  calcPerseverance,
  calcConfidence,
} = require('../backend/routes/metrics');

/* ── helpers ────────────────────────────────────────────── */
const noNaN   = obj => Object.values(obj).every(v => typeof v === 'boolean' || Number.isFinite(v));
const inRange = (n, lo = 0, hi = 100) => n >= lo && n <= hi;

/* ═══════════════════════════════════════════════════════════
   CONCENTRATION
   ═════════════════════════════════════════════════════════ */
describe('calcConcentration', () => {
  it('normal values: 90% focus, 1 switch, 3-answer streak', () => {
    const r = calcConcentration({ focusSeconds: 1080, totalSeconds: 1200, tabSwitches: 1, correctStreak: 3 });
    expect(r.focusPct).toBeCloseTo(90, 0);
    expect(r.base).toBeCloseTo(54, 0);
    expect(r.switchPenalty).toBe(4);
    expect(r.streakBonus).toBe(15);
    expect(r.total).toBe(65);
  });

  it('perfect focus, no switches, no streak → base 60', () => {
    const r = calcConcentration({ focusSeconds: 600, totalSeconds: 600, tabSwitches: 0, correctStreak: 0 });
    expect(r.focusPct).toBe(100);
    expect(r.total).toBe(60);
  });

  it('zero totalSeconds → total = 0 (no NaN)', () => {
    const r = calcConcentration({ focusSeconds: 0, totalSeconds: 0 });
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
  });

  it('focusSeconds > totalSeconds → clamped, no score > 60 from focus alone', () => {
    const r = calcConcentration({ focusSeconds: 2000, totalSeconds: 1000, tabSwitches: 0, correctStreak: 0 });
    expect(r.focusPct).toBe(100);
    expect(r.total).toBe(60);
  });

  it('maximum switches penalty capped at 15', () => {
    const r = calcConcentration({ focusSeconds: 600, totalSeconds: 600, tabSwitches: 100, correctStreak: 0 });
    expect(r.switchPenalty).toBe(15);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it('maximum streak bonus capped at 25', () => {
    const r = calcConcentration({ focusSeconds: 600, totalSeconds: 600, tabSwitches: 0, correctStreak: 100 });
    expect(r.streakBonus).toBe(25);
    expect(r.total).toBe(85);   // 60 + 25
  });

  it('negative focusSeconds → treated as 0', () => {
    const r = calcConcentration({ focusSeconds: -100, totalSeconds: 600 });
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
  });

  it('negative tabSwitches → treated as 0, no negative penalty', () => {
    const r = calcConcentration({ focusSeconds: 600, totalSeconds: 600, tabSwitches: -5, correctStreak: 0 });
    expect(r.switchPenalty).toBe(0);
    expect(r.total).toBe(60);
  });

  it('total always in [0, 100]', () => {
    const cases = [
      { focusSeconds: 0, totalSeconds: 1, tabSwitches: 100, correctStreak: 0 },
      { focusSeconds: 600, totalSeconds: 600, tabSwitches: 0, correctStreak: 100 },
      { focusSeconds: 600, totalSeconds: 600, tabSwitches: 0, correctStreak: 20 },
    ];
    cases.forEach(c => {
      const r = calcConcentration(c);
      expect(inRange(r.total)).toBe(true);
    });
  });

  it('missing fields → all default to 0', () => {
    const r = calcConcentration({});
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════
   SELF-RELIANCE
   ═════════════════════════════════════════════════════════ */
describe('calcReliance', () => {
  it('normal values: 11/14 hint-free, 45% hint drop', () => {
    const r = calcReliance({ tasksAttempted: 14, tasksNoHint: 11, hintsThisWeek: 6, hintsLastWeek: 11 });
    expect(r.noHintPct).toBeCloseTo(78.6, 0);
    expect(r.trendBonus).toBeGreaterThan(0);
    expect(r.total).toBeGreaterThan(50);
  });

  it('zero tasksAttempted → total = 0 with insufficient flag', () => {
    const r = calcReliance({ tasksAttempted: 0, tasksNoHint: 0 });
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
    expect(r.insufficient).toBe(true);
  });

  it('no-hint session: all tasks completed without hints', () => {
    const r = calcReliance({ tasksAttempted: 5, tasksNoHint: 5, hintsThisWeek: 0, hintsLastWeek: 0 });
    expect(r.noHintPct).toBe(100);
    expect(r.base).toBe(70);
    expect(r.trendBonus).toBe(0);    // hintsLastWeek=0 → no measurable trend
    expect(r.total).toBe(70);
  });

  it('high hint usage: 0 hint-free tasks, hints increasing', () => {
    const r = calcReliance({ tasksAttempted: 10, tasksNoHint: 0, hintsThisWeek: 20, hintsLastWeek: 5 });
    expect(r.base).toBe(0);
    expect(r.trendBonus).toBe(0);    // hints increased → no bonus
    expect(r.total).toBe(0);
  });

  it('tasksNoHint > tasksAttempted → clamped, no score over 70 from base', () => {
    const r = calcReliance({ tasksAttempted: 5, tasksNoHint: 10, hintsThisWeek: 0, hintsLastWeek: 0 });
    expect(r.base).toBe(70);
    expect(r.total).toBeLessThanOrEqual(100);
  });

  it('hintsLastWeek = 0, hintsThisWeek = 0 → no division, trendBonus = 0', () => {
    const r = calcReliance({ tasksAttempted: 5, tasksNoHint: 3, hintsThisWeek: 0, hintsLastWeek: 0 });
    expect(noNaN(r)).toBe(true);
    expect(r.trendBonus).toBe(0);
  });

  it('minimum values → all 0', () => {
    const r = calcReliance({ tasksAttempted: 0 });
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
  });

  it('total always in [0, 100]', () => {
    const cases = [
      { tasksAttempted: 1, tasksNoHint: 1, hintsThisWeek: 0, hintsLastWeek: 100 },
      { tasksAttempted: 100, tasksNoHint: 100, hintsThisWeek: 0, hintsLastWeek: 100 },
    ];
    cases.forEach(c => expect(inRange(calcReliance(c).total)).toBe(true));
  });
});

/* ═══════════════════════════════════════════════════════════
   PERSEVERANCE
   ═════════════════════════════════════════════════════════ */
describe('calcPerseverance', () => {
  it('normal values: 4/5 retried succeeded, avg 2.4 retries', () => {
    const r = calcPerseverance({ retriedCount: 5, eventualSuccess: 4, avgRetries: 2.4 });
    expect(r.successRate).toBeCloseTo(80, 0);
    expect(r.rangeFit).toBe(35);     // 2.4 ∈ [2.0, 3.2]
    expect(r.total).toBe(87);        // 52 + 35
  });

  it('retry success: all retried tasks eventually solved', () => {
    const r = calcPerseverance({ retriedCount: 3, eventualSuccess: 3, avgRetries: 2.5 });
    expect(r.successRate).toBe(100);
    expect(r.base).toBe(65);
    expect(r.total).toBe(100);
  });

  it('failed retry: retried but never solved', () => {
    const r = calcPerseverance({ retriedCount: 5, eventualSuccess: 0, avgRetries: 2.5 });
    expect(r.successRate).toBe(0);
    expect(r.base).toBe(0);
    expect(r.total).toBe(35);   // only rangeFit contributes
  });

  it('zero retriedCount → firstTryOnly flag, no NaN', () => {
    const r = calcPerseverance({ retriedCount: 0, eventualSuccess: 0, avgRetries: 0 });
    expect(noNaN(r)).toBe(true);
    expect(r.firstTryOnly).toBe(true);
    expect(r.base).toBe(65);
    expect(r.total).toBeGreaterThan(0);
  });

  it('eventualSuccess > retriedCount → clamped to retriedCount', () => {
    const r = calcPerseverance({ retriedCount: 3, eventualSuccess: 10, avgRetries: 2 });
    expect(r.successRate).toBe(100);   // clamped → 3/3 = 100%
    expect(r.total).toBe(100);
  });

  it('avgRetries at ideal lower boundary (2.0) → full rangeFit', () => {
    const r = calcPerseverance({ retriedCount: 4, eventualSuccess: 4, avgRetries: 2.0 });
    expect(r.rangeFit).toBe(35);
  });

  it('avgRetries at ideal upper boundary (3.2) → full rangeFit', () => {
    const r = calcPerseverance({ retriedCount: 4, eventualSuccess: 4, avgRetries: 3.2 });
    expect(r.rangeFit).toBe(35);
  });

  it('avgRetries too high (6) → reduced rangeFit, still >= 0', () => {
    const r = calcPerseverance({ retriedCount: 2, eventualSuccess: 2, avgRetries: 6 });
    expect(r.rangeFit).toBeGreaterThanOrEqual(0);
    expect(r.rangeFit).toBeLessThan(35);
  });

  it('negative retriedCount → treated as 0, firstTryOnly', () => {
    const r = calcPerseverance({ retriedCount: -3, eventualSuccess: 2, avgRetries: 2 });
    expect(noNaN(r)).toBe(true);
    expect(r.firstTryOnly).toBe(true);
  });

  it('total always in [0, 100]', () => {
    const cases = [
      { retriedCount: 0 },
      { retriedCount: 1, eventualSuccess: 1, avgRetries: 1 },
      { retriedCount: 10, eventualSuccess: 10, avgRetries: 3 },
      { retriedCount: 10, eventualSuccess: 0, avgRetries: 10 },
    ];
    cases.forEach(c => expect(inRange(calcPerseverance(c).total)).toBe(true));
  });
});

/* ═══════════════════════════════════════════════════════════
   CONFIDENCE
   ═════════════════════════════════════════════════════════ */
describe('calcConfidence', () => {
  it('normal values: 5 entries, 1 hard task', () => {
    const cal = [
      { rated: 4, actual: 3, difficulty: 3 },
      { rated: 2, actual: 2, difficulty: 2 },
      { rated: 5, actual: 4, difficulty: 2 },
      { rated: 3, actual: 2, difficulty: 2 },
      { rated: 4, actual: 4, difficulty: 2 },
    ];
    const r = calcConfidence(cal);
    expect(r.avgErr).toBeCloseTo(0.6, 1);
    expect(r.hardBonus).toBe(4);     // 1 entry with difficulty >= 3
    expect(r.total).toBeGreaterThan(0);
    expect(inRange(r.total)).toBe(true);
  });

  it('empty calibration → total = 0 with insufficient flag', () => {
    const r = calcConfidence([]);
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
    expect(r.insufficient).toBe(true);
  });

  it('undefined calibration → total = 0', () => {
    const r = calcConfidence(undefined);
    expect(noNaN(r)).toBe(true);
    expect(r.total).toBe(0);
  });

  it('perfect calibration: rated === actual every time', () => {
    const cal = [
      { rated: 3, actual: 3, difficulty: 2 },
      { rated: 5, actual: 5, difficulty: 3 },
    ];
    const r = calcConfidence(cal);
    expect(r.avgErr).toBe(0);
    expect(r.calibScore).toBe(100);
    expect(r.hardBonus).toBe(4);
    expect(r.total).toBeCloseTo(84, 0);  // 80 + 4
  });

  it('hardBonus tied to difficulty >= 3, NOT to rated >= 4', () => {
    const allHighRated = [
      { rated: 5, actual: 4, difficulty: 1 },
      { rated: 4, actual: 4, difficulty: 2 },
    ];
    const withHardTask = [
      { rated: 2, actual: 3, difficulty: 3 },
      { rated: 1, actual: 1, difficulty: 2 },
    ];
    const r1 = calcConfidence(allHighRated);
    const r2 = calcConfidence(withHardTask);
    expect(r1.hardBonus).toBe(0);   // no difficulty >= 3
    expect(r2.hardBonus).toBe(4);   // 1 hard task despite low self-rating
  });

  it('hardBonus capped at 20 regardless of hard-task count', () => {
    const cal = Array.from({ length: 10 }, (_, i) => ({
      rated: 3, actual: 3, difficulty: 3,
    }));
    const r = calcConfidence(cal);
    expect(r.hardBonus).toBe(20);
  });

  it('invalid rated out of range → entry skipped', () => {
    const cal = [
      { rated: 0, actual: 3, difficulty: 2 },   // invalid (< 1)
      { rated: 6, actual: 3, difficulty: 2 },   // invalid (> 5)
      { rated: 3, actual: 3, difficulty: 2 },   // valid
    ];
    const r = calcConfidence(cal);
    expect(noNaN(r)).toBe(true);
    expect(r.avgErr).toBe(0);   // only valid entry, |3-3|=0
  });

  it('missing difficulty → defaults to 1, no hardBonus', () => {
    const cal = [{ rated: 4, actual: 4 }];  // no difficulty field
    const r = calcConfidence(cal);
    expect(r.hardBonus).toBe(0);
  });

  it('total always in [0, 100]', () => {
    const cases = [
      [{ rated: 1, actual: 5, difficulty: 3 }],                          // large error
      [{ rated: 5, actual: 1, difficulty: 3 }],                          // large error
      Array.from({ length: 5 }, () => ({ rated: 5, actual: 5, difficulty: 3 })),  // perfect + hard
    ];
    cases.forEach(c => expect(inRange(calcConfidence(c).total)).toBe(true));
  });
});

/* ═══════════════════════════════════════════════════════════
   NaN / Infinity safety net
   ═════════════════════════════════════════════════════════ */
describe('NaN and Infinity safety', () => {
  it('calcConcentration with NaN inputs returns all-finite result', () => {
    const r = calcConcentration({ focusSeconds: NaN, totalSeconds: NaN });
    expect(noNaN(r)).toBe(true);
  });

  it('calcReliance with Infinity inputs returns all-finite result', () => {
    const r = calcReliance({ tasksAttempted: Infinity, tasksNoHint: Infinity });
    expect(noNaN(r)).toBe(true);
  });

  it('calcPerseverance with NaN avgRetries returns all-finite result', () => {
    const r = calcPerseverance({ retriedCount: 5, eventualSuccess: 3, avgRetries: NaN });
    expect(noNaN(r)).toBe(true);
  });

  it('calcConfidence with NaN rated returns all-finite result', () => {
    const r = calcConfidence([{ rated: NaN, actual: 3, difficulty: 2 }]);
    expect(noNaN(r)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════
   POST /api/metrics/compute (integration)
   ═════════════════════════════════════════════════════════ */
const request = require('supertest');
const app     = require('../backend/server');

describe('POST /api/metrics/compute', () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'rahul_singh', password: 'pass' });
    token = res.body.token;
  });

  it('returns all 5 scores for valid payload', async () => {
    const res = await request(app)
      .post('/api/metrics/compute')
      .set('Authorization', `Bearer ${token}`)
      .send({
        today:       { focusSeconds: 1080, totalSeconds: 1200, tabSwitches: 1, correctStreak: 3 },
        week:        { tasksAttempted: 14, tasksNoHint: 11, hintsThisWeek: 6, hintsLastWeek: 11 },
        retries:     { retriedCount: 5, eventualSuccess: 4, avgRetries: 2.4 },
        calibration: [{ rated: 4, actual: 3, difficulty: 3 }],
      });
    expect(res.status).toBe(200);
    const s = res.body.scores;
    expect(s).toHaveProperty('concentration');
    expect(s).toHaveProperty('reliance');
    expect(s).toHaveProperty('perseverance');
    expect(s).toHaveProperty('confidence');
    expect(s).toHaveProperty('character');
    Object.values(s).forEach(m => {
      expect(Number.isFinite(m.total)).toBe(true);
      expect(m.total).toBeGreaterThanOrEqual(0);
      expect(m.total).toBeLessThanOrEqual(100);
    });
  });

  it('handles zero-session payload without NaN', async () => {
    const res = await request(app)
      .post('/api/metrics/compute')
      .set('Authorization', `Bearer ${token}`)
      .send({ today: {}, week: {}, retries: {}, calibration: [] });
    expect(res.status).toBe(200);
    const s = res.body.scores;
    Object.values(s).forEach(m => expect(Number.isFinite(m.total)).toBe(true));
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/metrics/compute').send({});
    expect(res.status).toBe(401);
  });
});
