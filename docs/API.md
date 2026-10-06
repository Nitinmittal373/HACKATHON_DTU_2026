# API Reference

Base URL: `http://localhost:5000/api`

---

## Auth

### POST /api/auth/login
Login with username and password.

**Request**
```json
{ "username": "rahul_singh", "password": "pass" }
```

**Response 200**
```json
{ "token": "eyJ...", "role": "student", "name": "Rahul Singh", "username": "rahul_singh" }
```

**Response 401**
```json
{ "error": "Invalid credentials" }
```

---

### POST /api/auth/logout
Stateless — client discards the token.

**Response 200**
```json
{ "message": "Logged out successfully" }
```

---

### GET /api/auth/me
Returns the authenticated user's profile.

**Headers**: `Authorization: Bearer <token>`

**Response 200**
```json
{ "username": "rahul_singh", "role": "student" }
```

---

## Students

### GET /api/students
Returns all students (teacher only).

**Response 200**
```json
{ "students": [{ "id": "rahul_singh", "name": "Rahul Singh", "class": "8B" }] }
```

---

### GET /api/students/:id
Returns one student's profile and score trend.

**Response 200**
```json
{ "id": "rahul_singh", "name": "Rahul Singh", "class": "8B", "trend": [61,66,70,74,78] }
```

---

### GET /api/students/:id/sessions
Returns session history.

**Response 200**
```json
{ "studentId": "rahul_singh", "sessions": [] }
```

---

### POST /api/students/:id/sessions
Log a new session.

**Request**
```json
{
  "focusSeconds": 1080,
  "totalSeconds": 1200,
  "tabSwitches": 1,
  "correctStreak": 3,
  "taskId": "fractions-1",
  "hintsUsed": 0,
  "selfRating": 4,
  "outcome": "solved"
}
```

**Response 201**
```json
{ "message": "Session logged", "session": { "...": "..." } }
```

---

## Tasks

### GET /api/tasks
Returns all tasks (answers stripped).

**Query params**: `?subject=Algebra`

**Response 200**
```json
{ "tasks": [{ "id": "algebra-1", "subject": "Algebra", "title": "Solve for x", "difficulty": 2 }] }
```

---

### GET /api/tasks/:id
Returns one task (no answer).

---

### POST /api/tasks/:id/submit
Submit an answer.

**Request**
```json
{ "answer": "60", "studentId": "rahul_singh", "hintsUsed": 0, "selfRating": 4 }
```

**Response 200**
```json
{ "correct": true, "feedback": "Correct! Your focus and effort have been logged.", "taskId": "fractions-1" }
```

---

### GET /api/tasks/:id/hints
Returns progressive hints array.

**Response 200**
```json
{ "hints": ["Re-read and underline every known quantity.", "Let x = total capacity..."] }
```

---

## Metrics

### POST /api/metrics/compute
Compute all 5 scores from raw session data.

**Request**
```json
{
  "today":       { "focusSeconds": 1080, "totalSeconds": 1200, "tabSwitches": 1, "correctStreak": 3 },
  "week":        { "tasksAttempted": 14, "tasksNoHint": 11, "hintsThisWeek": 6, "hintsLastWeek": 11 },
  "retries":     { "retriedCount": 5, "eventualSuccess": 4, "avgRetries": 2.4 },
  "calibration": [{ "rated": 4, "actual": 3 }, { "rated": 2, "actual": 2 }]
}
```

**Response 200**
```json
{
  "scores": {
    "concentration": { "base": 54, "switchPenalty": 4, "streakBonus": 15, "total": 65 },
    "reliance":      { "base": 55, "trendBonus": 14, "total": 69 },
    "perseverance":  { "base": 52, "rangeFit": 35, "total": 87 },
    "confidence":    { "avgErr": 0.8, "calibScore": 82.4, "hardBonus": 8, "total": 73.9 },
    "character":     { "total": 73.7 }
  }
}
```

---

### GET /api/metrics/formulas
Returns human-readable formula descriptions.

---

## Health

### GET /api/health

**Response 200**
```json
{ "status": "ok", "app": "Shastra" }
```
