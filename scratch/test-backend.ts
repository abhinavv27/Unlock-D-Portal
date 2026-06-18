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
    
    // Reset currentRound to 0 for idempotency
    const currentConfig = (activeEvent.config as any) || {}
    await prisma.event.update({
      where: { id: activeEvent.id },
      data: {
        config: {
          ...currentConfig,
          currentRound: 0
        }
      }
    })
    console.log('🔄 Reset active event currentRound to 0 for idempotency.')

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
    const statusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })

    if (!statusRes.ok) {
      throw new Error(`Fetch status failed: ${await statusRes.text()}`)
    }

    const statusBatchData = await statusRes.json()
    const statusData = statusBatchData[0].result.data.json
    console.log(`✅ Team status retrieved. Current Stage: ${statusData.progressState.current_stage}, Score: ${statusData.progressState.score}`)
    if (statusData.progressState.current_stage !== 0) {
      throw new Error(`Expected initial stage to be 0, got ${statusData.progressState.current_stage}`)
    }

    // ─── STEP 5: SUBMIT WORK PAYLOAD ───────────────────────────────────────
    console.log('\n[Test 5] Uploading work submission payload...')
    const submitRes = await fetch(`${BASE_URL}/api/trpc/teams.submit?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teamToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "0": {
          "json": {
            githubUrl: 'https://github.com/cyber-titans/unlockd',
            description: 'Submission for Allowed Round',
          }
        }
      }),
    })

    if (!submitRes.ok) {
      throw new Error(`Work submission failed: ${await submitRes.text()}`)
    }

    const submitBatchData = await submitRes.json()
    const submitData = submitBatchData[0].result.data.json
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

    // ─── STEP 7: GRADE SUBMISSION (APPROVE - FIRST JUDGE via tRPC) ───────────
    console.log('\n[Test 7] Grading submission (First Judge: submitEvaluation via tRPC)...')
    const gradeRes = await fetch(`${BASE_URL}/api/trpc/judging.submitEvaluation?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        "0": {
          "json": {
            submissionId,
            scoreBreakdown: {
              functionality: 9,
              code_quality: 8,
            },
            feedback: 'Fantastic prototype setup! Looking forward to stage 2.',
          }
        }
      }),
    })

    if (!gradeRes.ok) {
      throw new Error(`Grading failed: ${await gradeRes.text()}`)
    }

    const gradeBatchData = await gradeRes.json()
    console.log(`✅ Submission graded by first judge.`)

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

    // ─── STEP 7.3: GRADE SUBMISSION (APPROVE - SECOND JUDGE via tRPC) ────────
    console.log('\n[Test 7.3] Grading submission (Second Judge: submitEvaluation via tRPC)...')
    const gradeRes2 = await fetch(`${BASE_URL}/api/trpc/judging.submitEvaluation?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${judgeToken}`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        "0": {
          "json": {
            submissionId,
            scoreBreakdown: {
              functionality: 7,
              code_quality: 6,
            },
            feedback: 'Good execution, but backend lacks styling.',
          }
        }
      }),
    })

    if (!gradeRes2.ok) {
      throw new Error(`Grading by second judge failed: ${await gradeRes2.text()}`)
    }

    console.log(`✅ Submission graded by second judge.`)

    // ─── STEP 7.3.5: FINALIZE SUBMISSION (ADMIN via tRPC) ───────────────────
    console.log('\n[Test 7.3.5] Finalizing submission (Admin: finalizeSubmission via tRPC)...')
    const finalizeRes = await fetch(`${BASE_URL}/api/trpc/judging.finalizeSubmission?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        "0": {
          "json": {
            submissionId,
          }
        }
      }),
    })

    if (!finalizeRes.ok) {
      throw new Error(`Finalizing failed: ${await finalizeRes.text()}`)
    }

    const finalizeBatchData = await finalizeRes.json()
    const finalizeData = finalizeBatchData[0].result.data.json
    console.log(`✅ Submission finalized by admin. Status: ${finalizeData.status}, Average Score: ${finalizeData.averageScore}`)

    // ─── STEP 7.4: VERIFY SUBMISSION REMOVED FROM JUDGE\'S QUEUE ────────────
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
    console.log('\n[Test 8] Retrieving team status after dual grading (Should be allowed FEATURE-2)...')
    const finalStatusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })

    if (!finalStatusRes.ok) {
      throw new Error(`Fetch final status failed: ${await finalStatusRes.text()}`)
    }

    const finalStatusBatchData = await finalStatusRes.json()
    const finalStatusData = finalStatusBatchData[0].result.data.json
    console.log(`✅ Final team status retrieved.`)
    console.log(`- Current Stage: ${finalStatusData.progressState.current_stage} (Expected: 1)`)
    console.log(`- Cumulative Score: ${finalStatusData.progressState.score} (Expected: 15)`)
    console.log(`- Allowed Task ID: ${finalStatusData.allowedTaskId} (Expected: FEATURE-2)`)

    if (finalStatusData.allowedRound !== 1) {
      throw new Error(`Expected allowedRound to be 1, got ${finalStatusData.allowedRound}`)
    }
    if (finalStatusData.allowedTaskId !== 'FEATURE-2') {
      throw new Error(`Expected allowedTaskId to be FEATURE-2, got ${finalStatusData.allowedTaskId}`)
    }
    if (finalStatusData.progressState.score !== 15) {
      // (9+8) + (7+6) / 2 = 15.0
      throw new Error(`Expected score to be 15, got ${finalStatusData.progressState.score}`)
    }

    // ─── STEP 9: SUBMIT AND APPROVE ALL REMAINING ROUND 1 TASKS TO TRIGGER CEILING ────
    console.log('\n[Test 9] Simulating submissions to trigger global round ceiling (WAITING_ROOM)...')
    
    // Submit FEATURE-2
    const sub2Res = await fetch(`${BASE_URL}/api/trpc/teams.submit?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${teamToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { githubUrl: 'https://github.com/cyber-titans/unlockd', description: 'FEATURE-2 submission' } } }),
    })
    const sub2Id = (await sub2Res.json())[0].result.data.json.submission.id

    // Grade and finalize FEATURE-2
    await fetch(`${BASE_URL}/api/trpc/judging.submitEvaluation?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { submissionId: sub2Id, scoreBreakdown: { functionality: 10, code_quality: 10 }, feedback: 'Superb step 2' } } }),
    })
    await fetch(`${BASE_URL}/api/trpc/judging.finalizeSubmission?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { submissionId: sub2Id } } }),
    })

    // Submit FEATURE-3
    const sub3Res = await fetch(`${BASE_URL}/api/trpc/teams.submit?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${teamToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { githubUrl: 'https://github.com/cyber-titans/unlockd', description: 'FEATURE-3 submission' } } }),
    })
    const sub3Id = (await sub3Res.json())[0].result.data.json.submission.id

    // Grade and finalize FEATURE-3
    await fetch(`${BASE_URL}/api/trpc/judging.submitEvaluation?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { submissionId: sub3Id, scoreBreakdown: { functionality: 10, code_quality: 10 }, feedback: 'Superb step 3' } } }),
    })
    await fetch(`${BASE_URL}/api/trpc/judging.finalizeSubmission?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": { submissionId: sub3Id } } }),
    })

    // Fetch team status: Should be locked in WAITING_ROOM since allowedRound is 2 but event round ceiling is 1
    const ceilStatusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })
    const ceilStatusData = (await ceilStatusRes.json())[0].result.data.json
    console.log(`✅ Team status retrieved. Allowed Task ID: ${ceilStatusData.allowedTaskId} (Expected: WAITING_ROOM)`)
    if (ceilStatusData.allowedTaskId !== 'WAITING_ROOM') {
      throw new Error(`Expected team to be locked in WAITING_ROOM, got ${ceilStatusData.allowedTaskId}`)
    }

    // ─── STEP 10: ADMIN INCREMENTS GLOBAL ROUND CEILING ──────────────────────
    console.log('\n[Test 10] Admin advancing current global round to 2...')
    const nextRoundRes = await fetch(`${BASE_URL}/api/trpc/application.startNextRound?batch=1`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "0": { "json": {} } }),
    })
    if (!nextRoundRes.ok) {
      throw new Error(`Failed to advance round: ${await nextRoundRes.text()}`)
    }
    const nextRoundData = (await nextRoundRes.json())[0].result.data.json
    console.log(`✅ Global round advanced. Current Global Round is now: ${nextRoundData.currentGlobalRound}`)
    if (nextRoundData.currentGlobalRound !== 2) {
      throw new Error(`Expected currentGlobalRound to be 2, got ${nextRoundData.currentGlobalRound}`)
    }

    // ─── STEP 11: VERIFY CEILING IS LIFTED FOR TEAM ─────────────────────────
    console.log('\n[Test 11] Verifying team ceiling is lifted after admin action...')
    const liftedStatusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })
    const liftedStatusData = (await liftedStatusRes.json())[0].result.data.json
    console.log(`✅ Team status retrieved. Allowed Task ID: ${liftedStatusData.allowedTaskId} (Expected: ROUND-2)`)
    if (liftedStatusData.allowedTaskId !== 'ROUND-2') {
      throw new Error(`Expected allowedTaskId to be ROUND-2, got ${liftedStatusData.allowedTaskId}`)
    }
    if (finalStatusData.inWaitingRoom !== true) {
      throw new Error(`Expected team to be in waiting room, but inWaitingRoom is ${finalStatusData.inWaitingRoom}`)
    }

    // ─── STEP 9: ADMIN UNLOCKS ROUND 1 ──────────────────────────────────────
    console.log('\n[Test 9] Admin starting/unlocking Round 1...')
    const startRoundRes = await fetch(`${BASE_URL}/api/trpc/application.startRound?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "0": {
          "json": {
            round: 1
          }
        }
      })
    })

    if (!startRoundRes.ok) {
      throw new Error(`Admin startRound failed: ${await startRoundRes.text()}`)
    }

    console.log('✅ Round 1 started by admin.')

    // ─── STEP 10: VERIFY WAITING ROOM CLEARED ───────────────────────────────
    console.log('\n[Test 10] Verifying waiting room is cleared...')
    const clearedStatusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${teamToken}` },
    })

    const clearedBatchData = await clearedStatusRes.json()
    const clearedData = clearedBatchData[0].result.data.json
    console.log(`- inWaitingRoom after unlock: ${clearedData.inWaitingRoom} (Expected: false)`)
    if (clearedData.inWaitingRoom !== false) {
      throw new Error(`Expected inWaitingRoom to be false after starting Round 1, got ${clearedData.inWaitingRoom}`)
    }
    console.log('✅ Waiting room cleared successfully.')

    // ─── STEP 11: LOGIN AS TEAM 2 (DELTA FORCE) ──────────────────────────────
    const deltaTeamName = `DeltaForce_${uniqueSuffix}`
    const deltaTeam = importData.teams.find((t: any) => t.teamName === deltaTeamName)
    if (!deltaTeam) {
      throw new Error(`Expected "${deltaTeamName}" to be in the imported list.`)
    }

    console.log(`\n[Test 11] Logging in as team 2 "${deltaTeamName}" (never submitted Round 0)...`)
    const team2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: deltaTeamName,
        passcode: deltaTeam.passcode,
      }),
    })

    if (!team2LoginRes.ok) {
      throw new Error(`Team 2 login failed: ${await team2LoginRes.text()}`)
    }

    const team2Data = await team2LoginRes.json()
    const team2Token = team2Data.sessionToken
    console.log(`✅ Team 2 logged in. UUID acquired: "${team2Token}"`)

    // ─── STEP 12: VERIFY TEAM 2 IS ELIMINATED ───────────────────────────────
    console.log('\n[Test 12] Fetching status for Team 2 (should be eliminated)...')
    const team2StatusRes = await fetch(`${BASE_URL}/api/trpc/teams.status?batch=1`, {
      headers: { 'Authorization': `Bearer ${team2Token}` },
    })

    const team2BatchData = await team2StatusRes.json()
    const team2StatusData = team2BatchData[0].result.data.json
    console.log(`- Team 2 isEliminated: ${team2StatusData.isEliminated} (Expected: true)`)
    if (team2StatusData.isEliminated !== true) {
      throw new Error(`Expected Team 2 to be eliminated, got ${team2StatusData.isEliminated}`)
    }
    console.log('✅ Team 2 confirmed eliminated.')

    // ─── STEP 13: VERIFY TEAM 2 SUBMISSION BLOCKED ──────────────────────────
    console.log('\n[Test 13] Verifying Team 2 submission is blocked...')
    const team2SubmitRes = await fetch(`${BASE_URL}/api/trpc/teams.submit?batch=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${team2Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "0": {
          "json": {
            githubUrl: 'https://github.com/delta-force/unlockd',
            description: 'Trying to submit while eliminated',
          }
        }
      }),
    })

    if (team2SubmitRes.ok) {
      throw new Error('Expected submission to fail for eliminated team, but it succeeded.')
    }

    const team2SubmitData = await team2SubmitRes.json()
    const errMessage = team2SubmitData[0].error?.json?.message
    console.log(`- Submission rejection message: "${errMessage}" (Expected: "Your team did not advance to the next round.")`)
    if (errMessage !== 'Your team did not advance to the next round.') {
      throw new Error(`Expected error message "Your team did not advance to the next round.", got "${errMessage}"`)
    }
    console.log('✅ Team 2 submission blocked successfully.')

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉')
  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testBackend()
