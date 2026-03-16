# Milene Hinnete Dashboard

Grade tracker for Milene, used by both Milene and her parent on mobile phones. Grades arrive via e-kool.ee email notifications parsed by Claude AI.

## Stack

- Next.js 14 App Router
- Supabase (Postgres + Auth with magic link)
- Tailwind CSS
- Postmark inbound webhook for email parsing
- Anthropic API (claude-sonnet-4-6) for parsing email text into structured data

---

## Setup and Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create milene-hinnete-dashboard --private --push --source=.
```

### 2. Connect repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Click **Deploy** (it will fail until env vars are added — that is expected)

### 3. Add environment variables in Vercel

In your Vercel project go to **Settings > Environment Variables** and add all variables from `.env.local.example`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project Settings > API |
| `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys |
| `POSTMARK_WEBHOOK_SECRET` | Any secret string you choose |
| `ALLOWED_EMAIL_PARENT` | Parent's email address |
| `ALLOWED_EMAIL_STUDENT` | Milene's email address |

After adding all vars, trigger a new deployment from the Vercel dashboard.

### 4. Set up the database in Supabase

1. Go to your Supabase project > **SQL Editor**
2. Paste the contents of `schema.sql` and click **Run**
3. Paste the contents of `seed.sql` and click **Run**

This creates the tables with RLS policies and inserts the 13 existing problem grades.

Also configure the Supabase Auth redirect URL:
1. Go to **Authentication > URL Configuration**
2. Add your Vercel URL to **Redirect URLs**: `https://yourapp.vercel.app/auth/callback`
3. Set **Site URL** to `https://yourapp.vercel.app`

### 5. Set up Postmark inbound webhook

1. In your Postmark account, go to **Inbound** and create or use an existing inbound stream
2. Set the **Webhook URL** to: `https://yourapp.vercel.app/api/inbound`
3. Add a custom header to your Postmark inbound webhook:
   - Header name: `X-Postmark-Secret`
   - Header value: the same string you set as `POSTMARK_WEBHOOK_SECRET` in Vercel
4. Note your Postmark inbound email address (e.g. `abc123@inbound.postmarkapp.com`)

### 6. Test with a real e-kool email

1. Forward one e-kool grade notification email to your Postmark inbound address
2. Wait a few seconds, then refresh the dashboard
3. The new grade should appear as an open card

---

## Local Development

```bash
cp .env.local.example .env.local
# Fill in your values in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local inbound webhook testing, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Use the ngrok HTTPS URL as your Postmark webhook URL during testing
```

---

## Project Structure

```
app/
  login/          — magic link login page
  auth/callback/  — Supabase OAuth callback handler
  dashboard/      — main dashboard (server component + client components)
    components/
      DashboardClient.tsx  — interactive dashboard shell
      GradeCard.tsx        — individual grade card with expand/collapse
      BottomSheet.tsx      — slide-up note input overlay
      SummaryPills.tsx     — scrollable summary row
    actions.ts             — server actions (markDone, addNote, signOut)
    page.tsx               — server component, fetches data
  api/inbound/    — Postmark webhook + Claude parser
lib/
  supabase/       — browser and server Supabase clients
  gradeUtils.ts   — deadline/color helpers
types/index.ts    — shared TypeScript types
middleware.ts     — auth route protection
schema.sql        — database schema
seed.sql          — 13 seed grades
```

---

## How It Works

1. A grade notification arrives from e-kool.ee
2. Forward it to your Postmark inbound address
3. Postmark calls `POST /api/inbound` with the email body
4. Claude parses the Estonian text into structured grade data
5. The grade is saved to Supabase with status `open`
6. Parent and Milene see the new card in the dashboard
7. Either user can mark it done or add a note from their phone
