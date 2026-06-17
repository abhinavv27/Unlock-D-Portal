import { createTRPCRouter, publicProcedure } from '@/server/trpc'

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),
})
