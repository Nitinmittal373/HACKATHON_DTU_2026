const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');

/* Complete Shastra Growth & Cognitive Challenge Bank */
const TASKS = [
  /* ── 📚 LEARNING (Preserved existing tasks + new learning challenges) ── */
  {
    id: 'algebra-1',
    subject: 'Algebra',
    category: 'Learning',
    title: 'Solve for x',
    description: 'Solve a linear algebraic equation step by step.',
    question: 'Solve: 3x − 7 = 14',
    formula: '3x − 7 = 14',
    answer: '7',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '10 min',
    points: 20
  },
  {
    id: 'geometry-1',
    subject: 'Geometry',
    category: 'Learning',
    title: 'Triangle area',
    description: 'Calculate the area of a right-angled geometric triangle.',
    question: 'Find the area of a triangle with base 10 cm and height 6 cm.',
    formula: 'Area = (1/2) × base × height',
    answer: '30',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'percentage-1',
    subject: 'Arithmetic',
    category: 'Learning',
    title: 'Percentage problem',
    description: 'Compute the percentage fraction of a whole quantity.',
    question: 'What is 35% of 200?',
    formula: '(35 / 100) × 200',
    answer: '70',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'linear-1',
    subject: 'Algebra',
    category: 'Learning',
    title: 'Linear equations',
    description: 'Isolate the variable x in a linear equality.',
    question: 'If 2x + 5 = 21, find x.',
    formula: '2x + 5 = 21',
    answer: '8',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '10 min',
    points: 20
  },
  {
    id: 'fractions-1',
    subject: 'Arithmetic',
    category: 'Learning',
    title: 'Fractions word problem',
    description: 'Solve a real-world capacity problem using fraction relations.',
    question: 'A tank is 3/4 full. If 15 litres more fill it completely, what is the total capacity?',
    formula: 'x − (3/4)x = 15',
    answer: '60',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '15 min',
    points: 30
  },
  {
    id: 'learn-1',
    subject: 'Science & World',
    category: 'Learning',
    title: 'Curiosity Beyond the Syllabus',
    description: 'Explore one fascinating scientific or historical concept completely outside today\'s syllabus.',
    question: 'Pick an idea in science, history, or philosophy outside your exams. Read for 15 minutes, then summarize the core breakthrough in 2–3 sentences.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '15 min',
    points: 10
  },
  {
    id: 'learn-2',
    subject: 'Applied Science',
    category: 'Learning',
    title: 'Real-World Concept Discovery',
    description: 'Discover and explain how a textbook concept is used in modern engineering or daily technology.',
    question: 'Choose a concept you studied this week (e.g. friction, quadratic curves, levers) and explain a real practical device that depends on it.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '15 min',
    points: 10
  },
  {
    id: 'learn-3',
    subject: 'Conceptual Mastery',
    category: 'Learning',
    title: 'Feynman Technique Articulation',
    description: 'Explain a difficult topic in plain words so simply that a 10-year-old would understand it.',
    question: 'Write a plain-English, jargon-free explanation of a concept you learned recently. Use an everyday analogy.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '20 min',
    points: 20
  },
  {
    id: 'learn-4',
    subject: 'Peer Mentorship',
    category: 'Learning',
    title: 'Teach Concept to a Peer',
    description: 'Teach an academic principle to someone else until they can explain it back to you.',
    question: 'Teach a concept to a friend or sibling. Note the questions they asked and how you clarified their doubts.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'learn-5',
    subject: 'Independent Mastery',
    category: 'Learning',
    title: 'Master a Frontier Topic',
    description: 'Master an entirely new concept from first principles and synthesize it.',
    question: 'Choose a topic you know nothing about. Study it from primary sources for 45 minutes and write an insightful breakdown.',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '45 min',
    points: 50
  },

  /* ── 🧠 CONCENTRATION ── */
  {
    id: 'conc-1',
    subject: 'Mind & Memory',
    category: 'Concentration',
    title: 'Focused Reading & Recall',
    description: 'Read a short passage for 10 minutes and recall 3 key points from pure memory.',
    question: 'Read an educational or philosophical passage for 10 minutes without multitasking. Write down 3 essential insights entirely from memory.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'conc-2',
    subject: 'Attentional Stability',
    category: 'Concentration',
    title: '10-Minute Phone-Free Focus',
    description: 'Focus on one single study task for 10 minutes without checking notifications.',
    question: 'Place your phone in another room. Engage in single-task focus for 10 continuous minutes without tab switching or distractions.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'conc-3',
    subject: 'Deep Work',
    category: 'Concentration',
    title: '25-Minute Monastic Study Session',
    description: 'Complete a 25-minute focused study session without switching tasks.',
    question: 'Execute a full 25-minute Pomodoro focus block on a single chapter. Record what you achieved and note if any attentional urges arose.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '25 min',
    points: 20
  },
  {
    id: 'conc-4',
    subject: 'Selective Attention',
    category: 'Concentration',
    title: 'Distraction-Free Problem Solving',
    description: 'Solve an academic problem while maintaining uninterrupted focus in quiet silence.',
    question: 'Sit in a quiet space and solve a multi-step problem for 20 minutes without music, video, or side-chat. Record your solution.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '20 min',
    points: 20
  },
  {
    id: 'conc-5',
    subject: 'Sustained Focus',
    category: 'Concentration',
    title: '45-Minute Deep Focus Sprint',
    description: 'Immerse yourself deeply in complex material for 45 uninterrupted minutes.',
    question: 'Dedicate 45 minutes to high-difficulty study material. Keep your workspace completely silent and write your summary notes.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '45 min',
    points: 30
  },
  {
    id: 'conc-6',
    subject: 'Cognitive Endurance',
    category: 'Concentration',
    title: '30-Minute Continuous Analysis',
    description: 'Work continuously on a difficult conceptual problem for 30 minutes without giving in to distraction.',
    question: 'Analyze an intricate mathematical proof, scientific system, or essay topic for 30 continuous minutes without leaving your desk.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'conc-7',
    subject: 'Mastery & Discipline',
    category: 'Concentration',
    title: '60-Minute Master Focus Session',
    description: 'Complete a full 1-hour session of uninterrupted study and write an accomplishment log.',
    question: 'Complete an intensive 60-minute unbroken session of focused work. Write a structured summary of what you mastered during this hour.',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '60 min',
    points: 50
  },

  /* ── 💪 PERSEVERANCE ── */
  {
    id: 'pers-1',
    subject: 'Constructive Grit',
    category: 'Perseverance',
    title: 'Retry a Past Mistake',
    description: 'Retry one problem you previously got wrong and understand why the error occurred.',
    question: 'Find a problem from a past test or assignment that you failed. Rework it from the beginning until you reach the correct solution.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'pers-2',
    subject: 'Independent Grappling',
    category: 'Perseverance',
    title: '10-Minute Independent Struggle',
    description: 'Spend 10 full minutes trying to solve a difficult problem before asking for hints or checking solutions.',
    question: 'When encountering a difficult challenge, grapple with it independently for 10 full minutes. Write down the hypotheses you tested.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'pers-3',
    subject: 'Methodical Tenacity',
    category: 'Perseverance',
    title: 'Dual-Approach Solution',
    description: 'Attempt a difficult problem using two different methods or perspectives.',
    question: 'Take a challenging question and attempt it using two distinct strategies (e.g., algebraic substitution vs. graphical deduction).',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '20 min',
    points: 20
  },
  {
    id: 'pers-4',
    subject: 'Resilience After Failure',
    category: 'Perseverance',
    title: 'Immediate Post-Failure Retry',
    description: 'Continue working on a difficult problem immediately after an unsuccessful attempt.',
    question: 'When your first answer is wrong, pause, examine what assumptions failed, and immediately launch a refined second attempt.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '20 min',
    points: 20
  },
  {
    id: 'pers-5',
    subject: 'Reclaiming Unfinished Goals',
    category: 'Perseverance',
    title: 'Return to an Abandoned Problem',
    description: 'Reopen a problem you previously gave up on and conquer it with fresh determination.',
    question: 'Go back to a homework problem or challenge that you abandoned last week. Apply methodical patience and complete it.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'pers-6',
    subject: 'Sustained Tenacity',
    category: 'Perseverance',
    title: '30-Minute Grit Challenge',
    description: 'Work through a difficult intellectual hurdle for 30 minutes without looking at the answer.',
    question: 'Work through an advanced multi-step challenge for 30 minutes straight without searching for shortcuts or solutions.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'pers-7',
    subject: 'Mastery over Adversity',
    category: 'Perseverance',
    title: 'Conquer a Multi-Failure Problem',
    description: 'Master a concept or exercise that you previously failed multiple times in the past.',
    question: 'Identify a topic that has repeatedly defeated you in the past. Break it down to first principles and conquer it today.',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '45 min',
    points: 50
  },

  /* ── 🎯 DISCIPLINE ── */
  {
    id: 'disc-1',
    subject: 'Order & Prioritization',
    category: 'Discipline',
    title: 'Prioritize Before Entertainment',
    description: 'Complete your most important academic task before consuming any leisure media.',
    question: 'Commit to finishing your key study obligation of the day before opening video games, social feeds, or videos.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '15 min',
    points: 10
  },
  {
    id: 'disc-2',
    subject: 'Environment & Mind',
    category: 'Discipline',
    title: 'Workspace Organization',
    description: 'Declutter and organize your physical and digital study spaces before starting work.',
    question: 'Clean your desk, remove all non-essential items, and close unrelated browser tabs before beginning your study session.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'disc-3',
    subject: 'Structured Execution',
    category: 'Discipline',
    title: 'Planned Study Session Adherence',
    description: 'Follow a 30-minute structured study plan exactly as you scheduled it.',
    question: 'Set a 30-minute target agenda with specific milestones. Execute the plan strictly to completion without wandering.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '30 min',
    points: 20
  },
  {
    id: 'disc-4',
    subject: 'Task Completion',
    category: 'Discipline',
    title: 'Finish One Task Before Starting Another',
    description: 'Bring one pending task to 100% completion before starting any new assignment.',
    question: 'Select an unfinished assignment or chapter and complete every step before transitioning to another subject.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '25 min',
    points: 20
  },
  {
    id: 'disc-5',
    subject: 'Timetable Rigor',
    category: 'Discipline',
    title: 'Follow Schedule for Entire Block',
    description: 'Adhere to your planned study schedule for an entire 45-minute block without deviation.',
    question: 'Plan out a 45-minute multi-part study block and follow each section without delaying or procrastinating.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '45 min',
    points: 30
  },
  {
    id: 'disc-6',
    subject: 'Monastic Simplicity',
    category: 'Discipline',
    title: 'Difficult Task in Zero Distraction',
    description: 'Work through a dry, difficult subject with zero background music, snacking, or browsing.',
    question: 'Study your most challenging course material with complete mental sobriety for 30 minutes. Note your reflections.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'disc-7',
    subject: 'First-Hour Rigor',
    category: 'Discipline',
    title: 'Eat the Frog — Morning Priority Protocol',
    description: 'Complete your hardest task of the day before checking any social media or entertainment.',
    question: 'Conquer your most dreaded, highest-friction task of the day first. Write down how taking early action impacted your character.',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '60 min',
    points: 50
  },

  /* ── 🤝 EMPATHY ── */
  {
    id: 'emp-1',
    subject: 'Compassionate Listening',
    category: 'Empathy',
    title: 'Active Check-In & Listening',
    description: 'Ask someone how their day is going and listen attentively without interrupting.',
    question: 'Reach out to a peer, sibling, or friend. Ask how their day is going, listen with 100% attention without cutting in, and reflect on what they shared.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'emp-2',
    subject: 'Everyday Service',
    category: 'Empathy',
    title: 'Small Act of Assistance',
    description: 'Help someone near you with a small task without waiting to be asked.',
    question: 'Notice someone around you who needs help with a chore, carrying something, or studying. Step forward and help warmly.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'emp-3',
    subject: 'Peer Academic Support',
    category: 'Empathy',
    title: 'Help a Struggling Classmate',
    description: 'Support a classmate with a problem or subject they are finding difficult.',
    question: 'Find a peer who is struggling with homework or a topic you understand. Spend 20 minutes guiding them patiently.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '20 min',
    points: 20
  },
  {
    id: 'emp-4',
    subject: 'Selfless Patience',
    category: 'Empathy',
    title: 'Deep Uninterrupted Listening',
    description: 'Listen to someone describe a frustration or challenge without giving unsolicited advice.',
    question: 'Practice holding space for someone. Let them speak fully about their challenge without jumping in with your own stories or quick fixes.',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '15 min',
    points: 20
  },
  {
    id: 'emp-5',
    subject: 'Empowering Guidance',
    category: 'Empathy',
    title: 'Socratic Concept Mentoring',
    description: 'Help someone understand a concept using guided questions instead of doing the work for them.',
    question: 'Guide someone through a difficult academic challenge by asking questions that empower them to find the answer themselves.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '30 min',
    points: 30
  },
  {
    id: 'emp-6',
    subject: 'Karma Yoga',
    category: 'Empathy',
    title: 'Anonymous Service',
    description: 'Do something genuinely helpful for a person or community without seeking credit.',
    question: 'Perform an act of service or help completely anonymously without expecting praise or recognition.',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '20 min',
    points: 30
  },
  {
    id: 'emp-7',
    subject: 'Selfless Initiative',
    category: 'Empathy',
    title: 'Proactive Community Support',
    description: 'Identify someone in need of support and take meaningful compassionate action.',
    question: 'Observe your surroundings closely, recognize a quiet need or distress in someone, and take decisive action to uplift them.',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '45 min',
    points: 50
  },

  /* ── 🪞 SELF REFLECTION ── */
  {
    id: 'refl-1',
    subject: 'Gratitude & Peace',
    category: 'Self Reflection',
    title: 'Daily Gratitude Journal',
    description: 'Write down three specific things you are genuinely grateful for today.',
    question: 'Pause and reflect on your day. Write down 3 specific things, people, or opportunities you are grateful for and why.',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '5 min',
    points: 10
  },
  {
    id: 'refl-2',
    subject: 'Self-Awareness',
    category: 'Self Reflection',
    title: 'Daily Improvement Note',
    description: 'Write one specific action or attitude you handled better today than yesterday.',
    question: 'Review your day honestly: what is one small thing you did with greater patience, focus, or skill today compared to yesterday?',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10 min',
    points: 10
  },
  {
    id: 'refl-3',
    subject: 'Learning from Errors',
    category: 'Self Reflection',
    title: 'Mistake & Lesson Deconstruction',
    description: 'Identify one mistake you made today and write the constructive lesson it taught you.',
    question: 'Examine a mistake made today without beating yourself up. What underlying habit caused it, and what rule will prevent it tomorrow?',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '15 min',
    points: 20
  },
  {
    id: 'refl-4',
    subject: 'Growth Intention',
    category: 'Self Reflection',
    title: 'Tomorrow\'s Character Intention',
    description: 'Formulate one clear, actionable character intention you will practice tomorrow.',
    question: 'Write down one specific quality you will consciously practice tomorrow (e.g. prompt start, calm speech, zero phone during study).',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '10 min',
    points: 20
  },
  {
    id: 'refl-5',
    subject: 'Emotional Intelligence',
    category: 'Self Reflection',
    title: 'Stress & Reaction Audit',
    description: 'Reflect deeply on how you handled a stressful or difficult situation today.',
    question: 'Think about a moment of friction or frustration today. Did you react impulsively or respond thoughtfully? How can you cultivate inner poise?',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '25 min',
    points: 30
  },
  {
    id: 'refl-6',
    subject: 'Habit Analysis',
    category: 'Self Reflection',
    title: 'Daily Habit Impact Audit',
    description: 'Analyze one daily routine and how it compounds for or against your character.',
    question: 'Identify one recurring daily habit (e.g. sleep timing, phone scrolling, study routine). How does this single habit compound over a year?',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '25 min',
    points: 30
  },
  {
    id: 'refl-7',
    subject: 'Character Retrospective',
    category: 'Self Reflection',
    title: 'Character Growth Retrospective',
    description: 'Write a structured retrospective about one meaningful personal improvement you have achieved recently.',
    question: 'Compare who you are today with who you were six months ago. Where has your concentration, perseverance, and character grown the most?',
    difficulty: 'Challenge',
    difficultyLevel: 4,
    estimatedTime: '40 min',
    points: 50
  }
];

/**
 * GET /api/tasks
 * Query: ?subject=Algebra&category=Concentration&difficulty=Easy
 */
router.get('/', authMiddleware, (req, res) => {
  let tasks = TASKS;
  if (req.query.subject) {
    tasks = tasks.filter(t => t.subject === req.query.subject);
  }
  if (req.query.category) {
    tasks = tasks.filter(t => t.category.toLowerCase() === req.query.category.toLowerCase());
  }
  if (req.query.difficulty) {
    tasks = tasks.filter(t => t.difficulty.toLowerCase() === req.query.difficulty.toLowerCase());
  }
  /* Strip answers from response */
  res.json({ tasks: tasks.map(({ answer, ...t }) => t) });
});

/**
 * GET /api/tasks/:id
 * Returns task without answer
 */
router.get('/:id', authMiddleware, (req, res) => {
  const task = TASKS.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { answer, ...safe } = task;
  res.json(safe);
});

/**
 * POST /api/tasks/:id/submit
 * Body: { studentId, answer, hintsUsed, selfRating, focusSeconds, totalSeconds, tabSwitches, correctStreak }
 * Returns: { correct, feedback, taskId }
 */
router.post('/:id/submit', authMiddleware, (req, res) => {
  const task = TASKS.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  let correct = false;
  if (task.answer) {
    correct = String(req.body.answer).trim() === task.answer;
  } else {
    // For growth and reflection challenges, non-empty completion note is accepted
    correct = Boolean(req.body.answer && String(req.body.answer).trim().length > 0);
  }

  res.json({
    correct,
    feedback: correct
      ? 'Correct! Your focus, reflection, and effort have been logged.'
      : 'Not quite — try again. A retry that eventually succeeds counts toward Perseverance.',
    taskId: task.id,
    points: task.points || 10
  });
});

/**
 * GET /api/tasks/:id/hints
 * Returns progressive hints (each call reveals the next)
 */
router.get('/:id/hints', authMiddleware, (req, res) => {
  const hints = {
    'fractions-1': ['Re-read and underline every known quantity.','Let x = total capacity. Write: x − (3/4)x = 15','Solve: (1/4)x = 15, so x = 60'],
    'algebra-1':   ['Add 7 to both sides.','You now have 3x = 21.','Divide both sides by 3.'],
    'geometry-1':  ['Recall the formula: Area = (1/2) × base × height.','Substitute: (1/2) × 10 × 6.','Calculate the product.'],
    'percentage-1': ['Remember that 35% means 35 out of 100.','Multiply 200 by 0.35.','Calculate: 200 × 35 / 100.'],
    'linear-1':     ['Subtract 5 from both sides of the equation.','You now have 2x = 16.','Divide both sides by 2 to find x.'],
  };

  const defaultHint = [
    'Take a breath, center your focus, and approach the challenge with patience.',
    'Break the problem down into smaller, manageable observations.',
    'Swami Vivekananda said: "Arise, awake, and stop not till the goal is reached."'
  ];

  res.json({ hints: hints[req.params.id] || defaultHint });
});

module.exports = router;
