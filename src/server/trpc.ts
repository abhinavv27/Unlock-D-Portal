import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { decryptToken } from '@/lib/auth-utils'
import { verifyJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'

// Context
export const createTRPCContext = async (opts: { headers: Headers }) => {
  let staffToken: string | undefined
  let teamToken: string | undefined

  // 1. Try reading authorization header (key for integration tests & api calls)
  const authHeader = opts.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token.includes(':')) {
      staffToken = token
    } else {
      teamToken = token
    }
  }

  // 2. Fallback to cookies
  if (!staffToken && !teamToken) {
    try {
      const cookieHeader = opts.headers.get('cookie')
      if (cookieHeader) {
        const staffMatch = cookieHeader.match(/staff_token=([^;]+)/)
        const teamMatch = cookieHeader.match(/team_token=([^;]+)/)
        if (staffMatch) staffToken = decodeURIComponent(staffMatch[1])
        if (teamMatch) teamToken = decodeURIComponent(teamMatch[1])
      }

      if (!staffToken && !teamToken) {
        const cookieStore = await cookies()
        staffToken = cookieStore.get('staff_token')?.value
        teamToken = cookieStore.get('team_token')?.value
      }
    } catch {
      // cookies() might throw if run outside request context
    }
  }

  let session = null

  if (staffToken) {
    const encryptedPayload = decryptToken(staffToken)
    const jwtPayload = encryptedPayload ? null : verifyJwt(staffToken)
    const decoded = encryptedPayload || (
      jwtPayload?.type === 'staff'
        ? {
            userId: jwtPayload.userId,
            username: jwtPayload.username,
            role: jwtPayload.role,
          }
        : null
    )
    if (decoded && decoded.userId && decoded.role) {
      const userExists = await db.user.findUnique({
        where: { id: decoded.userId }
      })
      if (userExists) {
        session = {
          user: {
            id: String(decoded.userId),
            name: userExists.username,
            email: `${userExists.username}@ras.test`,
            role: userExists.systemRole as string,
          },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        }
      }
    }
  } else if (teamToken) {
    const dbSession = await db.session.findUnique({
      where: { id: teamToken },
      include: { registration: true },
    })
    if (dbSession && dbSession.expiresAt > new Date()) {
      const team = dbSession.registration
      session = {
        user: {
          id: team.id,
          name: team.teamName,
          email: '',
          role: 'TEAM',
        },
        expires: dbSession.expiresAt.toISOString(),
      }
    }
  }

  return {
    db,
    session,
    ...opts,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

// tRPC init
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// ─── Middleware ───────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in to continue.' })
  }
  return next({ 
    ctx: { 
      ...ctx, 
      session: { ...ctx.session, user: ctx.session.user } 
    } 
  })
})

const isAdmin = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (role !== 'ADMIN' && role !== 'JUDGE') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' })
  }
  return next({ ctx })
})

const isStrictAdmin = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' })
  }
  return next({ ctx })
})

const isJudge = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (role !== 'JUDGE' && role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Judge access required.' })
  }
  return next({ ctx })
})

const isStaff = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (!['STAFF', 'ADMIN', 'JUDGE'].includes(role ?? '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required.' })
  }
  return next({ ctx })
})

const isTeam = t.middleware(({ ctx, next }) => {
  const user = ctx.session?.user
  if (!user || user.role !== 'TEAM') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Team access required.' })
  }
  return next({
    ctx: {
      ...ctx,
      team: {
        id: user.id,
      },
    },
  })
})

// ─── Exports ──────────────────────────────────────────────────────────────
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)
export const strictAdminProcedure = t.procedure.use(isAuthed).use(isStrictAdmin)
export const judgeProcedure = t.procedure.use(isAuthed).use(isJudge)
export const staffProcedure = t.procedure.use(isAuthed).use(isStaff)
export const teamProcedure = t.procedure.use(isAuthed).use(isTeam)
