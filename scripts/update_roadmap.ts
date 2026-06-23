import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: {
      eventType: 'PROGRESSIVE_HACKATHON'
    }
  })

  for (const event of events) {
    if (!event.config) continue
    
    let config = event.config as any
    if (config && Array.isArray(config.roadmap)) {
      const hasFinalFeature = config.roadmap.some((r: any) => r.task_id === 'FINAL-FEATURE')
      if (!hasFinalFeature) {
        config.roadmap.push({
          step: 7,
          task_id: 'FINAL-FEATURE',
          round: 1,
          rubric: ['functionality', 'code_quality'],
          title: 'Final Feature - Presentation Ready',
          description: 'Ensure the final feature set is fully integrated and the product is ready for round 1 evaluation.'
        })
        
        await prisma.event.update({
          where: { id: event.id },
          data: { config }
        })
        console.log(`Updated event ${event.id} with FINAL-FEATURE.`)
      } else {
        console.log(`Event ${event.id} already has FINAL-FEATURE.`)
      }
    }
  }

  console.log('Roadmap update complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
