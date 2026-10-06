const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';

/* Demo accounts — replace with DB lookup in production */
const DEMO_USERS = {
  rahul_singh:   { password: 'pass', role: 'student', name: 'Rahul Singh' },
  teacher_priya: { password: 'pass', role: 'teacher', name: 'Priya Sharma' }
};

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, role, name }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = DEMO_USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, role: user.role, name: user.name, username });
});

/**
 * POST /api/auth/logout
 * Stateless JWT — client simply discards the token
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Requires Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

module.exports = router;
