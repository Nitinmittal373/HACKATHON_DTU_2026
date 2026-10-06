# Deployment Guide

## Frontend — Netlify / Vercel / GitHub Pages

The frontend is pure static HTML/CSS/JS — no build step required.

### Netlify (recommended)

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Set **Publish directory** to `frontend`
4. Deploy

### Vercel

```bash
npm install -g vercel
cd frontend
vercel
```

### GitHub Pages

In your repo settings → Pages → Source: deploy from branch `main`, folder `/frontend`.

---

## Backend — Railway / Render / Fly.io

### Railway (easiest)

1. Go to [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub"
2. Select the repo
3. Set **Root directory** to `backend`
4. Add environment variables (see below)
5. Railway auto-detects Node.js and runs `npm start`

### Render

1. New Web Service → connect repo
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables

### Fly.io

```bash
cd backend
fly launch
fly secrets set JWT_SECRET=your_secret MONGODB_URI=your_uri
fly deploy
```

---

## Environment Variables (Production)

Set these in your hosting platform's dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shastra
JWT_SECRET=<long random string — use: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.netlify.app
```

---

## MongoDB Atlas (Free Tier)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. Database Access → Add a user with read/write permissions
4. Network Access → Allow access from anywhere (`0.0.0.0/0`) for hackathon
5. Connect → Drivers → copy the connection string into `MONGODB_URI`

---

## Full-Stack on a Single Server

If you want frontend + backend on one server:

```nginx
# nginx config
server {
    listen 80;
    server_name yourdomain.com;

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
    }

    # Frontend
    location / {
        root /var/www/shastra/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Health Check

After deployment, verify:

```bash
curl https://your-backend.railway.app/api/health
# { "status": "ok", "app": "Shastra" }
```
