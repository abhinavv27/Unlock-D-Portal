# Design: Public Repository Preparation

**Date:** 2026-07-19
**Goal:** Make the hackathon portal repo usable by anyone who clones it

## Changes

### 1. Credential & Secret Cleanup

- Replace `.env` real credentials with placeholder values
- Remove hardcoded JWT fallback in `src/lib/jwt.ts:3` — throw error if `NEXTAUTH_SECRET` missing
- Remove hardcoded `localhost:5173` links in `DashboardClient.tsx` and `resources/page.tsx`
- Delete stray `git` file at project root
- Remove `.vercel/` directory
- Add `check_error.mjs` to `.gitignore`

### 2. Seed Script Enhancement

- Add admin user creation to `prisma/seed.ts` using `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Hash passwords using existing PBKDF2 from `auth-utils.ts`
- Create default admin account so staff login works out of the box

### 3. Windows Compatibility

- Fix `package.json` scripts that use bash parameter expansion
- `postinstall`: just `prisma generate`
- `build`: just `prisma db push && next build`

### 4. README Update

Expand existing README with:
- Prerequisites
- Step-by-step local setup
- Database setup (Neon + local PostgreSQL)
- `.env` configuration guide
- Admin credentials section
- Expanded project structure
- Deployment notes
