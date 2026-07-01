import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import './ReviewRating.css';

/**
 * ReviewRating
 *
 * A fully-wired review submission widget with Nodemailer magic-link email
 * verification.
 *
 * Flow:
 *   1. User clicks "Write a Review" → Verification modal appears
 *   2. User enters email → backend sends magic link via Nodemailer
 *   3. User clicks link in email → backend validates token → redirects back
 *      to this page with ?verified=true&verifiedEmail=... in sessionStorage
 *   4. Component detects verified session → opens review form automatically
 *   5. User fills form and submits → review saved via existing API
 *
 * Props:
 *   reviewType  : 'company' | 'product'
 *   entityId    : businessId or productId (required for API submission)
 *   onReviewAdded : optional callback({ id, name, rating, comment }) after submit
 */
export default function ReviewRating({ reviewType = 'company', entityId, onReviewAdded }) {
  const location = useLocation();
  const verificationConsumed = useRef(false); // prevent double-consuming on re-renders

  // ── Verification states ────────────────────────────────────────────────────
  const [step, setStep] = useState('idle'); // 'idle' | 'modal' | 'sent' | 'verified' | 'submitted'
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Modal email input
  const [emailInput, setEmailInput] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  // Review form fields
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Detect verified session after magic-link redirect ───────────────────────
  useEffect(() => {
    if (verificationConsumed.current) return;

    // PRIMARY: sessionStorage — set by EmailVerifyResult before navigate().
    // Reliable even when this component mounts late due to SlugResolver's
    // async API fetch (company/product lookup before rendering this page).
    const storedVerified = sessionStorage.getItem('emailVerified');
    const storedEmail    = sessionStorage.getItem('verifiedEmail');

    // SECONDARY: React Router location.state — for synchronous route renders.
    const stateEmail = location.state?.openReviewForm
      ? location.state?.verifiedEmail
      : null;

    const email = (storedVerified === 'true' && storedEmail)
      ? storedEmail
      : stateEmail;

    if (email) {
      verificationConsumed.current = true;
      setVerifiedEmail(email);
      setEmailInput(email);
      setStep('verified');

      // Consume so a page refresh does not re-open the form
      sessionStorage.removeItem('emailVerified');
      sessionStorage.removeItem('verifiedEmail');

      // Scroll into view after paint
      setTimeout(() => {
        const el = document.getElementById('rr-review-form-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }); // intentionally no dep array — runs after every render until consumed via ref guard

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /** Build the returnUrl (path only) so the backend can redirect back here */
  const getReturnPath = useCallback(() => {
    return location.pathname + (location.search || '');
  }, [location]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleWriteReviewClick = () => {
    setSendError('');
    setSendSuccess(false);
    setEmailInput('');
    setStep('modal');
  };

  const handleCloseModal = () => {
    setStep('idle');
    setSendError('');
    setSendSuccess(false);
  };

  const handleSendVerificationLink = async (e) => {
    e.preventDefault();
    setSendError('');

    const email = emailInput.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      setSendError('Please enter a valid email address.');
      return;
    }

    setSendLoading(true);
    try {
      // Save return path BEFORE navigating away so EmailVerifyResult can redirect back
      sessionStorage.setItem('reviewReturnPath', getReturnPath());

      await apiService.emailVerification.sendLink({
        email,
        returnUrl: getReturnPath(),
      });

      setSendSuccess(true);
      setStep('sent');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to send verification email. Please try again.';
      setSendError(msg);
    } finally {
      setSendLoading(false);
    }
  };

  const handleResendLink = async () => {
    setSendSuccess(false);
    setSendError('');
    setSendLoading(true);
    try {
      sessionStorage.setItem('reviewReturnPath', getReturnPath());
      await apiService.emailVerification.sendLink({
        email: emailInput.trim().toLowerCase(),
        returnUrl: getReturnPath(),
      });
      setSendSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to resend. Please try again.';
      setSendError(msg);
    } finally {
      setSendLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!formText.trim()) {
      setSubmitError('Please write your review.');
      return;
    }

    setSubmitLoading(true);
    try {
      let response;
      const payload = {
        userName: formName.trim(),
        userEmail: verifiedEmail,
        rating: formRating,
        comment: formText.trim(),
      };

      if (reviewType === 'product') {
        response = await apiService.reviews.create({ ...payload, productId: entityId });
      } else {
        response = await apiService.reviews.create({ ...payload, businessId: entityId });
      }

      if (response.data) {
        onReviewAdded?.({
          id: response.data.id,
          name: formName.trim(),
          rating: formRating,
          comment: formText.trim(),
          pic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        });
      }

      setStep('submitted');
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = () => {
    setVerifiedEmail('');
    setEmailInput('');
    setFormName('');
    setFormText('');
    setFormRating(5);
    setSubmitError('');
    setStep('idle');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rr-display-card" id="rr-review-form-anchor">
      <h3 className="rr-inner-card-heading">Write a Review</h3>

      {/* ── IDLE: Show "Write a Review" button ── */}
      {step === 'idle' && (
        <div className="rr-idle-state">
          <p className="rr-idle-desc">
            Share your experience. Your review helps others make better decisions.
          </p>
          <button className="rr-form-submit-btn" onClick={handleWriteReviewClick}>
            ✍ Write a Review
          </button>
        </div>
      )}

      {/* ── MODAL: Email Verification Gate ── */}
      {step === 'modal' && (
        <div className="rr-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="rr-modal-card rr-fade-in-animation">
            <button className="rr-modal-close" onClick={handleCloseModal} aria-label="Close">
              ×
            </button>
            <div className="rr-modal-icon">📧</div>
            <h4 className="rr-modal-heading">Verify Your Email</h4>
            <p className="rr-modal-desc">
              To keep reviews trustworthy, we need to verify your email address before you can submit a review.
              We'll send you a secure one-click verification link.
            </p>
            <form onSubmit={handleSendVerificationLink} className="rr-modal-form">
              <div className="mb-3">
                <label htmlFor="rr_email_input" className="rr-form-label-node">
                  Email Address <span className="rr-required">*</span>
                </label>
                <input
                  id="rr_email_input"
                  type="email"
                  className={`rr-form-input-element${sendError ? ' rr-input--error' : ''}`}
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setSendError(''); }}
                  required
                  autoFocus
                  disabled={sendLoading}
                />
                {sendError && <p className="rr-field-error">{sendError}</p>}
              </div>
              <button
                type="submit"
                className="rr-form-submit-btn rr-btn--full"
                disabled={sendLoading}
              >
                {sendLoading ? (
                  <span><span className="rr-spinner" /> Sending…</span>
                ) : (
                  '📨 Send Verification Link'
                )}
              </button>
            </form>
            <p className="rr-modal-privacy">
              🔒 We only use this email for review verification. No spam, ever.
            </p>
          </div>
        </div>
      )}

      {/* ── SENT: Waiting for user to click email link ── */}
      {step === 'sent' && (
        <div className="rr-sent-state rr-fade-in-animation">
          <div className="rr-sent-icon">📬</div>
          <h4 className="rr-sent-heading">Check Your Inbox</h4>
          <p className="rr-sent-body">
            A verification link has been sent to <strong>{emailInput}</strong>.
            Click the link in the email to verify your address and return here to write your review.
          </p>
          <div className="rr-sent-notice">
            ⏱ The link expires in <strong>30 minutes</strong>. Check your spam folder if you don't see it.
          </div>
          <div className="rr-sent-actions">
            <button className="rr-btn-text" onClick={handleResendLink} disabled={sendLoading}>
              {sendLoading ? 'Resending…' : 'Resend verification email'}
            </button>
            <button className="rr-btn-text rr-btn-text--muted" onClick={handleCloseModal}>
              Change email address
            </button>
          </div>
          {sendSuccess && !sendLoading && (
            <p className="rr-resend-success">✅ A new verification link has been sent.</p>
          )}
          {sendError && <p className="rr-field-error">{sendError}</p>}
        </div>
      )}

      {/* ── VERIFIED: Review form (only shown after successful magic-link verification) ── */}
      {step === 'verified' && (
        <form onSubmit={handleReviewSubmit} className="rr-interactive-review-form rr-fade-in-animation">
          <div className="rr-auth-success-badge mb-3">
            <i className="fas fa-check-circle me-2"></i>
            Email verified: <strong>{verifiedEmail}</strong>
          </div>

          {/* Star Rating */}
          <div className="mb-3">
            <label className="rr-form-label-node">
              Rating <span className="rr-required">*</span>
            </label>
            <div className="rr-form-stars-picker-row" role="group" aria-label="Select rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`rr-picker-star-icon${star <= formRating ? ' icon-selected' : ''}`}
                  onClick={() => setFormRating(star)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && setFormRating(star)}
                >
                  ★
                </span>
              ))}
              <span className="rr-rating-label">{formRating} / 5</span>
            </div>
          </div>

          {/* Name */}
          <div className="mb-3">
            <label htmlFor="rr_author_name" className="rr-form-label-node">
              Full Name <span className="rr-required">*</span>
            </label>
            <input
              id="rr_author_name"
              type="text"
              className="rr-form-input-element"
              placeholder="E.g., Anand Krishnan"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              maxLength={80}
            />
          </div>

          {/* Email (read-only, pre-filled) */}
          <div className="mb-3">
            <label htmlFor="rr_email_display" className="rr-form-label-node">
              Email Address <span className="rr-verified-tag">✓ Verified</span>
            </label>
            <input
              id="rr_email_display"
              type="email"
              className="rr-form-input-element rr-input--readonly"
              value={verifiedEmail}
              readOnly
              tabIndex={-1}
            />
          </div>

          {/* Review text */}
          <div className="mb-3">
            <label htmlFor="rr_review_text" className="rr-form-label-node">
              Your Review <span className="rr-required">*</span>
            </label>
            <textarea
              id="rr_review_text"
              className="rr-form-textarea-element"
              rows="4"
              placeholder="Describe your experience in detail…"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              required
              maxLength={1000}
            />
            <div className="rr-char-count">{formText.length} / 1000</div>
          </div>

          {submitError && <p className="rr-field-error rr-field-error--form">{submitError}</p>}

          <div className="rr-form-button-group">
            <button type="submit" className="rr-form-submit-btn" disabled={submitLoading}>
              {submitLoading ? (
                <span><span className="rr-spinner" /> Submitting…</span>
              ) : (
                '🚀 Submit Review'
              )}
            </button>
            <button type="button" className="rr-form-cancel-btn" onClick={handleLogout}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── SUBMITTED: Thank you state ── */}
      {step === 'submitted' && (
        <div className="rr-submitted-state rr-fade-in-animation">
          <div className="rr-submitted-icon">🎉</div>
          <h4 className="rr-submitted-heading">Thank You!</h4>
          <p className="rr-submitted-body">
            Your review has been submitted successfully. It helps others discover great businesses.
          </p>
          <button
            className="rr-btn-text"
            onClick={() => {
              setStep('idle');
              setFormName('');
              setFormText('');
              setFormRating(5);
              setVerifiedEmail('');
              setEmailInput('');
            }}
          >
            Write another review
          </button>
        </div>
      )}
    </div>
  );
}
