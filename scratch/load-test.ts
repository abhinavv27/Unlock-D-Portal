import { PrismaClient } from '@prisma/client'

const BASE_URL = 'http://localhost:3000'
const prisma = new PrismaClient()

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runLoadTest() {
  const CONCURRENT_TEAMS = 20 // Number of concurrent teams uploading submissions
  const CONCURRENT_JUDGES = 5  // Number of concurrent judges grading in parallel

  console.log('🚀 Starting Universal Event Engine Load Test Simulation...')
  console.log(`- Concurrent Teams: ${CONCURRENT_TEAMS}`)
  console.log(`- Concurrent Judges: ${CONCURRENT_JUDGES}`)

  // 1. Resolve active event
  const activeEvent = await prisma.event.findFirst({
    where: { eventType: 'PROGRESSIVE_HACKATHON', isActive: true }
  })
  if (!activeEvent) {
    console.error('❌ Error: No active event found. Run seed first.')
    process.exit(1)
  }

  // 2. Fetch or create N teams for load test
  console.log('\n[Phase 1] Resolving load test teams in database...')
  const teams = await prisma.registration.findMany({
    take: CONCURRENT_TEAMS,
    orderBy: { registeredAt: 'desc' }
  })

  if (teams.length < CONCURRENT_TEAMS) {
    console.warn(`⚠️ Warning: Only found ${teams.length} teams in database. Please run seed or import Unstop CSV first to have at least ${CONCURRENT_TEAMS} teams.`);
    process.exit(1)
  }

  // 3. Simulate Concurrent Team Work Submissions
  console.log(`\n[Phase 2] Simulating ${CONCURRENT_TEAMS} concurrent submissions...`)
  const submissionStartTime = Date.now()
  
  const submissionPromises = teams.map(async (team, index) => {
    const start = Date.now()
    try {
      // Clear any pending/existing submissions first to allow clean upload
      await prisma.submission.deleteMany({
        where: { registrationId: team.id }
      })

      const res = await fetch(`${BASE_URL}/api/teams/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${team.id}`
        },
        body: JSON.stringify({
          payload: {
            github: `https://github.com/load-test-team/repo-${index}`,
            demo: `https://load-test-demo-${index}.vercel.app`
          }
        })
      })

      const duration = Date.now() - start
      if (res.ok) {
        const data = await res.json()
        return { success: true, duration, submissionId: data.submission.id }
      } else {
        return { success: false, duration, error: await res.text() }
      }
    } catch (err: any) {
      return { success: false, duration: Date.now() - start, error: err.message }
    }
  })

  const submissionResults = await Promise.all(submissionPromises)
  const submissionEndTime = Date.now()

  // Calculate metrics
  const successfulSubmissions = submissionResults.filter(r => r.success)
  const failedSubmissions = submissionResults.filter(r => !r.success)
  const subDurations = successfulSubmissions.map(r => r.duration)
  const avgSubTime = subDurations.reduce((a, b) => a + b, 0) / (subDurations.length || 1)

  console.log(`✅ Submissions Complete in ${submissionEndTime - submissionStartTime}ms`)
  console.log(`- Success: ${successfulSubmissions.length}/${CONCURRENT_TEAMS}`)
  console.log(`- Average response time: ${avgSubTime.toFixed(1)}ms`)
  if (failedSubmissions.length > 0) {
    console.log(`- Failures:`, failedSubmissions.slice(0, 3).map(f => f.error))
  }

  // 4. Fetch the created submissions IDs to grade
  const submissionIds = successfulSubmissions.map((r: any) => r.submissionId)

  if (submissionIds.length === 0) {
    console.error('❌ Cannot run grading load test because no submissions succeeded.')
    process.exit(1)
  }

  // 5. Simulate Concurrent Judges Grading
  // Retrieve token for first judge (admin) and second judge (judge)
  console.log('\n[Phase 3] Logging in judges for grading simulation...')
  const staffTokens: string[] = []
  
  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'judge', password: 'judge123' }
  ]

  for (const cred of credentials) {
    const loginRes = await fetch(`${BASE_URL}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred),
    })
    if (loginRes.ok) {
      const data = await loginRes.json()
      staffTokens.push(data.token)
    }
  }

  if (staffTokens.length === 0) {
    console.error('❌ Cannot run grading load test because staff authentication failed.')
    process.exit(1)
  }

  console.log(`✅ Logged in ${staffTokens.length} judges.`)
  console.log(`\n[Phase 4] Simulating concurrent evaluations (total ${submissionIds.length * staffTokens.length} requests)...`)
  
  const gradeStartTime = Date.now()
  const gradePromises: Promise<any>[] = []

  // Each judge grades all submissions concurrently
  staffTokens.forEach((token, judgeIdx) => {
    submissionIds.forEach((submissionId) => {
      const start = Date.now()
      const promise = (async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/admin/grade`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              submissionId,
              scoreBreakdown: {
                innovation: Math.floor(Math.random() * 5) + 5,
                technical: Math.floor(Math.random() * 5) + 5,
                presentation: Math.floor(Math.random() * 5) + 5,
                impact: Math.floor(Math.random() * 5) + 5,
              },
              feedback: `Load test evaluation by judge ${judgeIdx + 1}`,
              status: 'APPROVED'
            })
          })

          const duration = Date.now() - start
          if (res.ok) {
            return { success: true, duration }
          } else {
            return { success: false, duration, error: await res.text() }
          }
        } catch (err: any) {
          return { success: false, duration: Date.now() - start, error: err.message }
        }
      })()
      gradePromises.push(promise)
    })
  })

  const gradeResults = await Promise.all(gradePromises)
  const gradeEndTime = Date.now()

  const successfulGrades = gradeResults.filter(r => r.success)
  const failedGrades = gradeResults.filter(r => !r.success)
  const gradeDurations = successfulGrades.map(r => r.duration)
  const avgGradeTime = gradeDurations.reduce((a, b) => a + b, 0) / (gradeDurations.length || 1)

  console.log(`✅ Grading Complete in ${gradeEndTime - gradeStartTime}ms`)
  console.log(`- Success: ${successfulGrades.length}/${gradeResults.length}`)
  console.log(`- Average response time: ${avgGradeTime.toFixed(1)}ms`)
  if (failedGrades.length > 0) {
    console.log(`- Failures:`, failedGrades.slice(0, 3).map(f => f.error))
  }

  console.log('\n🏁 LOAD TEST SIMULATION COMPLETE. Disconnecting Prisma Client...')
  await prisma.$disconnect()
}

runLoadTest()
