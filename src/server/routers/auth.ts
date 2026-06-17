import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { auth } from '@/server/auth'

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async () => {
    return await auth()
  }),
})
