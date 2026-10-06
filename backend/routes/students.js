const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const { authMiddleware, requireTeacher } = require('../middleware/auth');
const Student  = require('../models/Student');

/* In-memory demo roster — used when MongoDB is unavailable */
const DEMO_STUDENTS = [
  { id: 'rahul_singh',  name: 'Rahul Singh',  class: '8B', trend: [61,66,70,74,78] },
  { id: 'priya_nair',   name: 'Priya Nair',   class: '8B', trend: [60,58,55,52,44] },
  { id: 'arjun_mehta',  name: 'Arjun Mehta',  class: '8B', trend: [78,80,83,87,89] },
  { id: 'sana_qureshi', name: 'Sana Qureshi', class: '8B', trend: [60,62,65,66,67] },
  { id: 'vikram_rao',   name: 'Vikram Rao',   class: '8B', trend: [55,57,59,61,62] }
];

const dbReady = () => mongoose.connection.readyState === 1;

/**
 * GET /api/students
 * Returns all students (teacher only)
 */
router.get('/', authMiddleware, requireTeacher, async (req, res) => {
  if (dbReady()) {
    try {
      const students = await Student.find({ role: 'student' }, 'username name class');
      return res.json({ students: students.map(s => ({ id: s.username, name: s.name, class: s.class })) });
    } catch (err) {
      console.error('DB error in GET /students:', err.message);
    }
  }
  res.json({ students: DEMO_STUDENTS.map(({ id, name, class: cls }) => ({ id, name, class: cls })) });
});

/**
 * GET /api/students/:id
 * Returns one student's profile
 */
router.get('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;

  if (dbReady()) {
    try {
      const student = await Student.findOne({ username: id }, 'username name class sessions');
      if (student) {
        return res.json({ id: student.username, name: student.name, class: student.class });
      }
    } catch (err) {
      console.error('DB error in GET /students/:id:', err.message);
    }
  }

  const demo = DEMO_STUDENTS.find(s => s.id === id);
  if (!demo) return res.status(404).json({ error: 'Student not found' });
  res.json(demo);
});

/**
 * GET /api/students/:id/sessions
 * Returns a student's session history
 */
router.get('/:id/sessions', authMiddleware, async (req, res) => {
  const id = req.params.id;

  if (dbReady()) {
    try {
      const student = await Student.findOne({ username: id }, 'sessions');
      if (student) {
        return res.json({ studentId: id, sessions: student.sessions });
      }
    } catch (err) {
      console.error('DB error in GET /students/:id/sessions:', err.message);
    }
  }

  res.json({ studentId: id, sessions: [] });
});

/**
 * POST /api/students/:id/sessions
 * Logs a completed task session.
 * Body: { taskId, focusSeconds, totalSeconds, tabSwitches, correctStreak,
 *         hintsUsed, selfRating, outcome, attempts }
 */
router.post('/:id/sessions', authMiddleware, async (req, res) => {
  const studentId = req.params.id;

  /* Students can only log their own sessions */
  if (req.user.role === 'student' && req.user.username !== studentId) {
    return res.status(403).json({ error: 'Cannot log sessions for another student' });
  }

  const {
    taskId, focusSeconds, totalSeconds, tabSwitches,
    correctStreak, hintsUsed, selfRating, outcome, attempts,
  } = req.body;

  /* ── Validation ── */
  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'taskId is required' });
  }

  const rating = Number(selfRating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'selfRating must be an integer 1–5' });
  }

  const numFields = { focusSeconds, totalSeconds, tabSwitches, hintsUsed, attempts };
  for (const [key, val] of Object.entries(numFields)) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: `${key} must be a non-negative number` });
    }
  }

  const validOutcomes = ['solved', 'failed', 'abandoned'];
  if (!validOutcomes.includes(outcome)) {
    return res.status(400).json({ error: `outcome must be one of: ${validOutcomes.join(', ')}` });
  }

  const sessionData = {
    taskId,
    focusSeconds:  Math.round(Number(focusSeconds)),
    totalSeconds:  Math.round(Number(totalSeconds)),
    tabSwitches:   Math.round(Number(tabSwitches)),
    correctStreak: Math.round(Math.max(0, Number(correctStreak || 0))),
    hintsUsed:     Math.round(Number(hintsUsed)),
    selfRating:    rating,
    outcome,
    attempts:      Math.max(1, Math.round(Number(attempts))),
    date:          new Date(),
  };

  /* ── Persist to MongoDB ── */
  if (dbReady()) {
    try {
      await Student.findOneAndUpdate(
        { username: studentId },
        {
          $push: { sessions: sessionData },
          $setOnInsert: {
            username:     studentId,
            name:         studentId,
            passwordHash: 'demo-placeholder',
            role:         'student',
          },
        },
        { upsert: true, new: true }
      );
      return res.status(201).json({ message: 'Session saved', session: sessionData });
    } catch (err) {
      console.error('DB error saving session:', err.message);
      /* Fall through to in-memory response so the client still gets 201 */
    }
  }

  /* ── In-memory fallback ── */
  res.status(201).json({ message: 'Session logged (no database)', session: sessionData });
});

module.exports = router;
