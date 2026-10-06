# ॐ Shastra — Awakening Education

> *"Education is the manifestation of the perfection already in man."* — Swami Vivekananda

A Vivekananda-themed education platform that measures **character over marks** — tracking Concentration, Self-Reliance, Perseverance, and Confidence as the four pillars of a student's growth.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Nitinmittal373/HACKATHON_DTU_2026.git
cd HACKATHON_DTU_2026

# 2. Frontend — open directly, zero setup
open frontend/index.html

# 3. Backend (Node.js)
cd backend && cp .env.example .env && npm install && npm run dev
# → http://localhost:5000
```

**Demo accounts** · Student: `rahul_singh / pass` · Teacher: `teacher_priya / pass`

---

## What We Measure

| Metric | Measures |
|--------|----------|
| 🔥 Concentration (एकाग्रता) | Focus time, tab switches, correct streaks |
| 🌳 Self-Reliance (आत्मनिर्भरता) | Hint-free task ratio, week-over-week improvement |
| ⚡ Perseverance (दृढ़ता) | Retry-to-success rate, healthy retry range |
| ⭐ Confidence (आत्मविश्वास) | Gap between self-rating and actual performance |
| 🛡️ **Character** (चरित्र) | Composite — equal 25% weight of all four |

---

## Tech Stack

| | Tech |
|-|------|
| Frontend | Vanilla HTML · CSS custom properties · Vanilla JS |
| Backend | Node.js · Express.js · JWT |
| Database | MongoDB (Mongoose) |
| Alt backend | Python · Flask (in `src/backend/`) |

---

## Docs

| File | Contents |
|------|----------|
| [docs/README.md](docs/README.md) | Full project overview |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, file map |
| [docs/API.md](docs/API.md) | All API endpoints with examples |
| [docs/SETUP.md](docs/SETUP.md) | Step-by-step local setup |
| [docs/METRICS.md](docs/METRICS.md) | Formula deep-dive for all 5 metrics |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Git workflow, commit style |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy to Netlify / Railway / Fly.io |

---

## Project Structure

```
HACKATHON_DTU_2026/
├── frontend/           Vanilla HTML/CSS/JS UI
│   ├── index.html
│   ├── css/theme.css       Design tokens (saffron, maroon, gold)
│   ├── css/components.css  All component styles
│   └── js/app.js           Data, formulas, charts, screens
│
├── backend/            Node.js / Express API
│   ├── server.js
│   ├── routes/         auth · students · tasks · metrics
│   ├── models/         Student (Mongoose schema)
│   ├── middleware/     JWT auth
│   └── config/         MongoDB connection
│
├── src/                Original Flask implementation
│   ├── frontend/       Split HTML/CSS/JS version
│   └── backend/        Python/Flask API
│
├── docs/               7 documentation files
├── tests/
├── package.json
└── LICENSE
```

---

## Team

| Name | Role |
|------|------|
|      |      |

---

## License

MIT — see [LICENSE](./LICENSE)
