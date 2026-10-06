const express = require('express');
const router  = express.Router();

/* Sample data — replace with DB queries */
const STUDENTS = [
  { id: 'rahul_singh',  name: 'Rahul Singh',  class: '8B', trend: [61,66,70,74,78] },
  { id: 'priya_nair',   name: 'Priya Nair',   class: '8B', trend: [60,58,55,52,44] },
  { id: 'arjun_mehta',  name: 'Arjun Mehta',  class: '8B', trend: [78,80,83,87,89] },
  { id: 'sana_qureshi', name: 'Sana Qureshi', class: '8B', trend: [60,62,65,66,67] },
  { id: 'vikram_rao',   name: 'Vikram Rao',   class: '8B', trend: [55,57,59,61,62] }
];

/**
 * GET /api/students
 * Returns all students (teacher only)
 */
router.get('/', (req, res) => {
  res.json({ students: STUDENTS.map(({ id, name, class: cls }) => ({ id, name, class: cls })) });
});

/**
 * GET /api/students/:id
 * Returns one student's profile
 */
router.get('/:id', (req, res) => {
  const student = STUDENTS.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

/**
 * GET /api/students/:id/sessions
 * Returns a student's session history
 */
router.get('/:id/sessions', (req, res) => {
  // TODO: fetch from MongoDB
  res.json({ studentId: req.params.id, sessions: [] });
});

/**
 * POST /api/students/:id/sessions
 * Logs a new session
 * Body: { focusSeconds, totalSeconds, tabSwitches, correctStreak, taskId, hintsUsed, selfRating, outcome }
 */
router.post('/:id/sessions', (req, res) => {
  // TODO: persist to MongoDB
  const session = { ...req.body, timestamp: new Date().toISOString() };
  res.status(201).json({ message: 'Session logged', session });
});

module.exports = router;
