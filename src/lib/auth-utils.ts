import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/server/db'
import { verifyJwt } from './jwt'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const SALT_LENGTH = 16
const KEY_LENGTH = 32

const SECRET = (() => {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set. Staff token encryption cannot proceed.')
  }
  return process.env.NEXTAUTH_SECRET
})()

// Derive encryption key from salt and secret to prevent static key usage
const deriveKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(SECRET, salt, 10000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypts an object payload into a secure token string using AES-256-GCM.
 */
export function encryptToken(payload: object): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  // Format: salt:iv:encrypted_payload:auth_tag
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`
}

/**
 * Decrypts a token back into its original object payload. Returns null if invalid/tampered.
 */
export function decryptToken(token: string): any | null {
  try {
    const parts = token.split(':')
    if (parts.length !== 4) return null

    const salt = Buffer.from(parts[0], 'hex')
    const iv = Buffer.from(parts[1], 'hex')
    const encrypted = Buffer.from(parts[2], 'hex')
    const authTag = Buffer.from(parts[3], 'hex')

    const key = deriveKey(salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    return JSON.parse(decrypted.toString('utf8'))
  } catch (error) {
    return null
  }
}

/**
 * Hashes a password asynchronously using PBKDF2 with a unique salt and 600,000 iterations.
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
    const iterations = 600000
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${iterations}:${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

/**
 * Verifies a password against a stored hash.
 * Supports:
 * - bcrypt hashes ($2a$, $2b$, $2y$)
 * - PBKDF2 hashes with dynamic iterations ({iterations}:{salt}:{hash})
 * - Legacy PBKDF2 hashes ({salt}:{hash})
 */
export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return Promise.resolve(false)
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash)
  }

  return new Promise((resolve, reject) => {
    try {
      const parts = storedHash.split(':')
      let iterations = 1000
      let salt = ''
      let hash = ''

      if (parts.length === 3) {
        iterations = parseInt(parts[0], 10)
        salt = parts[1]
        hash = parts[2]
      } else if (parts.length === 2) {
        salt = parts[0]
        hash = parts[1]
      } else {
        return resolve(false)
      }

      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err)
        const inputHash = derivedKey.toString('hex')
        
        // Use timingSafeEqual to prevent timing side-channel attacks
        const match = crypto.timingSafeEqual(
          Buffer.from(hash, 'hex'),
          Buffer.from(inputHash, 'hex')
        )
        resolve(match)
      })
    } catch (e) {
      resolve(false)
    }
  })
}

/**
 * Extracts and decrypts the staff session from request headers.
 */
export async function getStaffFromRequest(request: Request): Promise<{ userId: number; username: string; role: 'ADMIN' | 'JUDGE' } | null> {
  let token: string | null = null

  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 2. Fallback: Parse staff_token from cookies
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/staff_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1].trim())
      }
    }
  }

  if (!token) return null

  const decoded = decryptToken(token)
  if (!decoded || !decoded.role || !decoded.userId) return null

  const userExists = await db.user.findUnique({
    where: { id: decoded.userId }
  })
  if (!userExists) return null

  return decoded as { userId: number; username: string; role: 'ADMIN' | 'JUDGE' }
}

/**
 * Validates the team session token (Session UUID) in request headers or cookies and returns the registration details.
 */
export async function getTeamFromRequest(request: Request) {
  let token = request.headers.get('x-team-token')

  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/team_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1].trim())
      }
    }
  }

  if (!token) return null

  try {
    const decoded = verifyJwt(token)
    if (!decoded || decoded.type !== 'team' || !decoded.id) return null

    if (!decoded.sessionId) return null
    const dbSession = await db.session.findUnique({
      where: { id: decoded.sessionId }
    })
    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null
    }

    const registration = await db.registration.findUnique({
      where: { id: decoded.id },
      include: { event: true },
    })

    if (!registration || !registration.event.isActive || registration.isBlocked) return null

    return registration
  } catch (error) {
    console.error('getTeamFromRequest db/jwt error:', error)
    return null
  }
}


