const request = require('supertest');
const app     = require('../backend/server');

/* ─── helpers ─────────────────────────────────────────── */
async function getToken(username) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'pass' });
  return res.body.token;
}

const VALID_SESSION = {
  taskId:        'fractions-1',
  focusSeconds:  120,
  totalSeconds:  180,
  tabSwitches:   1,
  correctStreak: 0,
  hintsUsed:     1,
  selfRating:    4,
  outcome:       'solved',
  attempts:      2,
};

/* ─── GET /api/tasks ─────────────────────────────────── */
describe('GET /api/tasks', () => {
  let token;
  beforeAll(async () => { token = await getToken('rahul_singh'); });

  it('returns task list without answers', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
    // answers must never be in the response
    res.body.tasks.forEach(t => {
      expect(t).not.toHaveProperty('answer');
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('title');
      expect(t).toHaveProperty('question');
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

/* ─── POST /api/tasks/:id/submit ─────────────────────── */
describe('POST /api/tasks/:id/submit', () => {
  let token;
  beforeAll(async () => { token = await getToken('rahul_singh'); });

  it('returns correct:true for right answer', async () => {
    const res = await request(app)
      .post('/api/tasks/algebra-1/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: '7' });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body).toHaveProperty('feedback');
  });

  it('returns correct:false for wrong answer', async () => {
    const res = await request(app)
      .post('/api/tasks/algebra-1/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: '99' });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
  });

  it('returns 404 for unknown task', async () => {
    const res = await request(app)
      .post('/api/tasks/does-not-exist/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: '7' });
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/tasks/algebra-1/submit')
      .send({ answer: '7' });
    expect(res.status).toBe(401);
  });
});

/* ─── POST /api/students/:id/sessions ────────────────── */
describe('POST /api/students/:id/sessions', () => {
  let studentToken, teacherToken;
  beforeAll(async () => {
    studentToken = await getToken('rahul_singh');
    teacherToken = await getToken('teacher_priya');
  });

  it('returns 201 with valid session data', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(VALID_SESSION);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('session');
    expect(res.body.session.taskId).toBe('fractions-1');
    expect(res.body.session.selfRating).toBe(4);
    expect(res.body.session.outcome).toBe('solved');
  });

  it('returns 403 when student logs for a different student', async () => {
    const res = await request(app)
      .post('/api/students/priya_nair/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(VALID_SESSION);
    expect(res.status).toBe(403);
  });

  it('allows teacher to log for any student', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(VALID_SESSION);
    expect(res.status).toBe(201);
  });

  it('returns 400 when taskId is missing', async () => {
    const { taskId, ...body } = VALID_SESSION;
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for selfRating out of range', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...VALID_SESSION, selfRating: 6 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative focusSeconds', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...VALID_SESSION, focusSeconds: -5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid outcome', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...VALID_SESSION, outcome: 'cheated' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/students/rahul_singh/sessions')
      .send(VALID_SESSION);
    expect(res.status).toBe(401);
  });
});

/* ─── Full learn flow (API layer) ────────────────────── */
describe('Full learn flow (API layer)', () => {
  let token;
  beforeAll(async () => { token = await getToken('rahul_singh'); });

  it('complete flow: fetch tasks → submit wrong → submit right → save session', async () => {
    const auth = { Authorization: `Bearer ${token}` };

    // 1. Fetch tasks
    const tasksRes = await request(app).get('/api/tasks').set(auth);
    expect(tasksRes.status).toBe(200);
    const task = tasksRes.body.tasks[0];
    expect(task).toBeDefined();

    // 2. Fetch hints
    const hintsRes = await request(app).get(`/api/tasks/${task.id}/hints`).set(auth);
    expect(hintsRes.status).toBe(200);
    expect(Array.isArray(hintsRes.body.hints)).toBe(true);

    // 3. Submit wrong answer
    const wrongRes = await request(app)
      .post(`/api/tasks/${task.id}/submit`).set(auth).send({ answer: 'WRONG' });
    expect(wrongRes.status).toBe(200);
    expect(wrongRes.body.correct).toBe(false);

    // 4. Submit correct answer (fractions-1 answer is 60)
    const knownAnswers = { 'fractions-1': '60', 'algebra-1': '7', 'geometry-1': '30', 'percentage-1': '70', 'linear-1': '8' };
    const correctRes = await request(app)
      .post(`/api/tasks/${task.id}/submit`).set(auth).send({ answer: knownAnswers[task.id] });
    expect(correctRes.status).toBe(200);
    expect(correctRes.body.correct).toBe(true);

    // 5. Save session
    const sessionRes = await request(app)
      .post(`/api/students/rahul_singh/sessions`).set(auth)
      .send({ ...VALID_SESSION, taskId: task.id });
    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.session.taskId).toBe(task.id);
  });
});
