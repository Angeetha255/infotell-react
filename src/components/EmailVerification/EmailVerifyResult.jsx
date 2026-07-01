import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './EmailVerifyResult.css';

/**
 * EmailVerifyResult
 *
 * Landing page the backend redirects to after validating the magic-link token.
 *
 * Backend sends:
 *   Success: /verify-email-result?verified=true&verifiedEmail=...&returnUrl=...
 *   Failure: /verify-email-result?verified=false&reason=invalid|expired|used&returnUrl=...
 *
 * On SUCCESS:
 *   1. Write verifiedEmail + emailVerified flag to sessionStorage
 *   2. Use window.location.href (full navigation) back to the original review page
 *      — this guarantees ReviewRating's useEffect fires on a fresh mount,
 *        regardless of SlugResolver's async loading delay.
 *
 * On FAILURE:
 *   Show the appropriate error with a "Try Again" button that navigates back.
 */
export default function EmailVerifyResult() {
  const [searchParams] = useSearchParams();
  const redirected = useRef(false);

  const verified      = searchParams.get('verified') === 'true';
  const verifiedEmail = searchParams.get('verifiedEmail') || '';
  const reason        = searchParams.get('reason') || 'invalid';
  const rawReturnUrl  = searchParams.get('returnUrl') || '';

  // Build the safe return path — always a relative path like /some-slug
  const returnPath = rawReturnUrl
    ? (rawReturnUrl.startsWith('/') ? rawReturnUrl : `/${rawReturnUrl}`)
    : (sessionStorage.getItem('reviewReturnPath') || '/');

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!verified || redirected.current) return;
    redirected.current = true;

    // 1. Persist verified session so ReviewRating reads it on mount
    sessionStorage.setItem('emailVerified', 'true');
    sessionStorage.setItem('verifiedEmail', verifiedEmail);
    sessionStorage.removeItem('reviewReturnPath');

    // 2. Full page navigation — clears React state, forces fresh mount of
    //    ReviewRating which will pick up sessionStorage on its first render.
    //    This is the only reliable way to handle SlugResolver's async delay.
    window.location.href = returnPath;
  }, [verified, verifiedEmail, returnPath]);

  // Show a brief "Verified!" screen while the redirect fires
  if (verified) {
    return (
      <div className="evr-page">
        <div className="evr-card evr-card--success">
          <div className="evr-icon">✅</div>
          <h1 className="evr-heading evr-heading--success">Email Verified!</h1>
          <p className="evr-body">
            Redirecting you back to the review form…
          </p>
          <div className="evr-progress-bar">
            <div className="evr-progress-fill" style={{ animationDuration: '0.8s' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── FAILURE ────────────────────────────────────────────────────────────────
  const messages = {
    expired: {
      icon: '⏱',
      heading: 'Link Expired',
      body: 'This verification link has expired. Magic links are valid for 30 minutes.',
      action: 'Please go back and request a new verification link.',
    },
    used: {
      icon: '🔒',
      heading: 'Link Already Used',
      body: 'This verification link has already been used. Each link is single-use.',
      action: 'Please go back and request a new verification link.',
    },
    invalid: {
      icon: '❌',
      heading: 'Invalid Link',
      body: 'This verification link is invalid or has been tampered with.',
      action: 'Please go back and request a new verification link.',
    },
  };

  const msg = messages[reason] || messages.invalid;

  const handleTryAgain = () => {
    sessionStorage.removeItem('reviewReturnPath');
    window.location.href = returnPath;
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="evr-page">
      <div className="evr-card evr-card--error">
        <div className="evr-icon">{msg.icon}</div>
        <h1 className="evr-heading evr-heading--error">{msg.heading}</h1>
        <p className="evr-body">{msg.body}</p>
        <p className="evr-action-hint">{msg.action}</p>
        <div className="evr-btn-row">
          <button className="evr-btn evr-btn--primary" onClick={handleTryAgain}>
            ← Go Back &amp; Try Again
          </button>
          <button className="evr-btn evr-btn--secondary" onClick={handleGoHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
