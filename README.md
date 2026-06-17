# UNLOCK'D — IEEE RAS MUJ Hackathon Portal

Role-based operations platform for **UNLOCK'D**, the 24-hour progressive software development challenge by IEEE Robotics & Automation Society, MUJ.

## Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **API:** tRPC + REST endpoints
- **UI:** Base UI (sliders), custom glassmorphic components

## Portal Features

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page with event overview, timeline, judging criteria |
| `/schedule` | Public | 24-hour event schedule (Day 1 + Day 2) |
| `/login` | Public | Staff (admin/judge) and team login |
| `/dashboard` | Team | Roadmap tracker (4 progressive stages), current objective, submission with GitHub + Live Demo URLs, resubmit prompt with judge feedback, submission logs |
| `/judging` | Judge | Live submission queue with time-ago display, 7-criteria scoring (Base UI sliders), GitHub + demo links, approve/reject with feedback, global leaderboard |
| `/admin/*` | Admin | Team management, project overview, bulk import, schedule editor |
| `/scanner` | Staff | QR scanner for check-ins |

## Staff Credentials

- Admin: `admin` / `admin123`
- Judge: `judge` / `judge123`

## Local Development

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Portal at `http://localhost:3000`. Requires `.env` with `DATABASE_URL` and `DIRECT_URL`.
