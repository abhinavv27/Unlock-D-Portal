import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/auth-utils'
import { db } from '@/server/db'

export const auth = async () => {
  try {
    const cookieStore = await cookies()
    const staffToken = cookieStore.get('staff_token')?.value
    const teamToken = cookieStore.get('team_token')?.value

    if (staffToken) {
      const decoded = decryptToken(staffToken)
      if (decoded && decoded.userId && decoded.role) {
        const userExists = await db.user.findUnique({
          where: { id: decoded.userId }
        })
        if (userExists) {
          return {
            user: {
              id: String(decoded.userId),
              name: decoded.username,
              email: `${decoded.username}@ras.test`,
              role: decoded.role as string, // 'ADMIN' or 'JUDGE'
            },
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          }
        }
      }
    }

    if (teamToken) {
      const team = await db.registration.findUnique({
        where: { id: teamToken },
      })
      if (team) {
        return {
          user: {
            id: team.id,
            name: team.teamName,
            email: "",
            role: "TEAM",
          },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        }
      }
    }
  } catch (error) {
    console.error("auth helper error:", error)
  }

  return null
}
