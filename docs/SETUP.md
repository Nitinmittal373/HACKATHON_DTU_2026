# Local Development Setup

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MongoDB | ≥ 7 (optional) | `mongod --version` |
| Git | any | `git --version` |

> MongoDB is optional — the app runs with in-memory demo data if no database is connected.

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/Nitinmittal373/HACKATHON_DTU_2026.git
cd HACKATHON_DTU_2026
```

---

## Step 2 — Frontend (zero setup)

Open directly in your browser — no build step:

```bash
# macOS / Linux
open frontend/index.html

# Windows
start frontend/index.html
```

Or use a simple static server:
```bash
npx serve frontend -p 3000
# open http://localhost:3000
```

---

## Step 3 — Backend

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run dev                 # nodemon — auto-restarts on changes
```

The server starts at `http://localhost:5000`.  
The frontend is served from the same origin — no CORS issues.

---

## Step 4 — MongoDB (optional)

```bash
# Start local MongoDB
mongod --dbpath ./data/db

# Or use MongoDB Atlas — paste the connection string into .env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shastra
```

If `MONGODB_URI` is not set or the connection fails, the app falls back to in-memory demo data automatically.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `MONGODB_URI` | `mongodb://localhost:27017/shastra` | MongoDB connection |
| `JWT_SECRET` | `dev-secret` | **Change in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `*` | CORS origin |

---

## Verify Everything Works

```bash
curl http://localhost:5000/api/health
# { "status": "ok", "app": "Shastra" }

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rahul_singh","password":"pass"}'
# { "token": "...", "role": "student", ... }
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| `Cannot find module 'express'` | Run `npm install` in `backend/` |
| Port 5000 already in use | Change `PORT=5001` in `.env` |
| MongoDB connection error | App still works — uses demo data |
| Font not loading | Check internet connection (Google Fonts CDN) |
