# Sustainable Harvest Solutions — Full-Stack App

A live Next.js app built on top of the original **UCS310 DBMS coursework**
(`sustainable-harvest-solutions-dbms.zip`). The MySQL schema, functions,
procedures, cursors and triggers from that project have been converted to
PostgreSQL and wired up behind a real login + dashboard, ready to deploy on
Vercel.

## What's in here

- **Auth** — farmers log in against the `login` table (bcrypt-hashed
  passwords), session stored in a signed HTTP-only cookie.
- **Self-service registration with email OTP** — new farmers create their
  own account at `/register`. The flow is: enter email → we email a 6-digit
  code → enter the code → fill in the rest of the profile → account is
  created. See "Email / OTP setup" below for the required env vars.
- **English / Hindi UI toggle** — an EN / हिं switch in the navbar lets each
  visitor pick their interface language; the choice is remembered in a
  cookie. Static page text is translated; farmer-entered and seeded data
  (crop names, regions, etc.) is shown as stored.
- **Dashboard** — pulls the logged-in farmer's profile from `user_farmer`.
- **Crops & Climate** — browse climate zones and the crop breeds mapped to
  each one (`climate`, `crops_climate`, `crops_vegetable`).
- **Breed detail page** — calls the SQL functions directly:
  `get_total_fertilizer_cost`, `get_total_herbicide_cost`,
  `get_market_price_difference`. Logged-in users can also update a breed's
  market prices, which calls the `update_market_prices` **procedure** and
  fires the `after_update_market_prices` **trigger** (writes to
  `market_history`).
- **Market** — government subsidy vs. open market price table for every
  priced breed.
- **Biopesticides** — catalog page.

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL + SESSION_SECRET + SMTP_*
npm run db:migrate           # applies db/schema.sql
npm run db:seed              # loads sample data (see db/seed.mjs)
npm run dev
```

Demo logins after seeding: `1 / bikram123`, `2 / vishal123`, `3 / aaditya123`.
New accounts can also be created directly from the app at `/register`
(requires SMTP env vars to be set — see below).

## Email / OTP setup

Registration emails a one-time 6-digit code before an account is created.
This needs SMTP credentials in `.env.local`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=you@gmail.com   # optional, defaults to SMTP_USER
```

Any SMTP provider works (Gmail, Outlook, SendGrid, Mailgun, Resend, etc).
For Gmail specifically, you must generate an **App Password** (Google
Account → Security → 2-Step Verification → App passwords) — your normal
Gmail password will not work here. Without valid SMTP credentials, the
"Send verification code" step will return an error explaining what's
missing.

You need a Postgres database for `DATABASE_URL` — either a local Postgres
install, or (recommended, since it's free and works from anywhere) a hosted
one from the next section.

## 2. Deploying — Vercel + Neon (free tier of both)

Vercel hosts the Next.js app; it does **not** host the database itself, so
you pair it with a hosted Postgres. Neon is the easiest free option and has
a one-click Vercel integration.

1. **Push this project to a GitHub repo.**
2. **Create the database:**
   - Go to [neon.tech](https://neon.tech) → New Project → copy the
     connection string it gives you (starts with `postgres://...`,
     include `?sslmode=require`).
   - *Or*, inside your Vercel project once it exists: **Storage → Create
     Database → Postgres (powered by Neon)** — this sets `DATABASE_URL`
     for you automatically.
3. **Apply the schema** — from your machine, with `DATABASE_URL` pointed at
   the new Neon database in `.env.local`:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. **Import the project on [vercel.com/new](https://vercel.com/new)**,
   selecting this repo. Framework preset auto-detects Next.js.
5. **Add environment variables** in the Vercel project settings:
   - `DATABASE_URL` — the Neon connection string (skip this if you used the
     Vercel × Neon storage integration, it's already set).
   - `SESSION_SECRET` — any long random string (`openssl rand -base64 32`).
6. **Deploy.** Vercel builds and gives you a `*.vercel.app` URL.

That's it — the same schema, functions, procedures, and triggers from the
original coursework are now backing a real deployed site.

## 3. Project structure

```
db/
  schema.sql   -- tables + functions + procedures + triggers (PostgreSQL)
  seed.mjs     -- sample data loader (bcrypt-hashes the demo passwords)
src/
  app/         -- Next.js App Router pages + API routes
  components/  -- shared UI (nav bar, forms)
  lib/db.ts    -- pg connection pool
  lib/auth.ts  -- session cookie helpers
```

## 4. Notes / known simplifications

- Every logged-in farmer can currently update market prices — the original
  project didn't define separate admin vs. farmer roles, so this mirrors
  that. Add a `role` column + a check in `/api/market/update` if you want
  to restrict it.
- `login.user_id` was re-seeded to match `user_farmer.user_id` (`1`, `2`,
  `3`) — in the original report's sample data the two tables used
  different id schemes (`bikram`/`aditya` vs. `1`/`2`/`3`) and never
  actually joined.
- See the original `sustainable-harvest-solutions-dbms/README.md` for the
  list of bugs fixed in the SQL itself (missing `COST` column, cursor
  logic bug, missing history tables, etc.) — all of those fixes carried
  over into `db/schema.sql`.
