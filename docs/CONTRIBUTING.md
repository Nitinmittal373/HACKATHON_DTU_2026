# Contributing

## Git Workflow

We use a simple feature-branch workflow:

```
main         ← stable, demo-ready
  └── feature/your-feature
  └── fix/bug-description
  └── docs/what-changed
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<name>` | `feature/teacher-export` |
| Bug fix | `fix/<name>` | `fix/chart-dark-mode` |
| Docs | `docs/<name>` | `docs/api-examples` |
| Refactor | `refactor/<name>` | `refactor/metrics-module` |

---

## Commit Message Style

Format: `<type>: <short description>`

```
feat: add CSV export for teacher analytics
fix: correct perseverance formula for avgRetries=0
docs: add deployment section to README
style: align card component spacing
refactor: extract score formulas to separate module
test: add unit tests for calcConcentration
```

**Rules**:
- Keep the subject line under 72 characters
- Use present tense ("add" not "added")
- Reference issues where relevant: `fix: correct formula (#12)`

---

## Pull Request Template

```markdown
## What
Brief description of the change.

## Why
The motivation — problem solved or feature added.

## How to test
1. Step one
2. Step two

## Checklist
- [ ] Works in both light and dark mode
- [ ] Tested with student and teacher accounts
- [ ] No console errors
- [ ] Formula changes reflected in both frontend/js/app.js and backend/routes/metrics.js
```

---

## Code Style

**JavaScript**:
- 2-space indentation
- Single quotes for strings
- No semicolons (optional — be consistent within a file)
- `const` / `let` only (no `var`)

**CSS**:
- Use design tokens (`var(--saffron)`) — never hardcode colours
- BEM-ish class names (`.card`, `.card__title`, `.card--active`)

**Keeping formulas in sync**:

The score formulas live in two places. If you change one, change both:
- `frontend/js/app.js` — `calcConcentration()`, `calcReliance()`, etc.
- `backend/routes/metrics.js` — same functions in JS
- `src/backend/utils/calculations.py` — Python mirror (Flask implementation)

---

## Running Tests

```bash
cd backend
npm test
```

---

## Questions

Open a GitHub Issue with the `question` label.
