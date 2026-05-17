# 🌌 RAS Hackathon Portal

A production-grade, role-based hackathon operations platform serving as the central nervous system for the **IEEE Robotics & Automation Society (RAS) 2026 Hackathon**.

---

## ️ Architecture & Tech Stack

Built on a modern, type-safe stack designed for high performance and rapid iteration.

### **1. Core Infrastructure**
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Customized with CSS variables for dynamic theming)
- **Authentication:** NextAuth.js v5 — Google/GitHub OAuth + Magic Links
- **Animation:** Framer Motion & GSAP for high-fidelity UI interactions

### **2. Data Layer**
- **Database:** Supabase (Serverless PostgreSQL)
- **ORM:** Prisma with Supavisor connection pooling
- **API Transport:** tRPC (End-to-end type-safe API boundaries)
- **State Management:** React Query (Integrated with tRPC)

### **3. Application Domains (Role-Based Workflows)**
The platform enforces strict RBAC (Role-Based Access Control) across four distinct user groups.

| Domain | Route | Access Level | Description |
|--------|-------|--------------|-------------|
| **Applicant Gateway** | `/apply`, `/dashboard` | `APPLICANT` | Multi-step application wizard, live status tracking, and QR ticket distribution. |
| **Command Center** | `/admin/*` | `ADMIN` | High-level metrics, pipeline funnels, and bulk application management. |
| **Judging Arena** | `/judging` | `JUDGE` | Dedicated mobile-friendly portal for grading projects in real-time. |
| **Logistics/Scanner**| `/scanner` | `STAFF` | Camera-enabled QR scanner for attendee check-ins and meal tracking. |

---

## 🎨 Design System: "Obsidian Command Center"

The UI features a dark-mode-first aesthetic with deep purples, glowing accents, and glassmorphic elements, tailored for a high-tech hackathon atmosphere.

- **Typography:** `Space Grotesk` (Headings) and `Inter` (Body).
- **Visuals:** Spline 3D integration and custom radar sweep animations.
- **Components:** Custom lightweight components replacing bloated external UI libraries.

---

##  Local Development Setup

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
   Create a `.env` file with your Supabase connection strings:
   ```bash
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   ```

3. **Database Initialization**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The portal will be live at `http://localhost:3000`.

---

## 🛡️ GitHub Workflow

We use a **Feature Branch Workflow** to keep `main` stable.

### **Standard Development Workflow**

1. **Sync with main:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Commit and Push:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feat/your-feature-name
   ```

4. **Merge via Pull Request:**
   Open a PR on GitHub, review changes, and merge into `main`.
