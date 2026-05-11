# 🌌 RAS Hackathon Portal

A production-grade, role-based hackathon operations platform serving as the central nervous system for hacker applications, judging, staff operations, and sponsor management.

![RAS Portal Landing Page](https://github.com/your-username/ras-portal/assets/placeholder.png)

## 🏗️ Architecture & Tech Stack

This repository follows a customized [T3 Stack](https://create.t3.gg/) methodology to provide a highly robust, type-safe, and rapidly iterable architecture.

### **1. Core Infrastructure**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v3 (Customized for CSS-variable opacity modifications)
- **Authentication:** Auth.js (NextAuth v5 Beta) — Google/GitHub OAuth + Resend Magic Links

### **2. Data Layer**
- **Database:** CockroachDB (Serverless PostgreSQL wire protocol)
- **ORM:** Prisma 7 (with `@prisma/adapter-pg` driver for edge-compatible connection pooling)
- **API Transport:** tRPC (End-to-end type-safe API boundaries)
- **State Management:** React Query (integrated with tRPC for caching and invalidation)

### **3. Application Domains (Role-Based Workflows)**
The platform enforces strict RBAC (Role-Based Access Control) through tRPC middlewares and NextAuth session parsing.

| Domain | Route | Access Level | Description |
|--------|-------|--------------|-------------|
| **Applicant Gateway** | `/apply`, `/dashboard` | `APPLICANT` | Multi-step application wizard, live status tracking, and QR ticket distribution. |
| **Command Center** | `/admin/*` | `ADMIN`, `SUPER_ADMIN` | High-level metrics, pipeline funnels, and bulk application management (Accept/Reject). |
| **Judging Arena** | `/judging` | `JUDGE` | Dedicated iPad/mobile-friendly portal for grading projects across 4 dimensions (Innovation, Technical, Presentation, Impact). |
| **Logistics/Scanner**| `/scanner` | `STAFF` | Camera-enabled QR scanner for attendee check-ins and meal tracking (Friday Dinner, Sat Lunch, etc). |

---

## 🎨 Design System: "Obsidian Command Center"

The UI is built on a dark-mode-first aesthetic with deep purples, glowing accents, and glassmorphic elements. 

- **Typography:** `Space Grotesk` (Headings) and `Inter` (Body).
- **Core Tokens:** Maintained exclusively in `globals.css` using CSS variables (`--bg-base`, `--accent-primary`) to ensure seamless scaling.
- **Components:** Custom lightweight components instead of bloated libraries (e.g., custom animated slider for judging, CSS-grid data tables for admin).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database instance (CockroachDB recommended)
- Google/GitHub OAuth credentials
- Resend API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ras-portal.git
   cd ras-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your secrets:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `DATABASE_URL` is a valid Postgres connection string).*

4. **Database Initialization**
   Sync the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   The portal will be live at `http://localhost:3000`.

---

## 🛡️ Git Workflow & Branching Strategy

This project adheres to the **Feature Branch Workflow** (GitHub Flow). To ensure `main` remains perfectly stable for automated deployments:

1. **Never push directly to `main`.**
2. **Create a branch** for your work: `git checkout -b feature/judging-ui` or `fix/scanner-bug`.
3. **Commit often** using semantic commit messages (e.g., `feat: add QR scanner`, `fix: resolve prisma client error`).
4. **Push the branch** to GitHub: `git push -u origin feature/judging-ui`.
5. **Open a Pull Request (PR)** against `main`. Review the code, ensure the Vercel/Netlify preview builds successfully, and then merge.