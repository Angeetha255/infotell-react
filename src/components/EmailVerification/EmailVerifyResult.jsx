import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './EmailVerifyResult.css';

/**
 * EmailVerifyResult
 *
 * Landing page after the backend validates the magic-link token.
 * The backend redirects here as:
 *
 *   Success: /verify-email-result?verified=true&verifiedEmail=...&returnUrl=...
 *   Failure: /verify-email-result?verified=false&reason=invalid|expired|used&returnUrl=...
 *
 * On SUCCESS:
 *   - Immediately navigate() to the original review page (returnUrl)
 *   - Pass { openReviewForm: true, verifiedEmail } via React Router state
 *   - ReviewRating picks up the state and opens the form automatically
 *   - The token never appears in the final review page URL
 *
 * On FAILURE:
 *   - Show a clear error message with a "Try Again" button
 *   - "Try Again" navigates back to the review page where the user can
 *     re-enter their email and request a new link
 */
export default function EmailVerifyResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirected = useRef(false); // guard against double-fire in StrictMode

  const verified    = searchParams.get('verified') === 'true';
  const verifiedEmail = searchParams.get('verifiedEmail') || '';
  const reason      = searchParams.get('reason') || 'invalid';

  // The backend encodes the original review page path here
  const rawReturnUrl  = searchParams.get('returnUrl') || '';
  // Also fall back to whatever the user's browser saved before leaving
  const savedPath     = sessionStorage.getItem('reviewReturnPath') || '/';
  const returnPath    = rawReturnUrl
    ? (rawReturnUrl.startsWith('/') ? rawReturnUrl : `/${rawReturnUrl}`)
    : (savedPath.startsWith('/')   ? savedPath     : `/${savedPath}`);

  // ── Success: navigate back to review page immediately ─────────────────────
  useEffect(() => {
    if (!verified || redirected.current) return;
    redirected.current = true;

    // Write to sessionStorage FIRST so ReviewRating can read it on mount,
    // regardless of whether it mounts before or after the navigate() call.
    // (SlugResolver delays CompanyPage mount by doing async API calls first,
    //  so location.state alone is not reliable — sessionStorage is.)
    sessionStorage.setItem('emailVerified', 'true');
    sessionStorage.setItem('verifiedEmail', verifiedEmail);
    sessionStorage.removeItem('reviewReturnPath');

    // Navigate to the review page. Also pass state as a secondary signal
    // for cases where the page mounts synchronously (direct routes).
    navigate(returnPath, {
      replace: true,
      state: { openReviewForm: true, verifiedEmail },
    });
  }, [verified, verifiedEmail, navigate, returnPath]);

  // While redirect is in progress show a brief loading screen
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
            <div className="evr-progress-fill" style={{ animationDuration: '1.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Failure state ─────────────────────────────────────────────────────────
  const reasonMessages = {
    expired: {
      icon: '⏱',
      heading: 'Link Expired',
      body: 'This verification link has expired. Magic links are valid for 30 minutes.',
      action: 'Please go back and request a new verification email.',
    },
    used: {
      icon: '🔒',
      heading: 'Link Already Used',
      body: 'This verification link has already been used.',
      action: 'Each link is single-use. Please go back and request a new one.',
    },
    invalid: {
      icon: '❌',
      heading: 'Invalid Link',
      body: 'This verification link is invalid or has expired.',
      action: 'Please go back and request a new verification email.',
    },
  };

  const msg = reasonMessages[reason] || reasonMessages.invalid;

  const handleTryAgain = () => {
    sessionStorage.removeItem('reviewReturnPath');
    navigate(returnPath, { replace: true });
  };

  const handleGoHome = () => navigate('/', { replace: true });

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
