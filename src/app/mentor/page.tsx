import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import MentorClient from './MentorClient'

export const metadata = { title: 'Mentor Console | IEEE RAS 2026' }
export const dynamic = 'force-dynamic'

export default async function MentorPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Verify that the logged in user is a staff member (ADMIN or JUDGE)
  if (!['ADMIN', 'JUDGE'].includes(session.user.role as string)) {
    redirect('/dashboard')
  }

  return (
    <MentorClient session={session} />
  )
}
