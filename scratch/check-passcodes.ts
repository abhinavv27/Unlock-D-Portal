import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const registrations = await p.registration.findMany()
  console.log('REGISTRATIONS IN DB:')
  for (const r of registrations) {
    console.log(`- Team Name: "${r.teamName}" | Passcode: "${r.teamPasscodeHash}"`)
  }
}
main().finally(() => p.$disconnect())
