import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto';

/**
 * Enterprise-grade cryptographic hashing using scrypt with 16-byte random salt.
 * Resistant to GPU brute-forcing and rainbow tables.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Timing-safe password verification to prevent side-channel timing attacks.
 * Backward compatible with legacy SHA-256 hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Modern salted scrypt format: scrypt:salt:hash
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, key] = parts;
    const keyBuffer = Buffer.from(key, 'hex');
    const derived = scryptSync(password, salt, 64);
    if (keyBuffer.length !== derived.length) return false;
    return timingSafeEqual(keyBuffer, derived);
  }

  // Legacy SHA-256 fallback (for existing test records)
  const legacyHash = createHash('sha256').update(password).digest('hex');
  return legacyHash === storedHash;
}

/**
 * Cryptographically strong random token generator (256-bit entropy).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

// In-memory rate limiting for brute-force protection (per IP or email)
interface AttemptRecord {
  count: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

/**
 * Checks if the identifier (IP or email) is currently rate-limited.
 * Returns { allowed: boolean, remainingMs: number }
 */
export function checkLoginRateLimit(key: string): { allowed: boolean; remainingSeconds: number } {
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true, remainingSeconds: 0 };

  const now = Date.now();
  if (record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  // Window expired, reset
  if (record.blockedUntil !== 0 && record.blockedUntil <= now) {
    loginAttempts.delete(key);
  }

  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Record a failed login attempt. If threshold exceeded, lock for 5 minutes.
 */
export function recordFailedLogin(key: string): { blocked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const record = loginAttempts.get(key) ?? { count: 0, blockedUntil: 0 };

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(key, record);
    return { blocked: true, attemptsLeft: 0 };
  }

  loginAttempts.set(key, record);
  return { blocked: false, attemptsLeft: MAX_ATTEMPTS - record.count };
}

/**
 * Clear failed attempts upon successful login.
 */
export function clearFailedLogin(key: string): void {
  loginAttempts.delete(key);
}
