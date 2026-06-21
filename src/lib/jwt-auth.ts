import { db } from '@/server/db'
import { decryptToken } from './auth-utils'
import { verifyJwt } from './jwt'

export async function authenticateStaff(request: Request) {
  let token: string | null = null

  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  // 2. Fallback: Parse staff_token from cookies
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/staff_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1].trim())
      }
    }
  }

  if (!token) return null

  let decoded = verifyJwt(token)
  if (!decoded || decoded.type !== 'staff' || !decoded.userId) {
    const encryptedPayload = decryptToken(token)
    if (!encryptedPayload || !encryptedPayload.userId || !encryptedPayload.role) return null
    decoded = {
      type: 'staff',
      userId: encryptedPayload.userId,
      username: encryptedPayload.username,
      role: encryptedPayload.role,
    }
  }

  const user = await db.user.findUnique({
    where: { id: decoded.userId }
  })
  
  if (!user) return null

  return {
    userId: user.id,
    username: user.username,
    role: user.systemRole as 'ADMIN' | 'JUDGE',
  }
}

export async function authenticateTeam(request: Request) {
  let token: string | null = null

  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  // 2. Fallback: Parse team_token from cookies
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/team_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1].trim())
      }
    }
  }

  if (!token) return null

  const decoded = verifyJwt(token)
  if (decoded?.type === 'team' && decoded.id) {
    const registration = await db.registration.findUnique({
      where: { id: decoded.id },
      include: { event: true },
    })

    if (!registration || !registration.event.isActive || registration.isBlocked) return null

    return registration
  }

  return null
}
