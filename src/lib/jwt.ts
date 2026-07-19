import crypto from 'crypto'

const SECRET = (() => {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set.')
  }
  return process.env.NEXTAUTH_SECRET
})()

export function signJwt(payload: object, expiresInDays: number = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  
  const nowSec = Math.floor(Date.now() / 1000)
  const expSec = nowSec + expiresInDays * 24 * 60 * 60
  
  const jwtPayload = {
    ...payload,
    iat: nowSec,
    exp: expSec,
  }
  
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
  
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')
    
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyJwt(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [encodedHeader, encodedPayload, signature] = parts
    
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')
      
    if (signature !== expectedSignature) return null
    
    const decodedPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return decodedPayload
  } catch (error) {
    return null
  }
}
