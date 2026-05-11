# 🌌 RAS Hackathon Portal

A production-grade, role-based hackathon operations platform serving as the central nervous system for hacker applications, judging, staff operations, and sponsor management.

---

## 🏗️ Architecture & Tech Stack

This repository follows a customized [T3 Stack](https://create.t3.gg/) methodology to provide a highly robust, type-safe, and rapidly iterable architecture.

### **1. Core Infrastructure**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v3 (Customized for CSS-variable opacity modifications)
- **Authentication:** Auth.js (NextAuth v5 Beta) — Google/GitHub OAuth + Resend Magic Links

### **2. Data Layer**
- **Database:** Supabase (Serverless PostgreSQL)
- **ORM:** Prisma 6 with Supavisor connection pooling.
- **API Transport:** tRPC (End-to-end type-safe API boundaries connecting React Server Components and Client Components).
- **State Management:** React Query (Integrated with tRPC for caching, background fetching, and invalidation).

### **3. Application Domains (Role-Based Workflows)**
The platform enforces strict RBAC (Role-Based Access Control) through tRPC middlewares and NextAuth session parsing.

| Domain | Route | Access Level | Description |
|--------|-------|--------------|-------------|
| **Applicant Gateway** | `/apply`, `/dashboard` | `APPLICANT` | Multi-step application wizard, live status tracking, and QR ticket distribution. |
| **Command Center** | `/admin/*` | `ADMIN`, `SUPER_ADMIN` | High-level metrics, pipeline funnels, and bulk application management. |
| **Judging Arena** | `/judging` | `JUDGE` | Dedicated iPad/mobile-friendly portal for grading projects. |
| **Logistics/Scanner**| `/scanner` | `STAFF` | Camera-enabled QR scanner for attendee check-ins and meal tracking. |

---

## 🎨 Design System: "Obsidian Command Center"

The UI is built on a dark-mode-first aesthetic with deep purples, glowing accents, and glassmorphic elements. 

- **Typography:** `Space Grotesk` (Headings) and `Inter` (Body).
- **Core Tokens:** Maintained exclusively in `globals.css` using CSS variables (`--bg-base`, `--accent-primary`) to ensure seamless scaling.
- **Components:** Custom lightweight components (animated sliders, CSS-grid data tables) replacing bloated external UI libraries.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Git
- Supabase Account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file from the connection strings in your Supabase Dashboard:
   ```bash
   DATABASE_URL="postgresql://postgres.[REF]:[PW]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[REF]:[PW]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
   ```

3. **Database Initialization & Seeding**
   Push the schema to Supabase and seed it with test data:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The portal will be live at `http://localhost:3000`. (If port 3000 is taken, Next.js will use `3001`).

---

## 🛡️ GitHub Workflow & Contribution Guide

To maintain a clean and structured codebase, we use a **Feature Branch Workflow**. This ensures `main` is always stable and ready for production deployment.

### **Initial Setup (Your First Push)**
If you haven't pushed the repository to GitHub yet, run these commands:
```bash
git init
git add .
git commit -m "Initial commit: Platform scaffolding and local environment setup"
git branch -M main
git remote add origin https://github.com/your-username/ras-portal.git
git push -u origin main
```

### **Standard Development Workflow (How to work on new features)**

**NEVER PUSH DIRECTLY TO `main`!** Always follow these steps:

1. **Ensure your local `main` is up to date:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch for your task:**
   Use a descriptive prefix like `feat/`, `fix/`, `chore/`, or `refactor/`.
   ```bash
   git checkout -b feat/judging-dashboard
   ```

3. **Write code and commit your changes:**
   We recommend writing clear, atomic commits using semantic messages.
   ```bash
   git add .
   git commit -m "feat: implement sliding judging scale component"
   ```

4. **Push your branch to GitHub:**
   ```bash
   git push -u origin feat/judging-dashboard
   ```

5. **Open a Pull Request (PR):**
   - Go to the repository on GitHub.
   - Click **"Compare & pull request"**.
   - Add a brief description of what you changed.
   - Once reviewed and approved (or if you're a solo dev, once you've verified it works), **Squash and Merge** the PR into `main`.

6. **Cleanup:**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feat/judging-dashboard  # Deletes the local branch
   ```