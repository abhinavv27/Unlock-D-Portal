# UNLOCK'D — IEEE RAS MUJ Hackathon Portal

Unlock'D is a role-based operations platform that manages **Unlock'D**, the 24-hour progressive software development challenge and CTF events organized by **IEEE Robotics & Automation Society (RAS), MUJ**. It drives progressive team progression, enables real-time scoring and multi-judge feedback, automates roster ingestion, and features an immersive glassmorphic dark-theme UI.

---

## Tech Stack

| Layer | Technology | Key Modules & Usage |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server Components, Route Handlers, Turbopack |
| **Database** | PostgreSQL (Neon) | Serverless via connection pooling |
| **ORM** | Prisma ORM | Schema migrations, type-safe queries |
| **API Architecture** | tRPC (v11) + REST | End-to-end type safety, React Query |
| **Styling** | Tailwind CSS + CSS Modules | Glassmorphism UI, fluid layouts |
| **Animations & 3D** | Framer Motion + Spline 3D | Micro-interactions, 3D robots |
| **Authentication** | Custom Session Tokens & JWTs | PBKDF2 hashing, AES-256-GCM cookies |
| **Components** | Radix UI + Base UI + Lucide | Sliders, dropdowns, accessible primitives |

---

## Database Schema

![Database Schema](public/db-schema.png)

---

## Architecture & Event Lifecycle

Unlock'D runs on a **Progressive Hackathon Roadmap Engine**.

```mermaid
graph TD
    A[Roster Ingestion via Admin Panel] -->|CSV Upload| B(Generate Passcodes & Create Teams)
    B --> C{Event Round Status}
    C -->|Round 0| D[Stand-by Landing Page]
    C -->|Round 1| E[Team Submission Active]
    E -->|GitHub/Demo Submission| F[Judge Evaluation Queue]
    F -->|Fail / Rejection| E
    F -->|Pass / Approval| G{All Tasks Complete?}
    G -->|No| E
    G -->|Yes| H[Synchronized Waiting Room]
    I[Admin advances Global Ceiling to Round 2] --> H
    H -->|CEILING LIFTED| J[Unlock Round 2 Submissions]
```

### Progressive State Engine
- **Round 0 (Setup)**: Submissions disabled. Teams see a stand-by page.
- **Round 1+ (Sprints)**: Teams submit tasks with GitHub URL, demo URL, and descriptions.
- **Synchronized Waiting Room**: Teams that finish all milestones wait until the admin advances the global round ceiling.

### Multi-Judge Grading
- Real-time dashboard ordered chronologically with a time-ago counter.
- Judges grade across **7 criteria** (max 100) using Base UI Sliders.
- Consolidated multi-judge feedback and live leaderboards.

---

## Security

- **Rate Limiting**: Sliding window — max 5 login requests/min/IP on auth routes.
- **PBKDF2 Hashing**: 600,000 iterations (HMAC-SHA512) with unique salts.
- **AES-256-GCM**: Staff session tokens encrypted via `NEXTAUTH_SECRET`.
- **Timing Attack Defenses**: `crypto.timingSafeEqual` for password comparison.
- **HTTP-Only Cookies**: JWTs and session UUIDs via Secure, SameSite cookies.

---

## Local Setup

### Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** — a local instance or a cloud database (Neon free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hackathon_portal.git
cd hackathon_portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Username for the admin account (default: `admin`) |
| `ADMIN_PASSWORD` | Password for the admin account (default: `admin123`) |

#### Using Neon (free tier)

1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the **pooled** connection string as `DATABASE_URL`
4. Copy the **direct** connection string as `DIRECT_URL`

#### Using a local PostgreSQL

If you have PostgreSQL running locally:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hackathon_portal?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/hackathon_portal?schema=public"
```

### 4. Initialize the database

```bash
npx prisma db push
```

This creates all tables based on the schema in `prisma/schema.prisma`.

### 5. Seed the database

```bash
npm run db:seed
```

This creates:
- Two events: **UnlockD Progressive Hackathon** and **RAS Capture The Flag**
- An admin user with the credentials from your `.env` file (default: `admin` / `admin123`)

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Staff login

Navigate to `/login` and use the **Staff** tab. Enter the admin credentials from your `.env` file.

---

## Project Structure

```
src/
├── app/              # App Router pages + API routes
│   ├── admin/        # Admin dashboard, applications, imports, grading
│   ├── api/          # REST API routes (auth, submissions, evaluations)
│   ├── dashboard/    # Team dashboard
│   ├── judging/      # Judge evaluation interface
│   ├── login/        # Dual-tab login (Teams + Staff)
│   ├── mentor/       # Mentor session interface
│   └── resources/    # Participant resources
├── components/       # Navbar, SplineRobot 3D, sponsor marquee
├── lib/              # auth-utils, csv-parser, state-engine, jwt
├── server/           # tRPC routers, Prisma client, middleware
├── trpc/             # tRPC client setup (React Query, server caller)
└── proxy.ts          # Rate limiting + route guard middleware

prisma/
├── schema.prisma     # Database schema (10 models)
└── seed.ts           # Seed script (events + admin user)

UnlockD-Master-Repo/ # Starter repo template for hackathon participants
```

---

## Team Roster CSV Format (For Ingestion)

```csv
Team Id,Team Name,Email
unstop_101,CyberTitans,cyber.titans@test.com
unstop_102,DeltaForce,delta.force@test.com
```

Passcodes are generated once and shown as plain text upon successful upload via the admin panel.

---

## Deployment

This project is configured for Vercel deployment. Push to a GitHub repository and import it in the Vercel dashboard.

For the build command, ensure `DATABASE_URL` and `DIRECT_URL` are set in your Vercel environment variables.

---

## License

MIT
