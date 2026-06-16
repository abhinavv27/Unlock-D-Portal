import crypto from 'crypto'
import { db } from '@/server/db'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const SALT_LENGTH = 16
const KEY_LENGTH = 32

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-at-least-32-chars-long'

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
 * Hashes a password asynchronously using PBKDF2 with a unique salt.
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

/**
 * Verifies a password against a stored PBKDF2 hash using a timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const parts = storedHash.split(':')
      if (parts.length !== 2) return resolve(false)
      
      const [salt, hash] = parts
      crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
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
export function getStaffFromRequest(request: Request): { userId: number; username: string; role: 'ADMIN' | 'JUDGE' } | null {
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
  return decoded as { userId: number; username: string; role: 'ADMIN' | 'JUDGE' }
}

/**
 * Validates the team session token (UUID) in request headers and returns the registration details.
 */
export async function getTeamFromRequest(request: Request) {
  let token = request.headers.get('x-team-token')

  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) return null

  try {
    const registration = await db.registration.findUnique({
      where: { id: token },
      include: {
        event: true,
      },
    })
    return registration
  } catch (error) {
    console.error('getTeamFromRequest db error:', error)
    return null
  }
}


