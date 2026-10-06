const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const dotenv     = require('dotenv');
const path       = require('path');
const { connectDB } = require('./config/database');

dotenv.config();

/* ── Startup guards ── */
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable must be set in production. Refusing to start.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set — using insecure development fallback. Set JWT_SECRET before deploying.');
}

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── CORS ── */
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, ...DEV_ORIGINS]
  : DEV_ORIGINS;

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin and file:// requests (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

/* ── Body parsing ── */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ── Serve frontend ── */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ── API routes ── */
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/metrics',  require('./routes/metrics'));

/* ── Health check ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Shastra' }));

/* ── SPA fallback — only for non-API routes ── */
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  ॐ  Shastra running on http://localhost:${PORT}`);
    console.log(`     Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});

module.exports = app;
