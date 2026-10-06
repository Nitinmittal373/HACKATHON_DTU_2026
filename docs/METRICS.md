# Metrics Explained

> *"We want that education by which character is formed, strength of mind is increased, and by which one can stand on one's own feet."* — Swami Vivekananda

Shastra tracks five metrics derived entirely from behavioural signals during a session. No test score, no comparison to peers.

All scores are computed exclusively by `backend/routes/metrics.js` and returned by `POST /api/metrics/compute`. The frontend displays the numbers but performs no calculation — there is a single authoritative implementation.

---

## 1. 🔥 Concentration (एकाग्रता)

**What it measures**: Sustained focus and freedom from distraction during a task.

**Signals used**:
- `focusSeconds` — time the student was actively on the task (tab was visible)
- `totalSeconds` — total session duration from task selection to submission
- `tabSwitches` — how many times they switched away (tab hidden)
- `correctStreak` — consecutive correct answers

**Formula**:
```
focusPct       = clamp(focusSeconds, 0, totalSeconds) / totalSeconds × 100
base           = focusPct × 0.6
switchPenalty  = min(tabSwitches × 4, 15)
streakBonus    = min(correctStreak × 5, 25)

Concentration  = clamp(base − switchPenalty + streakBonus, 0, 100)
```

**Guards**:
- `totalSeconds = 0` → score is **0** (no session data; not a division)
- `focusSeconds > totalSeconds` → clamped to `totalSeconds`
- Negative inputs → treated as 0

**Example**:
- 1080/1200 s focus (90%) → base = 54
- 1 tab switch → −4
- 3-answer streak → +15
- **Score = 65**

---

## 2. 🌳 Self-Reliance (आत्मनिर्भरता)

**What it measures**: The ability to work through problems independently.

**Signals used**:
- `tasksNoHint` — tasks completed without requesting a hint this week
- `tasksAttempted` — total tasks attempted this week
- `hintsThisWeek` / `hintsLastWeek` — hint usage trend

**Formula**:
```
noHintRatio   = clamp(tasksNoHint, 0, tasksAttempted) / tasksAttempted
base          = noHintRatio × 70

hintDrop      = (hintsLastWeek − hintsThisWeek) / hintsLastWeek
trendBonus    = max(0, hintDrop) × 30    ← only rewards reduction, never penalises increase

Self-Reliance = clamp(base + trendBonus, 0, 100)
```

**Guards**:
- `tasksAttempted = 0` → score is **0**, flag `insufficient: true` (no data this week)
- `tasksNoHint > tasksAttempted` → clamped to `tasksAttempted`
- `hintsLastWeek = 0` → `trendBonus = 0` (no measurable improvement)
- Negative inputs → treated as 0

**Why trendBonus?** We reward *improvement*. A student who used 11 hints last week but only 6 this week is growing in independence.

**Example**:
- 11/14 hint-free (78.6%) → base = 55.0
- 5/11 hint reduction (45.5%) → trendBonus = 13.6
- **Score = 68.6**

---

## 3. ⚡ Perseverance (दृढ़ता)

**What it measures**: Healthy resilience — trying again after failure, but not grinding endlessly.

**Signals used**:
- `retriedCount` — tasks attempted again after a first wrong answer
- `eventualSuccess` — of those retried tasks, how many were eventually solved
- `avgRetries` — average number of retries per retried task

**Formula**:
```
successRate  = clamp(eventualSuccess, 0, retriedCount) / retriedCount
base         = successRate × 65

rangeFit     = 35   if avgRetries ∈ [2.0, 3.2]
             = max(0, 35 − |avgRetries − 2.5| × 12)   otherwise

Perseverance = clamp(base + rangeFit, 0, 100)
```

**Guards**:
- `retriedCount = 0` → student solved all tasks on the **first attempt**; return `base = 65`, `rangeFit` for `avgRetries = 0` (= 5), `total = 70`, flag `firstTryOnly: true`. Score is meaningful but not perfect — perseverance is specifically about recovering from failure.
- `eventualSuccess > retriedCount` → clamped to `retriedCount`
- Negative inputs → treated as 0

**Why the range [2.0, 3.2]?** One retry often means the student guessed. More than ~4 without progress suggests frustration. Thoughtful, strategic retrying sits in the sweet spot.

**Example**:
- 4/5 retried tasks solved (80%) → base = 52
- Average retries = 2.4 (ideal range) → rangeFit = 35
- **Score = 87**

---

## 4. ⭐ Confidence (आत्मविश्वास)

**What it measures**: How accurately a student assesses their own ability — the gap between their pre-task self-rating (1–5 stars) and their actual performance.

**Signals used**:
- `calibration[]` — array of `{ rated, actual, difficulty }` from recent tasks
  - `rated`: student's pre-task confidence (1–5)
  - `actual`: actual performance score (1–5)
  - `difficulty`: task difficulty from the task bank (1–3)

**Formula**:
```
avgAbsError  = mean(|rated − actual|) over valid calibration entries
calibScore   = max(0, 100 − avgAbsError × 22)
hardBonus    = min(count(difficulty ≥ 3) × 4, 20)

Confidence   = clamp(calibScore × 0.8 + hardBonus, 0, 100)
```

**Guards**:
- Empty `calibration` → score is **0**, flag `insufficient: true`
- Entries with `rated` or `actual` outside [1, 5] → **skipped**
- Missing `difficulty` → treated as **1** (not a hard task)

**hardBonus is tied to actual task difficulty, not to high self-rating.** A student who attempts hard tasks (difficulty ≥ 3 in the task bank) earns the bonus whether they rated themselves high or low. Previously this bonus was incorrectly tied to `rated ≥ 4`.

**Example** (5 sessions, 1 hard task):
- Avg error = 0.6 → calibScore = 86.8
- 1 hard task (difficulty 3) → hardBonus = 4
- **Score = 73.4** (86.8 × 0.8 + 4)

---

## 5. 🛡️ Character (चरित्र) — The Composite

**What it measures**: The holistic picture of a student's inner development.

**Formula**:
```
Character = (Concentration + Self-Reliance + Perseverance + Confidence) / 4
```

All four pillars are weighted equally. A student who scores 65, 69, 87, 73 respectively receives:

```
Character = (65 + 69 + 87 + 73) / 4 = 73.5
```

---

## Design Principles

1. **No comparison to peers** — every score is computed from the student's own data only.
2. **Single source of truth** — backend computes; frontend only displays.
3. **No NaN or Infinity** — every division is guarded; impossible inputs are clamped.
4. **Transparency** — every number is explained step by step in the UI and documented here.
5. **Growth over outcome** — trend bonuses reward improvement, not just high absolute scores.
6. **Healthy middle ground** — extremes are penalised (e.g., zero retries or ten retries per task).
7. **Difficulty-aware** — hard-task bonus uses the task bank's `difficulty` field, not the student's self-assessment.

---

## Edge-Case Handling Summary

| Situation | Metric affected | Behaviour |
|---|---|---|
| `totalSeconds = 0` | Concentration | Returns 0 |
| `focusSeconds > totalSeconds` | Concentration | Clamps focus to total |
| `tasksAttempted = 0` | Self-Reliance | Returns 0, `insufficient: true` |
| `tasksNoHint > tasksAttempted` | Self-Reliance | Clamps no-hint to attempted |
| `hintsLastWeek = 0` | Self-Reliance | `trendBonus = 0` |
| `retriedCount = 0` | Perseverance | Returns ~70, `firstTryOnly: true` |
| `eventualSuccess > retriedCount` | Perseverance | Clamps success to retried |
| Empty `calibration` | Confidence | Returns 0, `insufficient: true` |
| Invalid `rated`/`actual` | Confidence | Entry skipped |
| Missing `difficulty` | Confidence | Treated as 1 (easy) |
| Any NaN/Infinity input | All | Sanitised to 0 |
