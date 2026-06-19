import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamToken = cookieStore.get('team_token')?.value
    if (teamToken) {
      await db.session.delete({ where: { id: teamToken } }).catch(() => {})
    }
  } catch (error) {
    console.error('Logout error clearing database session:', error)
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('team_token')
  response.cookies.delete('staff_token')
  return response
}
