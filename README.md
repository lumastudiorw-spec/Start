# Marbury Studio — plumbing interview bot

Research MVP: a conversational interview that asks UK plumbers and
plumbing-business owners about how they currently handle enquiries,
quoting and admin — to find out what's actually worth building, before
anything gets built.

Next.js (App Router) + TypeScript + Tailwind, Supabase for storage, the
Anthropic API for controlled follow-up questions and tagging. No separate
backend — everything server-side runs as Next.js Route Handlers, deployed
to Vercel.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase project
     Settings -> API. The service role key is server-only; it is never sent
     to the browser.
   - `ANTHROPIC_API_KEY` — console.anthropic.com -> API Keys.
3. Apply the database schema: open the Supabase project's SQL editor and
   run `supabase/migrations/0001_init.sql`. (There's currently just the one
   migration — add new ones as `000N_description.sql` and run them in
   order as the schema evolves.)
4. `npm run dev` and open `http://localhost:3000`.

## Project structure

- `src/lib/questionBank.ts` — the fixed interview script. The AI never
  alters this text; it may only pick a follow-up from a fixed menu.
- `src/lib/interviewStateMachine.ts` — pure, deterministic progression
  through the script (no DB, no LLM). `scripts/sanity-check-state-machine.ts`
  exercises every branch.
- `src/lib/problemTaxonomy.ts` — the closed set of admin-problem
  categories, shared between the question bank, the DB seed, and the
  AI tagging prompt.
- `supabase/migrations/` — SQL schema, applied manually via the Supabase
  SQL editor (see Setup above).
- `src/components/intro/` — the Marbury Studio intro animation shown
  before consent (10 scenes, ~76s, captions burned in as text since
  there's no voiceover yet). Built entirely in code (SVG + CSS
  transitions) rather than a rendered video file — `scenes.tsx` holds
  the per-scene content/timing, `IntroAnimation.tsx` is the timeline
  orchestrator.

## Commands

```bash
npm run dev             # local dev server
npm run build            # production build
npm run lint             # eslint
npx tsc --noEmit          # typecheck
npx tsx scripts/sanity-check-state-machine.ts   # state machine sanity checks
```
