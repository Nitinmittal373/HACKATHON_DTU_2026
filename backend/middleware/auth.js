const jwt = require('jsonwebtoken');

/**
 * Middleware: verify JWT and attach payload to req.user
 * Usage: router.get('/protected', authMiddleware, handler)
 */
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: require teacher role
 * Usage: router.get('/class', authMiddleware, requireTeacher, handler)
 */
function requireTeacher(req, res, next) {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
}

module.exports = { authMiddleware, requireTeacher };
