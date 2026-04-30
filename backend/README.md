# VibeCode Lab Backend

## Architecture
- `backend/src/app.ts`: Express app, security middleware, rate limits, route mounting.
- `backend/src/server.ts`: server bootstrap and Firebase initialization.
- `backend/src/controllers/*`: thin HTTP layer.
- `backend/src/services/*`: business logic for auth, bug runner, prompts, assistant, dashboard.
- `backend/src/repositories/*`: Firestore access.
- `backend/src/integrations/firebase/*`: Admin SDK + Identity Toolkit auth bridge.
- `backend/src/integrations/gemini/*`: Gemini adapter with timeout handling.
- `backend/src/integrations/pytest/*`: adapter abstraction with `mock` and `python` runner modes.
- `backend/src/seed/*`: seed users, challenges, hints, tests, prompts, FAQ, progress.

## Run
- `npm install`
- configure `.env`
- `npm run seed:server`
- `npm run dev`

## Example API requests

### Register
`POST /api/auth/register`
```json
{
  "email": "dev@vibecode.dev",
  "password": "Password123!",
  "username": "devuser",
  "displayName": "Dev User"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "alex@vibecode.dev",
  "password": "Password123!",
  "provider": "password"
}
```

### Run bug challenge
`POST /api/bugs/run`
```json
{
  "challengeId": "bug-python-001",
  "code": "def sum_evens(n):\n    ..."
}
```

### Save prompt
`POST /api/prompts/save`
```json
{
  "title": "Refactor prompt",
  "category": "debug",
  "originalPrompt": "help me debug this code",
  "improvedPrompt": "You are a senior engineer...",
  "role": "senior engineer",
  "detailLevel": "high"
}
```

### Assistant chat
`POST /api/assistant/chat`
```json
{
  "moduleType": "find_bug",
  "message": "Give me a hint about the loop",
  "context": {
    "challengeId": "bug-python-001",
    "challengeTitle": "The Unending Counter",
    "currentCode": "def sum_evens..."
  }
}
```

## Frontend integration notes
- Frontend should store `token` from `/api/auth/login` or `/api/auth/register`.
- Send `Authorization: Bearer <token>` for protected endpoints.
- Vite dev server proxies `/api/*` to `VITE_API_BASE_URL`.
- `PYTEST_RUNNER_MODE=mock` keeps API stable without local Python sandbox.
- Switch to `PYTEST_RUNNER_MODE=python` when `python` and `pytest` are available.
