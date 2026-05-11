import { createTRPCRouter, createCallerFactory } from '@/server/trpc'
import { applicationRouter } from './application'
import { judgingRouter } from './judging'
import { scheduleRouter } from './schedule'
import { scannerRouter } from './scanner'

export const appRouter = createTRPCRouter({
  application: applicationRouter,
  judging: judgingRouter,
  schedule: scheduleRouter,
  scanner: scannerRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
