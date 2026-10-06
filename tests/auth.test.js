const request = require('supertest');
const app     = require('../backend/server');

/* ─── helpers ─────────────────────────────────────────── */
async function loginAs(username, password = 'pass') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  return res;
}

async function getToken(username) {
  const res = await loginAs(username);
  return res.body.token;
}

/* ─── POST /api/auth/login ────────────────────────────── */
describe('POST /api/auth/login', () => {
  it('returns 200 with token, role, name for valid student credentials', async () => {
    const res = await loginAs('rahul_singh');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('student');
    expect(res.body.name).toBe('Rahul Singh');
    expect(res.body.username).toBe('rahul_singh');
  });

  it('returns 200 with teacher role for teacher credentials', async () => {
    const res = await loginAs('teacher_priya');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('teacher');
  });

  it('returns 401 for wrong password', async () => {
    const res = await loginAs('rahul_singh', 'wrongpassword');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('token');
  });

  it('returns 401 for unknown username', async () => {
    const res = await loginAs('nobody');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'pass' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'rahul_singh' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

/* ─── Protected routes without JWT ───────────────────── */
describe('Protected routes — no token', () => {
  it('GET /api/students/:id returns 401 without token', async () => {
    const res = await request(app).get('/api/students/rahul_singh');
    expect(res.status).toBe(401);
  });

  it('POST /api/metrics/compute returns 401 without token', async () => {
    const res = await request(app).post('/api/metrics/compute').send({});
    expect(res.status).toBe(401);
  });

  it('GET /api/tasks returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

/* ─── Protected routes with valid JWT ────────────────── */
describe('Protected routes — with valid student token', () => {
  let token;

  beforeAll(async () => {
    token = await getToken('rahul_singh');
  });

  it('GET /api/students/:id returns 200 with valid token', async () => {
    const res = await request(app)
      .get('/api/students/rahul_singh')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'rahul_singh');
  });

  it('GET /api/auth/me returns username and role', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('rahul_singh');
    expect(res.body.role).toBe('student');
  });
});

/* ─── Teacher-only route ──────────────────────────────── */
describe('GET /api/students (teacher-only)', () => {
  it('returns 403 when called with a student token', async () => {
    const token = await getToken('rahul_singh');
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 when called with a teacher token', async () => {
    const token = await getToken('teacher_priya');
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});

/* ─── Health check (public) ──────────────────────────── */
describe('GET /api/health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
