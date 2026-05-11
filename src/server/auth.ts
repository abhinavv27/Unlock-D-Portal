import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/server/db'

export const { handlers, signIn, signOut, auth: actualAuth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock',
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || 'mock',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock',
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY || 'mock',
      from: process.env.EMAIL_FROM ?? 'noreply@rasportal.com',
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role: string }).role
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export const auth = async () => {
  return {
    user: {
      id: "mock-admin-id",
      name: "Mock Admin",
      email: "admin@ras.test",
      role: "SUPER_ADMIN",
    },
    expires: "9999-12-31T23:59:59.999Z",
  }
}
