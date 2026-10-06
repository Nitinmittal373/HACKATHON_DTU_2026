const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const dotenv     = require('dotenv');
const path       = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
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

/* ── SPA fallback ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n  ॐ  Shastra running on http://localhost:${PORT}`);
  console.log(`     Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
