# Metrics Explained

> *"We want that education by which character is formed, strength of mind is increased, and by which one can stand on one's own feet."* — Swami Vivekananda

Shastra tracks five metrics derived entirely from behavioural signals during a session. No test score, no comparison to peers.

---

## 1. 🔥 Concentration (एकाग्रता)

**What it measures**: Sustained focus and freedom from distraction during a task.

**Signals used**:
- `focusSeconds` — time the student was actively on the task
- `totalSeconds` — total session duration
- `tabSwitches` — how many times they switched away
- `correctStreak` — consecutive correct answers

**Formula**:
```
base           = (focusSeconds / totalSeconds) × 60
switchPenalty  = min(tabSwitches × 4, 15)
streakBonus    = min(correctStreak × 5, 25)

Concentration  = clamp(base − switchPenalty + streakBonus, 0, 100)
```

**Example**:  
1080/1200 seconds of focus (90%) → base = 54  
1 tab switch → −4  
3-answer streak → +15  
**Score = 65**

---

## 2. 🌳 Self-Reliance (आत्मनिर्भरता)

**What it measures**: The ability to work through problems independently.

**Signals used**:
- `tasksNoHint` — tasks completed without requesting a hint
- `tasksAttempted` — total tasks attempted this week
- `hintsThisWeek` / `hintsLastWeek` — hint usage trend

**Formula**:
```
noHintRatio  = tasksNoHint / tasksAttempted
base         = noHintRatio × 70

hintDrop     = (hintsLastWeek − hintsThisWeek) / hintsLastWeek
trendBonus   = max(0, hintDrop) × 30

Self-Reliance = clamp(base + trendBonus, 0, 100)
```

**Why trendBonus?**: We reward *improvement*. A student who used 11 hints last week but only 6 this week is growing.

---

## 3. ⚡ Perseverance (दृढ़ता)

**What it measures**: Healthy resilience — trying again after failure, but not giving up too easily or grinding endlessly.

**Signals used**:
- `retriedCount` — tasks attempted again after failure
- `eventualSuccess` — of those, how many eventually succeeded
- `avgRetries` — average retries per task

**Formula**:
```
successRate = eventualSuccess / retriedCount
base        = successRate × 65

rangeFit    = 35   (if avgRetries ∈ [2.0, 3.2])
            = max(0, 35 − |avgRetries − 2.5| × 12)   (otherwise)

Perseverance = clamp(base + rangeFit, 0, 100)
```

**Why the range [2, 3.2]?**: One retry often means the student guessed. More than 4 without progress suggests frustration, not learning. The sweet spot is thoughtful, strategic retrying.

---

## 4. ⭐ Confidence (आत्मविश्वास)

**What it measures**: How accurately a student assesses their own ability — the gap between their self-rating (1–5 stars before the task) and their actual performance.

**Signals used**:
- `calibration[]` — array of `{ rated, actual }` pairs from recent tasks
- Hard-task attempts — tasks rated ≥ 4 stars before starting

**Formula**:
```
avgAbsError  = average of |rated − actual| across all tasks
calibScore   = max(0, 100 − avgAbsError × 22)
hardBonus    = min(count(rated ≥ 4) × 4, 20)

Confidence   = clamp(calibScore × 0.8 + hardBonus, 0, 100)
```

**Why hardBonus?**: Students who voluntarily attempt challenging tasks — even if they overestimate — show healthier confidence than those who only pick easy tasks.

---

## 5. 🛡️ Character (चरित्र) — The Composite

**What it measures**: The holistic picture of a student's inner development.

**Formula**:
```
Character = (Concentration + Self-Reliance + Perseverance + Confidence) / 4
```

All four pillars are weighted equally. A student who scores 65, 69, 87, 74 respectively receives:

```
Character = (65 + 69 + 87 + 74) / 4 = 73.75 ≈ 73.8
```

---

## Design Principles

1. **No comparison to peers** — every score is computed from the student's own data only.
2. **Transparency** — every number is explained step by step in the UI.
3. **Growth over outcome** — trend bonuses reward improvement, not just high absolute scores.
4. **Healthy middle ground** — extremes are penalised (e.g., too few retries or too many).
