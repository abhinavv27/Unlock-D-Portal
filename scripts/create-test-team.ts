import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth-utils'

const prisma = new PrismaClient()

async function main() {
  const event = await prisma.event.findFirst({ where: { isActive: true } })
  if (!event) {
    console.error('No active event found. Run prisma db seed first.')
    process.exit(1)
  }

  const teamName = 'Test Team'
  const passcode = 'test123'

  const reg = await prisma.registration.create({
    data: {
      eventId: event.id,
      unstopTeamId: 'TEST001',
      teamName,
      teamPasscodeHash: await hashPassword(passcode),
      memberDetails: [{ name: 'Test User', email: 'test@example.com' }],
      progressState: { current_stage: 0, score: 0 },
    },
  })

  console.log('=== Test Team Created ===')
  console.log(`Team Name: ${teamName}`)
  console.log(`Passcode:  ${passcode}`)
  console.log(`Team ID:   ${reg.id}`)
  console.log('')
  console.log('Log in at /login with teamName + passcode')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
