# Call Guide

A screen a caller keeps open on a cold call. Eight stages, taps for what happened, a box for the prospect's words, and a saved record.

- **Screen (Vercel):** `<paste Vercel URL>`
- **Backend (Render):** `<paste Render URL>`
- **Health check:** `<Render URL>/health`
- **Database:** Supabase, schema in `supabase/schema.sql`
- **LLM:** Gemini (`gemini-2.5-flash`), called from the backend only. At the end of a call it drafts the one-line summary and checks the outcome the caller picked against what was recorded. If it fails, the call still saves.

## Layout
- `frontend/` the screen (built with Lovable)
- `backend/` Node + Express API
- `supabase/schema.sql` tables `calls` and `stage_results`

## API
| Method | Path | What |
|---|---|---|
| GET | /health | up check |
| POST | /calls | start a call |
| PUT | /calls/:id/stages/:n | save one stage (replaces if saved again) |
| POST | /calls/:id/close-check | LLM summary and outcome check |
| POST | /calls/:id/close | close and save |
| GET | /calls | list calls |
| GET | /calls/:id | one call with its stages |

## Backend environment variables (set in Render, never in code)
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CORS_ORIGINS`
