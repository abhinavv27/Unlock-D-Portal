import { PrismaClient } from '@prisma/client'

const BASE_URL = 'http://localhost:3000'
const prisma = new PrismaClient()

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testBackend() {
  console.log('🚀 Starting Universal Event Engine API Verification...')

  try {
    // ─── STEP 1: STAFF LOGIN ───────────────────────────────────────────────
    console.log('\n[Test 1] Logging in as staff admin...')
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    })
    
    if (!staffLoginRes.ok) {
      throw new Error(`Staff login failed: ${await staffLoginRes.text()}`)
    }
    
    const staffData = await staffLoginRes.json()
    const staffToken = staffData.token
    console.log('✅ Staff logged in. Token derived successfully.')

    // Resolve active event ID dynamically from DB
    const activeEvent = await prisma.event.findFirst({
      where: { eventType: 'PROGRESSIVE_HACKATHON', isActive: true }
    })
    if (!activeEvent) {
      throw new Error('No active PROGRESSIVE_HACKATHON event found in the database. Run seed first.')
    }
    const eventId = activeEvent.id.toString()
    console.log(`ℹ️ Resolved target active event ID: ${eventId} ("${activeEvent.name}")`)

    // ─── STEP 2: IMPORT CSV FROM UNSTOP ────────────────────────────────────
    console.log('\n[Test 2] Uploading Unstop registration CSV...')
    const uniqueSuffix = Date.now()
    const teamName = `CyberTitans_${uniqueSuffix}`
    const teamId1 = `unstop_id_1_${uniqueSuffix}`
    const teamId2 = `unstop_id_2_${uniqueSuffix}`

    // Build a mock CSV payload
    const csvContent = `Team Id,Team Name,Email\n${teamId1},${teamName},cyber@titans.test\n${teamId2},DeltaForce_${uniqueSuffix},delta@force.test`
    
    // In node-fetch or native fetch, we can use a multi-part boundary
    // For simplicity, we construct a multipart boundary manually
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="eventId"',
      '',
      eventId,
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="unstop.csv"',
      'Content-Type: text/csv',
      '',
      csvContent,
      `--${boundary}--`
    ].join('\r\n')

    const importRes = await fetch(`${BASE_URL}/api/admin/import-unstop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    })

    if (!importRes.ok) {
      throw new Error(`CSV Import failed: ${await importRes.text()}`)
    }

    const importData = await importRes.json()
    console.log(`✅ CSV processed successfully. ${importData.message}`)
    
    // Find the passcode for our target team
    const targetTeam = importData.teams.find((t: any) => t.teamName === teamName)
    if (!targetTeam) {
      throw new Error(`Expected "${teamName}" to be in the imported list.`)
    }
    console.log(`🔑 ${teamName} Passcode generated: "${targetTeam.passcode}"`)

    // ─── STEP 3: PARTICIPANT TEAM LOGIN ──────────────────────────────────
    console.log(`\n[Test 3] Logging in as participant team "${teamName}"...`)
    const teamLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName,
        passcode: targetTeam.passcode,
      }),
    })

    if (!teamLoginRes.ok) {
      throw new Error(`Team login failed: ${await teamLoginRes.text()}`)
    }

    const teamData = await teamLoginRes.json()
    const teamToken = teamData.sessionToken
    console.log(`✅ Team logged in. Session token (UUID) acquired: "${teamToken}"`)

    // ─── STEP 4: VERIFY TEAM INITIAL STATUS ───────────────────────────────
    console.log('\n[Test 4] Retrieving team status (Initial Stage 1)...')
    const statusRes = await fetch(`${BASE_URL}/api/teams/me/status`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })

    if (!statusRes.ok) {
      throw new Error(`Fetch status failed: ${await statusRes.text()}`)
    }

    const statusData = await statusRes.json()
    console.log(`✅ Team status retrieved. Current Stage: ${statusData.progressState.current_stage}, Score: ${statusData.progressState.score}`)
    if (statusData.progressState.current_stage !== 1) {
      throw new Error(`Expected initial stage to be 1, got ${statusData.progressState.current_stage}`)
    }

    // ─── STEP 5: SUBMIT WORK PAYLOAD ───────────────────────────────────────
    console.log('\n[Test 5] Uploading work submission payload...')
    const submitRes = await fetch(`${BASE_URL}/api/teams/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teamToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          github: 'https://github.com/cyber-titans/unlockd',
          demo: 'https://unlockd-demo.vercel.app',
        },
      }),
    })

    if (!submitRes.ok) {
      throw new Error(`Work submission failed: ${await submitRes.text()}`)
    }

    const submitData = await submitRes.json()
    const submissionId = submitData.submission.id
    console.log(`✅ Submission uploaded. ID: ${submissionId}`)

    // ─── STEP 6: VERIFY ADMIN GRADED QUEUE ─────────────────────────────────
    console.log('\n[Test 6] Fetching admin submission queue...')
    const queueRes = await fetch(`${BASE_URL}/api/admin/queue`, {
      headers: { 'Authorization': `Bearer ${staffToken}` },
    })

    if (!queueRes.ok) {
      throw new Error(`Fetch queue failed: ${await queueRes.text()}`)
    }

    const queueData = await queueRes.json()
    const hasSubmission = queueData.submissions.some((s: any) => s.id === submissionId)
    if (!hasSubmission) {
      throw new Error(`Expected submission ID ${submissionId} to be in the grading queue.`)
    }
    console.log('✅ Submission found in judge queue.')

    // ─── STEP 7: GRADE SUBMISSION (APPROVE - FIRST JUDGE) ───────────────────
    console.log('\n[Test 7] Grading submission (First Judge: Approve with score 35)...')
    const gradeRes = await fetch(`${BASE_URL}/api/admin/grade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        submissionId,
        scoreBreakdown: {
          innovation: 9,
          technical: 8,
          presentation: 10,
          impact: 8,
        },
        feedback: 'Fantastic prototype setup! Looking forward to stage 2.',
        status: 'APPROVED',
      }),
    })

    if (!gradeRes.ok) {
      throw new Error(`Grading failed: ${await gradeRes.text()}`)
    }

    const gradeData = await gradeRes.json()
    console.log(`✅ Submission graded by first judge. Calculated total: ${gradeData.totalScore}`)

    // ─── STEP 7.1: LOGIN AS SECOND JUDGE ────────────────────────────────────
    console.log('\n[Test 7.1] Logging in as second judge...')
    const judgeLoginRes = await fetch(`${BASE_URL}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'judge',
        password: 'judge123',
      }),
    })
    
    if (!judgeLoginRes.ok) {
      throw new Error(`Second judge login failed: ${await judgeLoginRes.text()}`)
    }
    
    const judgeData = await judgeLoginRes.json()
    const judgeToken = judgeData.token
    console.log('✅ Second judge logged in.')

    // ─── STEP 7.2: VERIFY SUBMISSION STILL IN SECOND JUDGE\'S QUEUE ──────────
    console.log('\n[Test 7.2] Fetching queue for second judge (should see the submission)...')
    const queueRes2 = await fetch(`${BASE_URL}/api/admin/queue`, {
      headers: { 'Authorization': `Bearer ${judgeToken}` },
    })
    
    if (!queueRes2.ok) {
      throw new Error(`Fetch queue for second judge failed: ${await queueRes2.text()}`)
    }
    
    const queueData2 = await queueRes2.json()
    const hasSubmission2 = queueData2.submissions.some((s: any) => s.id === submissionId)
    if (!hasSubmission2) {
      throw new Error(`Expected submission ID ${submissionId} to be in the second judge's queue.`)
    }
    console.log('✅ Submission found in second judge\'s queue.')

    // ─── STEP 7.3: GRADE SUBMISSION (APPROVE - SECOND JUDGE) ────────────────
    console.log('\n[Test 7.3] Grading submission (Second Judge: Approve with score 25)...')
    const gradeRes2 = await fetch(`${BASE_URL}/api/admin/grade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${judgeToken}`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        submissionId,
        scoreBreakdown: {
          innovation: 6,
          technical: 6,
          presentation: 7,
          impact: 6,
        },
        feedback: 'Good execution, but backend lacks styling.',
        status: 'APPROVED',
      }),
    })

    if (!gradeRes2.ok) {
      throw new Error(`Grading by second judge failed: ${await gradeRes2.text()}`)
    }

    const gradeData2 = await gradeRes2.json()
    console.log(`✅ Submission graded by second judge. Calculated total: ${gradeData2.totalScore}`)

    // ─── STEP 7.4: VERIFY SUBMISSION REMOVED FROM SECOND JUDGE\'S QUEUE ──────
    console.log('\n[Test 7.4] Fetching queue for second judge again (should be empty)...')
    const queueRes3 = await fetch(`${BASE_URL}/api/admin/queue`, {
      headers: { 'Authorization': `Bearer ${judgeToken}` },
    })
    
    const queueData3 = await queueRes3.json()
    const hasSubmission3 = queueData3.submissions.some((s: any) => s.id === submissionId)
    if (hasSubmission3) {
      throw new Error(`Expected submission ID ${submissionId} to be removed from the second judge's queue.`)
    }
    console.log('✅ Submission removed from second judge\'s queue.')

    // ─── STEP 8: VERIFY STAGE PROGRESSION & SCORE AVERAGING ─────────────────
    console.log('\n[Test 8] Retrieving team status after dual grading (Should be Stage 2 with averaged score)...')
    const finalStatusRes = await fetch(`${BASE_URL}/api/teams/me/status`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })

    if (!finalStatusRes.ok) {
      throw new Error(`Fetch final status failed: ${await finalStatusRes.text()}`)
    }

    const finalStatusData = await finalStatusRes.json()
    console.log(`✅ Final team status retrieved.`)
    console.log(`- Current Stage: ${finalStatusData.progressState.current_stage} (Expected: 2)`)
    console.log(`- Cumulative Score: ${finalStatusData.progressState.score} (Expected: 30)`)
    
    // Virtual evaluation should be in status response
    const lastSub = finalStatusData.submissions.find((s: any) => s.id === submissionId)
    console.log(`- Virtual Evaluation:`, lastSub?.evaluation)

    if (finalStatusData.progressState.current_stage !== 2) {
      throw new Error(`Expected stage to advance to 2, got ${finalStatusData.progressState.current_stage}`)
    }
    if (finalStatusData.progressState.score !== 30) {
      throw new Error(`Expected score to be 30 (average of 35 and 25), got ${finalStatusData.progressState.score}`)
    }
    if (!lastSub?.evaluation || lastSub.evaluation.totalScore !== 30) {
      throw new Error(`Expected virtual evaluation totalScore to be 30, got ${lastSub?.evaluation?.totalScore}`)
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉')
  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testBackend()
