# Shastra — Awakening Education

A Vivekananda-themed education platform that measures character over marks — tracking Concentration, Self-Reliance, Perseverance, and Confidence as the four pillars of a student's growth.

## Problem
Traditional grading systems measure outcomes, not effort or character development. Students who struggle but persist are penalised alongside those who don't try.

## Solution
Shastra computes four behavioural scores from real session data (focus time, hint usage, retry patterns, self-assessment accuracy) and surfaces a holistic "Character Score" for both students and teachers.

## Tech Stack
- **Frontend:** Vanilla HTML · CSS custom properties · Vanilla JS
- **Backend:** Python · Flask · flask-cors
- **Fonts:** Playfair Display, Hind, IBM Plex Mono (Google Fonts)

## Getting Started

```bash
git clone <repo-url>
cd HACKATHON_DTU_2026
cp .env.example .env

# Frontend — open directly in browser (no build step)
open src/frontend/index.html

# Backend
cd src/backend
pip install -r requirements.txt
python app.py          # serves on http://localhost:5000
```

## Folder Structure

```
src/
  frontend/
    index.html              entry point
    css/
      styles.css            Vivekananda design system (tokens + components)
    js/
      data.js               sample data, score formulas, SVG portraits
      charts.js             canvas line + bar chart helpers
      app.js                UI render functions (login / student / teacher)
  backend/
    app.py                  Flask entry point — serves frontend + /api/*
    requirements.txt
    routes/
      analytics.py          POST /api/student/:id/scores
    models/
      student.py            Student dataclass
    utils/
      calculations.py       score formulas (mirrors frontend data.js)
docs/                       notes, architecture, pitch deck
assets/                     images, diagrams, static files
tests/                      unit + integration tests
```

## Scores Explained

| Score | Measures | Key signals |
|-------|----------|-------------|
| Concentration | Sustained focus | Focus-time %, tab switches, answer streaks |
| Self-Reliance | Independent work | Hint-free task ratio, week-over-week hint reduction |
| Perseverance  | Healthy resilience | Retry-to-success rate, retry count in healthy 2–3.2 range |
| Confidence    | Self-awareness | Gap between self-rating and actual performance |
| **Character** | Composite | Equal 25% weight of all four above |

## API

```
POST /api/student/:id/scores
Content-Type: application/json

{
  "today":       { "focusSeconds": 1080, "totalSeconds": 1200, "tabSwitches": 1, "correctStreak": 3 },
  "week":        { "tasksAttempted": 14, "tasksNoHint": 11, "hintsThisWeek": 6, "hintsLastWeek": 11 },
  "retries":     { "retriedCount": 5, "eventualSuccess": 4, "avgRetries": 2.4 },
  "calibration": [ { "rated": 4, "actual": 3 }, ... ]
}
```

## Team

| Name | Role |
|------|------|
|      |      |

## License
MIT
