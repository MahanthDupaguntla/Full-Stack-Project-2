/**
 * OTP Service — client-side OTP management
 * Handles: generation, SHA-256 hashing, rate limiting,
 * expiry (5 min), and a forgot-password OTP flow.
 *
 * Storage keys (localStorage):
 *  - artforge_otp_store   → { [email]: { hash, expiry, usedAt?, attempts } }
 *  - artforge_rate_limit  → { [email]: number[] }   (timestamps of sends)
 *  - artforge_fp_store    → { [email]: { hash, expiry } }  (forgot-password OTPs)
 */

const OTP_STORE_KEY = 'artforge_otp_store';
const RATE_LIMIT_KEY = 'artforge_rate_limit';
const FP_STORE_KEY = 'artforge_fp_store';

const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const RATE_WINDOW_MS = 10 * 60 * 1000;     // 10 minutes window
const MAX_SENDS_PER_WINDOW = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStore(key: string): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function saveStore(key: string, data: Record<string, any>) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Crypto-grade SHA-256 hash (hex) */
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a cryptographically random 6-digit OTP */
function generateOtp(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export function checkRateLimit(email: string): { allowed: boolean; remaining: number; waitSecs: number } {
  const store = getStore(RATE_LIMIT_KEY);
  const now = Date.now();
  const timestamps: number[] = (store[email] || []).filter(
    (t: number) => now - t < RATE_WINDOW_MS
  );

  if (timestamps.length >= MAX_SENDS_PER_WINDOW) {
    const oldest = timestamps[0];
    const waitSecs = Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, waitSecs };
  }

  return {
    allowed: true,
    remaining: MAX_SENDS_PER_WINDOW - timestamps.length - 1,
    waitSecs: 0,
  };
}

function recordSend(email: string) {
  const store = getStore(RATE_LIMIT_KEY);
  const now = Date.now();
  const timestamps: number[] = (store[email] || []).filter(
    (t: number) => now - t < RATE_WINDOW_MS
  );
  timestamps.push(now);
  store[email] = timestamps;
  saveStore(RATE_LIMIT_KEY, store);
}

// ── Login OTP ─────────────────────────────────────────────────────────────────

export interface OtpResult {
  otp: string;        // plaintext — send via email, then discard
  expiry: number;     // ms timestamp
}

/**
 * Create and store an OTP for a login/signup flow.
 * Returns the plaintext OTP so the caller can email it.
 * Throws if rate-limited.
 */
export async function createOtp(email: string): Promise<OtpResult> {
  const rate = checkRateLimit(email);
  if (!rate.allowed) {
    throw new Error(
      `Too many OTP requests. Please wait ${Math.floor(rate.waitSecs / 60)}m ${rate.waitSecs % 60}s before trying again.`
    );
  }

  const otp = generateOtp();
  const hash = await sha256(otp);
  const expiry = Date.now() + OTP_EXPIRY_MS;

  const store = getStore(OTP_STORE_KEY);
  store[email.toLowerCase()] = { hash, expiry, attempts: 0 };
  saveStore(OTP_STORE_KEY, store);

  recordSend(email);
  return { otp, expiry };
}

/**
 * Verify a login OTP.
 * Returns true if valid. Invalidates OTP on first successful use.
 */
export async function verifyOtp(email: string, inputOtp: string): Promise<boolean> {
  const store = getStore(OTP_STORE_KEY);
  const entry = store[email.toLowerCase()];

  if (!entry) throw new Error('No OTP found for this email. Please request a new one.');

  if (Date.now() > entry.expiry) {
    delete store[email.toLowerCase()];
    saveStore(OTP_STORE_KEY, store);
    throw new Error('OTP has expired. Please request a new one.');
  }

  const inputHash = await sha256(inputOtp.trim());

  if (inputHash !== entry.hash) {
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts >= 5) {
      delete store[email.toLowerCase()];
      saveStore(OTP_STORE_KEY, store);
      throw new Error('Too many incorrect attempts. OTP invalidated.');
    }
    saveStore(OTP_STORE_KEY, store);
    throw new Error(`Incorrect OTP. ${5 - entry.attempts} attempt(s) remaining.`);
  }

  // Valid — invalidate immediately
  delete store[email.toLowerCase()];
  saveStore(OTP_STORE_KEY, store);
  return true;
}

// ── Forgot-Password OTP ───────────────────────────────────────────────────────

/**
 * Create and store a forgot-password OTP.
 * Same rate limits apply.
 */
export async function createForgotPasswordOtp(email: string): Promise<OtpResult> {
  const rate = checkRateLimit(email);
  if (!rate.allowed) {
    throw new Error(
      `Too many OTP requests. Please wait ${Math.floor(rate.waitSecs / 60)}m ${rate.waitSecs % 60}s before trying again.`
    );
  }

  const otp = generateOtp();
  const hash = await sha256(otp);
  const expiry = Date.now() + OTP_EXPIRY_MS;

  const store = getStore(FP_STORE_KEY);
  store[email.toLowerCase()] = { hash, expiry, attempts: 0 };
  saveStore(FP_STORE_KEY, store);

  recordSend(email);
  return { otp, expiry };
}

/**
 * Verify a forgot-password OTP.
 * Returns a one-time reset token on success (stored in sessionStorage).
 */
export async function verifyForgotPasswordOtp(email: string, inputOtp: string): Promise<string> {
  const store = getStore(FP_STORE_KEY);
  const entry = store[email.toLowerCase()];

  if (!entry) throw new Error('No OTP found for this email. Please request a new one.');

  if (Date.now() > entry.expiry) {
    delete store[email.toLowerCase()];
    saveStore(FP_STORE_KEY, store);
    throw new Error('OTP has expired. Please request a new one.');
  }

  const inputHash = await sha256(inputOtp.trim());

  if (inputHash !== entry.hash) {
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts >= 5) {
      delete store[email.toLowerCase()];
      saveStore(FP_STORE_KEY, store);
      throw new Error('Too many incorrect attempts. OTP invalidated.');
    }
    saveStore(FP_STORE_KEY, store);
    throw new Error(`Incorrect OTP. ${5 - entry.attempts} attempt(s) remaining.`);
  }

  // Invalidate OTP
  delete store[email.toLowerCase()];
  saveStore(FP_STORE_KEY, store);

  // Issue a one-time session reset token
  const resetToken = crypto.randomUUID();
  sessionStorage.setItem(`artforge_reset_${email.toLowerCase()}`, resetToken);
  return resetToken;
}

/**
 * Validate a reset token and update the password.
 * Uses the mockBackend's user store.
 */
export function resetPassword(email: string, resetToken: string, newPassword: string): boolean {
  const stored = sessionStorage.getItem(`artforge_reset_${email.toLowerCase()}`);
  if (!stored || stored !== resetToken) {
    throw new Error('Invalid or expired reset session. Please restart the process.');
  }

  // Update password in the mock user store
  const ALL_USERS_KEY = 'etheria_all_users';
  const raw = localStorage.getItem(ALL_USERS_KEY);
  if (!raw) throw new Error('User store not found.');

  const users = JSON.parse(raw);
  const idx = users.findIndex((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (idx === -1) throw new Error('No account found with this email address.');

  users[idx].password = newPassword; // In prod this would be bcrypt-hashed server-side
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));

  // Consume the reset token
  sessionStorage.removeItem(`artforge_reset_${email.toLowerCase()}`);
  return true;
}

/**
 * Check whether an email is registered in the mock user store.
 */
export function isEmailRegistered(email: string): boolean {
  const ALL_USERS_KEY = 'etheria_all_users';
  const raw = localStorage.getItem(ALL_USERS_KEY);
  if (!raw) return false;
  const users = JSON.parse(raw);
  return users.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
}

/** OTP expiry (ms from now) for display purposes */
export const OTP_EXPIRY_DISPLAY_SECS = OTP_EXPIRY_MS / 1000;
