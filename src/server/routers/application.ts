import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'

export const applicationRouter = createTRPCRouter({
  // Submit a new application
  submit: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      university: z.string().min(1),
      graduationYear: z.number().int().min(2024).max(2030),
      major: z.string().min(1),
      country: z.string().optional(),
      experience: z.enum(['beginner', 'intermediate', 'advanced']),
      teamPreference: z.enum(['solo', 'have-team', 'looking']),
      projectIdea: z.string().max(2000).optional(),
      dietaryRestrictions: z.string().optional(),
      tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional(),
      needsHardware: z.boolean().default(false),
      githubUrl: z.string().url().optional().or(z.literal('')),
      linkedinUrl: z.string().url().optional().or(z.literal('')),
      portfolioUrl: z.string().url().optional().or(z.literal('')),
      resumeUrl: z.string().url().optional().or(z.literal('')),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      const existing = await ctx.db.application.findUnique({ where: { userId } })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already submitted an application.' })
      }
      return ctx.db.application.create({
        data: { ...input, userId },
      })
    }),

  // Get own application
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.application.findUnique({
      where: { userId: ctx.session!.user.id },
    })
  }),

  // Admin: get all applications
  getAll: adminProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN', 'ALL']).default('ALL'),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { status, search, page, limit } = input
      const where = {
        ...(status !== 'ALL' ? { status } : {}),
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { university: { contains: search, mode: 'insensitive' as const } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
          ],
        } : {}),
      }
      const [applications, total] = await Promise.all([
        ctx.db.application.findMany({
          where,
          include: { user: { select: { email: true, image: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { submittedAt: 'desc' },
        }),
        ctx.db.application.count({ where }),
      ])
      return { applications, total, pages: Math.ceil(total / limit) }
    }),

  // Admin: update status
  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.application.update({
        where: { id: input.id },
        data: {
          status: input.status,
          adminNotes: input.notes,
          reviewedAt: new Date(),
          reviewedBy: ctx.session!.user.id,
        },
      })
    }),

  // Admin: bulk update status
  bulkUpdateStatus: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1),
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.application.updateMany({
        where: { id: { in: input.ids } },
        data: {
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: ctx.session!.user.id,
        },
      })
    }),

  // Admin: pipeline stats
  pipelineStats: adminProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db.application.groupBy({
      by: ['status'],
      _count: true,
    })
    const total = counts.reduce((sum, c) => sum + c._count, 0)
    const map = Object.fromEntries(counts.map(c => [c.status, c._count]))
    return {
      total,
      pending: map.PENDING ?? 0,
      under_review: map.UNDER_REVIEW ?? 0,
      accepted: map.ACCEPTED ?? 0,
      waitlisted: map.WAITLISTED ?? 0,
      rejected: map.REJECTED ?? 0,
    }
  }),
})
