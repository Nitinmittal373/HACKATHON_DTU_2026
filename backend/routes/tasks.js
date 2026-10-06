const express = require('express');
const router  = express.Router();

/* Sample task bank */
const TASKS = [
  { id: 'fractions-1', subject: 'Arithmetic', title: 'Fractions word problem',
    question: 'A tank is 3/4 full. If 15 litres more fill it completely, what is the total capacity?',
    answer: '60', difficulty: 3 },
  { id: 'algebra-1', subject: 'Algebra', title: 'Solve for x',
    question: 'Solve: 3x − 7 = 14', answer: '7', difficulty: 2 },
  { id: 'geometry-1', subject: 'Geometry', title: 'Triangle area',
    question: 'Find the area of a triangle with base 10 cm and height 6 cm.', answer: '30', difficulty: 2 },
  { id: 'percentage-1', subject: 'Arithmetic', title: 'Percentage problem',
    question: 'What is 35% of 200?', answer: '70', difficulty: 2 },
  { id: 'linear-1', subject: 'Algebra', title: 'Linear equations',
    question: 'If 2x + 5 = 21, find x.', answer: '8', difficulty: 2 }
];

/**
 * GET /api/tasks
 * Query: ?subject=Algebra
 */
router.get('/', (req, res) => {
  let tasks = TASKS;
  if (req.query.subject) {
    tasks = tasks.filter(t => t.subject === req.query.subject);
  }
  /* Strip answers from response */
  res.json({ tasks: tasks.map(({ answer, ...t }) => t) });
});

/**
 * GET /api/tasks/:id
 * Returns task without answer
 */
router.get('/:id', (req, res) => {
  const task = TASKS.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { answer, ...safe } = task;
  res.json(safe);
});

/**
 * POST /api/tasks/:id/submit
 * Body: { studentId, answer, hintsUsed, selfRating, focusSeconds, totalSeconds, tabSwitches, correctStreak }
 * Returns: { correct, feedback }
 */
router.post('/:id/submit', (req, res) => {
  const task = TASKS.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const correct = String(req.body.answer).trim() === task.answer;
  res.json({
    correct,
    feedback: correct
      ? 'Correct! Your focus and effort have been logged.'
      : 'Not quite — try again. A retry that eventually succeeds counts toward Perseverance.',
    taskId: task.id
  });
});

/**
 * GET /api/tasks/:id/hints
 * Returns progressive hints (each call reveals the next)
 */
router.get('/:id/hints', (req, res) => {
  const hints = {
    'fractions-1': ['Re-read and underline every known quantity.','Let x = total capacity. Write: x − (3/4)x = 15','Solve: (1/4)x = 15, so x = 60'],
    'algebra-1':   ['Add 7 to both sides.','You now have 3x = 21.','Divide both sides by 3.'],
    'geometry-1':  ['Recall the formula: Area = (1/2) × base × height.','Substitute: (1/2) × 10 × 6.','Calculate the product.']
  };
  res.json({ hints: hints[req.params.id] || ['Work through the problem step by step.'] });
});

module.exports = router;
