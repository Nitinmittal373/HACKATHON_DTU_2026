# Architecture

## Overview

```
Browser (frontend/)
    │  HTML/CSS/JS — no build step
    │
    ▼
Express Server (backend/server.js)
    ├── /api/auth      → routes/auth.js
    ├── /api/students  → routes/students.js
    ├── /api/tasks     → routes/tasks.js
    ├── /api/metrics   → routes/metrics.js
    └── static files   → frontend/
    │
    ▼
MongoDB (mongoose)
    └── students collection
```

---

## Data Flow — Student Session

```
1. Student opens a task
        │
2. Focus timer starts (JS setInterval)
        │
3. Student submits answer
        │
4. POST /api/tasks/:id/submit
   → returns { correct, feedback }
        │
5. POST /api/students/:id/sessions
   → logs { focusSeconds, tabSwitches, hintsUsed, selfRating, outcome }
        │
6. POST /api/metrics/compute
   → returns { concentration, reliance, perseverance, confidence, character }
        │
7. Dashboard re-renders with new scores
```

---

## Score Calculation Flow

```
Raw session data
    │
    ├── today  →  calcConcentration()  →  C score (0–100)
    ├── week   →  calcReliance()       →  R score (0–100)
    ├── retries→  calcPerseverance()   →  P score (0–100)
    └── calib  →  calcConfidence()     →  CO score (0–100)
                         │
                  calcCharacter(C, R, P, CO)
                         │
                  CH = (C+R+P+CO) / 4
```

Formulas live in two places — keep them in sync:
- **Frontend**: `frontend/js/app.js` (runs in-browser for instant feedback)
- **Backend**: `backend/routes/metrics.js` (canonical source for stored scores)

---

## File Structure

```
HACKATHON_DTU_2026/
├── frontend/
│   ├── index.html          SPA entry point
│   ├── css/
│   │   ├── theme.css       Design tokens + base reset
│   │   └── components.css  Component styles
│   ├── js/
│   │   └── app.js          Data, formulas, charts, screens
│   └── assets/             Images, icons (future)
│
├── backend/
│   ├── server.js           Express app + middleware setup
│   ├── routes/
│   │   ├── auth.js         POST /login, /logout, GET /me
│   │   ├── students.js     CRUD + session logging
│   │   ├── tasks.js        Task bank + submission + hints
│   │   └── metrics.js      Score computation + formula docs
│   ├── models/
│   │   └── Student.js      Mongoose schema
│   ├── middleware/
│   │   └── auth.js         JWT verification middleware
│   └── config/
│       └── database.js     MongoDB connection helper
│
├── src/                    Original split implementation (Flask)
├── docs/                   This folder
├── tests/
├── README.md
└── package.json
```

---

## Frontend ↔ Backend Contract

All API calls use `Content-Type: application/json`.  
Authenticated endpoints require `Authorization: Bearer <token>` header.

See [API.md](./API.md) for the full reference.
