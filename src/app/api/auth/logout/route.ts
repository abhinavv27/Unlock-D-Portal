import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('team_token')
  response.cookies.delete('staff_token')
  return response
}
