import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/server/db'
import { verifyJwt } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamToken = cookieStore.get('team_token')?.value
    if (teamToken) {
      const decoded = verifyJwt(teamToken)
      if (decoded?.type === 'team' && decoded.id) {
        // Delete the session record
        await db.session.deleteMany({
          where: { registrationId: decoded.id }
        })
        
        // Log LOGOUT action
        await db.teamSessionLog.create({
          data: {
            registrationId: decoded.id,
            action: 'LOGOUT',
          }
        })
      }
    }
  } catch (error) {
    console.error('Logout log error:', error)
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('team_token')
  response.cookies.delete('staff_token')
  return response
}
