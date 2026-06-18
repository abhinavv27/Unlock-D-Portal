import { createTRPCRouter, createCallerFactory } from '@/server/trpc'
import { applicationRouter } from './application'
import { judgingRouter } from './judging'
import { scheduleRouter } from './schedule'
import { scannerRouter } from './scanner'
import { authRouter } from './auth'
import { teamsRouter } from './teams'

export const appRouter = createTRPCRouter({
  application: applicationRouter,
  judging: judgingRouter,
  schedule: scheduleRouter,
  scanner: scannerRouter,
  auth: authRouter,
  teams: teamsRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
