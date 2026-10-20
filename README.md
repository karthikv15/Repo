# Call Guide

A screen a caller keeps open beside a live cold call. It keeps the caller on the eight stages of the call: what the stage is for, what prospects tend to say at that point, a tap for what happened, one box for the prospect's own words, then the next stage and the outcome. Finished calls are saved, and a second screen lists past calls with the stage each one reached.

Built for a caller selling growth work to owners and directors of Indian companies. The stage content comes from reading 100 cold-call transcripts.

## Live links
| | |
|---|---|
| Screen (Vercel) | https://repo-1kca.vercel.app/ |
| Backend (Render) | https://repo-8yh1.onrender.com |
| Health check | https://repo-8yh1.onrender.com/health |
| Database | Supabase (Postgres), schema in `supabase/schema.sql` |

Render's free tier sleeps when idle. The first request after a quiet period can take up to a minute. Open the health link first to wake it.

## The LLM, and why this one
**Gemini** (`gemini-flash-latest`, falling back to `gemini-flash-lite-latest`), called from the backend only. The key lives in Render's environment, never in the browser.

When the caller ends a call they pick an outcome. The backend then sends Gemini what was recorded (the taps and the prospect's words, stage by stage) and the outcome chosen. Gemini returns:
- a one-line summary of the call, which the caller can edit;
- whether the outcome chosen contradicts the record (for example "next step agreed" when no next step was recorded);
- a suggested outcome when it does.

I picked this because in the transcripts the outcome the caller logged often did not match what was said. It also costs the caller nothing during the call, since it only runs at the end. If Gemini is down or slow, the call still saves with no summary.

## What I found in the 100 calls
Where calls ended (my reading of each call): opening 17, purpose 3, permission 8, their business 0, their need 2, objection 25, next step 45, close 0. Stage 4 is almost skipped (callers go straight from purpose to "can I send you a report"), and stage 5 is where the useful words are but are rarely written down. That is why stage 5 has the largest box and the prompt "write exactly what they said".

## How it is built
- `frontend/` React + Vite + Tailwind, built with Bolt. Talks only to the backend through `VITE_API_URL`.
- `backend/` Node + Express. Holds the Supabase service key and the Gemini key.
- `supabase/schema.sql` two tables:
  - `calls`: prospect, company, role, start and end time, current stage, furthest stage reached, outcome, summary.
  - `stage_results`: one row per stage per call (taps and prospect's words), unique on (call, stage), so saving a stage twice replaces it and nothing is lost.

### API
| Method | Path | Does |
|---|---|---|
| GET | /health | up check |
| POST | /calls | start a call |
| PUT | /calls/:id/stages/:n | save a stage (taps and words) |
| POST | /calls/:id/close-check | Gemini summary and outcome check |
| POST | /calls/:id/close | close and save the call |
| GET | /calls | list calls |
| GET | /calls/:id | one call with its stages |

### Environment variables
Render (backend): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CORS_ORIGINS`.
Vercel (frontend): `VITE_API_URL`.

### Run locally
```
cd backend && npm install && cp .env.example .env   # fill in values
npm start
cd ../frontend && npm install && npm run dev
```

## What I left out, and why
- **Login.** One caller on one device; it would add work and no insight.
- **Editing past calls.** The record is what was said at the time.
- **Live audio or transcription.** The point is that the caller types as little as possible, and a recording would add a second thing to manage on a live call.
- **Analytics beyond "where do my calls end".** That one chart is the thing the data said mattered.
- **The transcripts.** They are for this task only and are not in this repo.
