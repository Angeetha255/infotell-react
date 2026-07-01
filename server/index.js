/**
 * Infotell – Email Verification Server
 *
 * Runs independently on PORT 5007 alongside the main backend (5006).
 * Exposes two endpoints:
 *
 *   POST /api/verify/send       – Generate a magic link and email it
 *   GET  /api/verify/confirm    – Validate the token, redirect to review page
 *
 * Security highlights:
 *   - Cryptographically secure random tokens (crypto.randomBytes)
 *   - Only the SHA-256 hash is stored (never the raw token)
 *   - 30-minute expiry
 *   - Single-use: token is consumed immediately on first valid use
 *   - Input validation on all endpoints
 *   - Rate limiting: 3 emails per email address per 10 minutes
 */

require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { sendVerificationEmail } = require('./emailService');
const tokenStore = require('./tokenStore');

const app = express();
const PORT = process.env.PORT || 5007;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json());

// Simple in-memory rate limiter: max 3 requests per email per 10 minutes
const rateLimitMap = new Map();
function rateLimitByEmail(email) {
  const key = email.toLowerCase();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 3;

  const record = rateLimitMap.get(key) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - record.windowStart > windowMs) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  return record.count > maxRequests;
}

// Periodic cleanup of rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > 10 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Validate email format */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Generate a cryptographically secure random token */
function generateToken() {
  return crypto.randomBytes(48).toString('hex'); // 96 hex chars
}

/** Hash a token with SHA-256 */
function hashToken(raw) {
  return crypto
    .createHmac('sha256', process.env.TOKEN_SECRET || 'default-secret')
    .update(raw)
    .digest('hex');
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/verify/send
 * Body: { email: string, returnUrl: string }
 *
 * Generates a magic link and sends a verification email.
 */
app.post('/api/verify/send', async (req, res) => {
  try {
    const { email, returnUrl } = req.body;

    // Validate inputs
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Sanitise returnUrl: must start with FRONTEND_URL or be a relative path
    let safeReturnUrl = '/';
    if (returnUrl && typeof returnUrl === 'string') {
      // Allow relative paths or same-origin full URLs
      if (returnUrl.startsWith('/') || returnUrl.startsWith(FRONTEND_URL)) {
        safeReturnUrl = returnUrl.trim();
      }
    }

    // Rate limit check
    if (rateLimitByEmail(cleanEmail)) {
      return res.status(429).json({
        error: 'Too many verification requests. Please wait 10 minutes before trying again.',
      });
    }

    // Generate token
    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    // Store hashed token
    tokenStore.save(hashedToken, cleanEmail, expiresAt, safeReturnUrl);

    // Build magic link — points directly to the backend confirm endpoint
    // The backend validates the token and issues the redirect to the frontend
    const magicLink = `http://localhost:${PORT}/api/verify/confirm?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(cleanEmail)}`;

    // Send email
    await sendVerificationEmail(cleanEmail, magicLink, safeReturnUrl);

    return res.status(200).json({
      message: 'Verification email sent. Please check your inbox.',
    });

  } catch (err) {
    console.error('[verify/send] Error:', err.message);

    // Surface SMTP config errors helpfully in development
    if (err.code === 'EAUTH' || err.code === 'ECONNECTION' || err.responseCode === 535) {
      return res.status(503).json({
        error: 'Email service is unavailable. Please check SMTP configuration.',
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }

    return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
});

/**
 * GET /api/verify/confirm?token=...&email=...
 *
 * Validates the magic-link token and redirects to the review page.
 * On success → redirects to returnUrl with ?verified=true&email=...
 * On failure → redirects to returnUrl with ?verified=false&reason=...
 */
app.get('/api/verify/confirm', (req, res) => {
  const { token, email } = req.query;

  // Build a safe fallback redirect destination
  const fallbackUrl = `${FRONTEND_URL}/?verified=false&reason=invalid`;

  if (!token || !email) {
    return res.redirect(`${fallbackUrl}`);
  }

  const cleanEmail = decodeURIComponent(email).trim().toLowerCase();
  const rawToken = decodeURIComponent(token).trim();

  // Hash the raw token from the URL
  const hashedToken = hashToken(rawToken);

  const entry = tokenStore.get(hashedToken);

  // Token not found
  if (!entry) {
    return res.redirect(
      `${FRONTEND_URL}/verify-email-result?verified=false&reason=invalid`
    );
  }

  // Email mismatch (prevent token reuse across different emails)
  if (entry.email !== cleanEmail) {
    return res.redirect(
      `${FRONTEND_URL}/verify-email-result?verified=false&reason=invalid`
    );
  }

  // Token already used
  if (entry.used) {
    return res.redirect(
      `${FRONTEND_URL}/verify-email-result?verified=false&reason=used` +
      `&returnUrl=${encodeURIComponent(entry.returnUrl || '/')}`
    );
  }

  // Token expired
  if (Date.now() > entry.expiresAt) {
    const savedReturnUrl = entry.returnUrl || '/';
    tokenStore.remove(hashedToken);
    return res.redirect(
      `${FRONTEND_URL}/verify-email-result?verified=false&reason=expired` +
      `&returnUrl=${encodeURIComponent(savedReturnUrl)}`
    );
  }

  // ✅ Valid — consume token (single-use)
  tokenStore.consume(hashedToken);

  // Redirect to the frontend result page.
  // Pass verifiedEmail and the original returnUrl as query params.
  // The frontend result page will then navigate() to returnUrl with React Router state
  // so the token never appears in the final review page URL.
  const returnUrl = entry.returnUrl || '/';
  const redirectTarget =
    `${FRONTEND_URL}/verify-email-result` +
    `?verified=true` +
    `&verifiedEmail=${encodeURIComponent(cleanEmail)}` +
    `&returnUrl=${encodeURIComponent(returnUrl)}`;

  return res.redirect(redirectTarget);
});

/**
 * GET /api/verify/health
 * Simple health check.
 */
app.get('/api/verify/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Infotell Email Verification Server running on http://localhost:${PORT}`);
  console.log(`   SMTP Host : ${process.env.SMTP_HOST || '(not set)'}`);
  console.log(`   SMTP User : ${process.env.SMTP_USER || '(not set)'}`);
  console.log(`   Frontend  : ${FRONTEND_URL}`);
});
