import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/auth-utils'
import { verifyJwt } from '@/lib/jwt'
import { db } from '@/server/db'

export const auth = async () => {
  try {
    const cookieStore = await cookies()
    const staffToken = cookieStore.get('staff_token')?.value
    const teamToken = cookieStore.get('team_token')?.value

    if (staffToken) {
      const encryptedPayload = decryptToken(staffToken)
      const jwtPayload = encryptedPayload ? null : verifyJwt(staffToken)
      const decoded = encryptedPayload || (
        jwtPayload?.type === 'staff'
          ? {
              userId: jwtPayload.userId,
              username: jwtPayload.username,
              role: jwtPayload.role,
            }
          : null
      )
      if (decoded && decoded.userId && decoded.role) {
        const userExists = await db.user.findUnique({
          where: { id: decoded.userId }
        })
        if (userExists) {
          return {
            user: {
              id: String(decoded.userId),
              name: userExists.username,
              email: `${userExists.username}@ras.test`,
              role: userExists.systemRole as string,
            },
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          }
        }
      }
    }
    if (teamToken) {
      const dbSession = await db.session.findUnique({
        where: { id: teamToken },
        include: { registration: true },
      })
      if (dbSession && dbSession.expiresAt > new Date()) {
        const team = dbSession.registration
        return {
          user: {
            id: team.id,
            name: team.teamName,
            email: "",
            role: "TEAM",
          },
          expires: dbSession.expiresAt.toISOString(),
        }
      }
    }
  } catch (error) {
    console.error("auth helper error:", error)
  }

  return null
}
