import { z } from 'zod'
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc'

export const scheduleRouter = createTRPCRouter({
  // Public: get all public events
  getEvents: publicProcedure.query(async () => {
    return []
  }),

  // Admin: get all events (including private)
  getAllEvents: adminProcedure.query(async () => {
    return []
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
    .mutation(async ({ input }) => {
      return { id: 'mock-id', ...input }
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
    .mutation(async ({ input }) => {
      return input
    }),

  // Admin: delete event
  deleteEvent: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { id: input.id }
    }),
})
