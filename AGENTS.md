# AGENTS.md

## Cursor Cloud specific instructions

TradeMirror is a single-product Vite + React 19 + TypeScript SPA — a XAUUSD (gold) trading signal calculator. The core calculator (paste/manual signal → lot size, risk, profit, CRV) runs fully client-side and needs no backend, so it can be developed and tested in guest mode without any secrets. Standard scripts live in `package.json` (`dev`, `build`, `lint`, `test`, `preview`); run them with `npm`.

Service overview and non-obvious notes:

- Web frontend (Vite SPA): `npm run dev` serves on `http://localhost:5173`. This is the only long-running service needed for most development.
- Supabase (Auth + Postgres + Storage) is only required for auth-gated features (`/login`, `/register`, `/account`, `/strategies`). Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the client falls back to placeholder values (see `src/lib/supabase.ts`) and logs a warning; the guest-mode calculator still works. To exercise auth features, provide real Supabase credentials in `.env` and apply `supabase/migrations/`.
- AI screenshot parser (`/api/parse-screenshot`, a Vercel serverless function) is optional and feature-flagged off by default (`VITE_AI_PARSER_ENABLED=false`). It requires `npx vercel dev` plus an OpenAI key. The Paste and Manual input modes do not need it.

Gotchas:

- `.env` is required for a clean start: copy it from `.env.example` (`cp .env.example .env`). It is gitignored.
- `npm run lint` (oxlint) currently emits warnings but exits 0 — warnings are pre-existing and not failures.
- `npm run build` runs `tsc -b && vite build`; it emits a chunk-size warning (>500 kB) which is expected, not an error.
