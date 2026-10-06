const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();

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
    process.env.JWT_SECRET || 'dev-secret',
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
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'dev-secret');
    res.json({ username: payload.username, role: payload.role });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
