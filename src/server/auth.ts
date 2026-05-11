import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/server/db'
import type { Role } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM ?? 'noreply@rasportal.com',
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role: Role }).role
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
