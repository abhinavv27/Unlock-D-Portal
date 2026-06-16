import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import ImportClient from './ImportClient'

export const metadata = { title: 'Import Unstop Roster | IEEE RAS 2026' }

export default async function AdminImportPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) redirect('/dashboard')

  // Retrieve active events from the database
  const events = await db.event.findMany({
    select: {
      id: true,
      name: true,
      eventType: true,
      isActive: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return <ImportClient session={session} events={events} />
}
