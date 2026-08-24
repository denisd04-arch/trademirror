# TradeMirror

TradeMirror is a professional XAUUSD trading signal calculator. Upload a screenshot, paste a signal, or enter manually — get precise lot size, risk, and profit in seconds.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Supabase (Auth, PostgreSQL, Storage)
- React Router
- Zod
- Lucide React
- Vercel Serverless Functions (AI screenshot parsing)

## Features

- Guest mode — no registration required
- Screenshot AI signal extraction (server-side)
- Universal text parser
- Manual signal input
- Deterministic XAUUSD lot/risk/profit/CRV calculations
- Strategy management for authenticated users
- Supabase Auth with email verification
- Row Level Security on all user data

## Local Installation

```bash
git clone https://github.com/denisd04-arch/trademirror.git
cd trademirror
npm install
cp .env.example .env
```

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `OPENAI_API_KEY` | OpenAI API key (Vercel server only) |
| `VITE_AI_PARSER_ENABLED` | Set `true` to enable screenshot parsing |

**Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in frontend code.

## Supabase Setup

1. Create or use the Supabase project at `https://gmihnbcyaxnabdfhrftv.supabase.co`
2. Apply migrations from `supabase/migrations/`
3. Enable Email auth in Supabase Dashboard
4. Set Site URL and redirect URLs:
   - `http://localhost:5173`
   - `https://your-vercel-domain.vercel.app`
   - Redirect paths: `/verify-email`, `/reset-password`

### Database Migrations

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase SQL Editor
# Run: supabase/migrations/20260824164400_initial_schema.sql
```

## Authentication Setup

- Email/password registration with mandatory email verification
- Profile auto-created on signup via database trigger
- Password reset via Supabase secure flow

## AI Configuration

Screenshot parsing runs server-side via `/api/parse-screenshot`:

1. Set `OPENAI_API_KEY` in Vercel environment variables
2. Set `VITE_AI_PARSER_ENABLED=true` in Vercel (and local `.env` for testing)
3. The frontend calls the Vercel function — AI secrets never reach the browser

## Local Development

```bash
npm run dev
```

For API testing locally, use Vercel CLI:

```bash
npx vercel dev
```

## Production Build

```bash
npm run build
npm run test
npm run lint
```

## Vercel Deployment

1. Connect the GitHub repository to Vercel
2. Framework preset: Vite
3. Set environment variables in Vercel dashboard
4. Deploy — SPA routing is configured in `vercel.json`

## Routes

| Route | Access |
|-------|--------|
| `/` | Guest + Auth |
| `/trade` | Guest + Auth |
| `/login` | Public |
| `/register` | Public |
| `/account` | Authenticated + Verified |
| `/strategies` | Authenticated + Verified |

## Calculation Engine

Central function: `src/calculations/calculateTrade.ts`

- Contract size: 100 (XAUUSD)
- Minimum lot: 0.01 (always rounded UP)
- No spread, commission, swap, or fees

## Future MT5 Architecture

```
TradeMirror → Execution API → MT5 Expert Advisor → Broker
```

Trade payloads are structured for future execution integration.

## GitHub Workflow

```bash
git checkout -b feature/my-change
# make changes
npm run build && npm run test
git commit -m "Description"
git push origin feature/my-change
```

## License

Private — All rights reserved.
