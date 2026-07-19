# Public Repository Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hackathon portal repo cloneable and runnable by anyone.

**Architecture:** Clean up credentials, fix cross-platform scripts, enhance seed with admin users, and expand README.

**Tech Stack:** Next.js, Prisma, PostgreSQL, TypeScript

---

### Task 1: Clean .env and .env.example

**Files:**
- Modify: `.env` (replace real credentials with placeholders)
- Modify: `.env.example` (update to Neon format, add admin env vars, remove unused OAuth)

- [ ] **Step 1: Replace .env with placeholder values**

```env
# Database Connections (Neon)
DATABASE_URL="postgresql://your_user:your_password@your-endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://your_user:your_password@your-endpoint.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"

# Admin credentials for seed script
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

- [ ] **Step 2: Update .env.example to match**

```env
# Environment Variables — Hackathon Portal
# Copy this to .env and fill in your values

# ─── DATABASE (NEON) ────────────────────────────────────────────────────────
# Get these from your Neon Dashboard -> Connection Details
# Use the pooled connection for DATABASE_URL
DATABASE_URL="postgresql://your_user:your_password@your-endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
# Use the direct connection for DIRECT_URL
DIRECT_URL="postgresql://your_user:your_password@your-endpoint.region.aws.neon.tech/neondb?sslmode=require"

# ─── NEXT AUTH ──────────────────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ─── ADMIN SEED ─────────────────────────────────────────────────────────────
# These values are used by `npm run db:seed` to create the initial admin account
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

- [ ] **Step 3: Commit**

```bash
git add .env .env.example
git commit -m "chore: replace real credentials with placeholders in .env"
```

---

### Task 2: Fix JWT fallback secret

**Files:**
- Modify: `src/lib/jwt.ts:3`

- [ ] **Step 1: Replace hardcoded fallback with error throw**

Change line 3 from:
```typescript
const SECRET = process.env.NEXTAUTH_SECRET || 'unlockd-secret-default-key-for-jwt-signing'
```
To:
```typescript
const SECRET = (() => {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set.')
  }
  return process.env.NEXTAUTH_SECRET
})()
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/jwt.ts
git commit -m "fix: throw error instead of using hardcoded JWT fallback secret"
```

---

### Task 3: Fix package.json scripts for Windows compatibility

**Files:**
- Modify: `package.json:7,15`

- [ ] **Step 1: Replace bash syntax in scripts**

Change `"build"` from:
```json
"build": "DIRECT_URL=${DIRECT_URL:-$DATABASE_URL} prisma db push --accept-data-loss && next build",
```
To:
```json
"build": "prisma db push --accept-data-loss && next build",
```

Change `"postinstall"` from:
```json
"postinstall": "DIRECT_URL=${DIRECT_URL:-$DATABASE_URL} prisma generate"
```
To:
```json
"postinstall": "prisma generate"
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "fix: remove bash-specific syntax from npm scripts for Windows compatibility"
```

---

### Task 4: Enhance seed script with admin user creation

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add admin user creation after events**

Insert after the event creation (after line 79), before the final console.log:

```typescript
  // Create admin user from env vars
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  })

  if (!existingAdmin) {
    const adminPasswordHash = hashPassword(adminPassword)
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: adminPasswordHash,
        plainPassword: adminPassword,
        systemRole: 'ADMIN',
      },
    })
    console.log(`Created admin user: "${adminUsername}"`)
  } else {
    console.log(`Admin user "${adminUsername}" already exists, skipping.`)
  }
```

- [ ] **Step 2: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add admin user creation to seed script via env vars"
```

---

### Task 5: Clean up stray files and Vercel config

**Files:**
- Delete: `git` (stray file)
- Delete: `.vercel/` directory
- Modify: `.gitignore` (add check_error.mjs)

- [ ] **Step 1: Remove stray files**

```bash
del "D:\antigravity work\hackathon_portal\git"
rmdir /s /q "D:\antigravity work\hackathon_portal\.vercel"
```

- [ ] **Step 2: Add check_error.mjs to .gitignore**

Add to `.gitignore`:
```
# scratch
/scratch/

# dev utilities
check_error.mjs
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove stray git file and .vercel directory, gitignore dev utilities"
```

---

### Task 6: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README with full setup instructions**

Full content in implementation step.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: expand README with full setup, database, and deployment instructions"
```
