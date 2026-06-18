import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.user.count().then(c => {
  console.log('users:', c)
  return p.event.count()
}).then(c => {
  console.log('events:', c)
  return p.$disconnect()
})
