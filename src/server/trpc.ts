import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import superjson from 'superjson'
import { ZodError } from 'zod'

// Context
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()
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
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' })
  }
  return next({ ctx })
})

const isJudge = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (role !== 'JUDGE' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Judge access required.' })
  }
  return next({ ctx })
})

const isStaff = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role
  if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(role ?? '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required.' })
  }
  return next({ ctx })
})

// ─── Exports ──────────────────────────────────────────────────────────────
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)
export const judgeProcedure = t.procedure.use(isAuthed).use(isJudge)
export const staffProcedure = t.procedure.use(isAuthed).use(isStaff)
