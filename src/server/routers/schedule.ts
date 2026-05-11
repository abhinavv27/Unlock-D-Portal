import { z } from 'zod'
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc'

export const scheduleRouter = createTRPCRouter({
  // Public: get all public events
  getEvents: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.scheduleEvent.findMany({
      where: { isPublic: true },
      orderBy: { startTime: 'asc' },
    })
  }),

  // Admin: get all events (including private)
  getAllEvents: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.scheduleEvent.findMany({ orderBy: { startTime: 'asc' } })
  }),

  // Admin: create event
  createEvent: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.date(),
      endTime: z.date(),
      type: z.enum(['GENERAL', 'WORKSHOP', 'MEAL', 'JUDGING', 'CEREMONY', 'SPONSOR']),
      isPublic: z.boolean().default(true),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.scheduleEvent.create({ data: input })
    }),

  // Admin: update event
  updateEvent: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      type: z.enum(['GENERAL', 'WORKSHOP', 'MEAL', 'JUDGING', 'CEREMONY', 'SPONSOR']).optional(),
      isPublic: z.boolean().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.scheduleEvent.update({ where: { id }, data })
    }),

  // Admin: delete event
  deleteEvent: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.scheduleEvent.delete({ where: { id: input.id } })
    }),
})
