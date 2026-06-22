import { PrismaClient } from '@prisma/client'
import { getTeamStatus } from '../src/lib/state-engine'

const prisma = new PrismaClient()

async function main() {
  const activeEvent = await prisma.event.findFirst({
    where: { isActive: true }
  })
  if (!activeEvent) {
    console.log('No active event found!')
    return
  }
  const config = (activeEvent.config as any) || {}
  const eventRound = config.currentRound ?? 0
  console.log(`Active Event: "${activeEvent.name}" (ID: ${activeEvent.id})`)
  console.log(`Event Current Round: ${eventRound}`)

  const teams = await prisma.registration.findMany()
  console.log(`\nTotal Teams: ${teams.length}`)
  for (const team of teams) {
    const status = await getTeamStatus(team.id, prisma)
    console.log(`- Team: "${team.teamName}" | allowedRound: ${status.allowedRound} | highestState: ${status.highestState} | isEliminated: ${status.allowedRound < eventRound} | inWaitingRoom: ${status.allowedRound > eventRound}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
