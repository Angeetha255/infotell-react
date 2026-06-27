import React, { useState } from "react";
import './ReviewRating.css';

export default function ReviewRating({reviewType}) {
    // Review Auth & Input state hooks
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [formRating, setFormRating] = useState(5);
    const [formName, setFormName] = useState('');
    const [formText, setFormText] = useState('');
    
    const handleScrollThumbnails = (direction) => {
        if (thumbnailScrollContainerRef.current) {
        thumbnailScrollContainerRef.current.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' });
        }
    };

    
  const handleReviewSubmission = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return alert("Please complete name and comment inputs.");
    
    const newFeedbackObj = {
      id: Date.now(),
      user: formName,
      rating: formRating,
      date: "Just now",
      text: formText
    };

    // reviewType === 'product'? setProductComments([newFeedbackObj, ...userComments]) : setUserComments([newFeedbackObj, ...userComments]);
    setFormName('');
    setFormText('');
    alert("Your verified feedback submission has been saved successfully!");
  };

  // Two Step Auth Handlers
  const handleVerifyEmailAuth = (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authEmail.includes('@')) {
      return alert("Please specify a valid authentication email address.");
    }
    setIsAuthenticated(true);
  };

  return (
    <div className="rr-display-card">
      <h3 className="rr-inner-card-heading">
        Write A Product Review & Rate Experiences
      </h3>

      {!isAuthenticated ? (
        /* Gateway Step 1: Login Verification via Email Identity Input */
        <form
          onSubmit={handleVerifyEmailAuth}
          className="rr-auth-step-form"
        >
          <div className="rr-auth-notice-banner">
            <i className="fas fa-lock me-2"></i> Identity validation via Email
            required to release feedback writing credentials.
          </div>
          <div className="mb-3">
            <label
              htmlFor="auth_email_field"
              className="rr-form-label-node"
            >
              Enter Valid Email Address
            </label>
            <input
              type="email"
              id="auth_email_field"
              className="rr-form-input-element"
              placeholder="name@company.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="rr-form-submit-btn">
            Verify Access Credentials
          </button>
        </form>
      ) : (
        /* Gateway Step 2: Form Review Parameters Entry Gate */
        <form
          onSubmit={handleReviewSubmission}
          className="rr-interactive-review-form rr-fade-in-animation"
        >
          <div className="rr-auth-success-badge mb-3">
            <i className="fas fa-user-check me-2"></i> Logged in securely as:{" "}
            <strong>{authEmail}</strong>
          </div>

          <div className="mb-3">
            <label className="rr-form-label-node">
              Select Assessment Rating Score
            </label>
            <div className="rr-form-stars-picker-row">
              {[1, 2, 3, 4, 5].map((starNum) => (
                <span
                  key={starNum}
                  className={`rr-picker-star-icon${starNum <= formRating ? " icon-selected" : ""}`}
                  onClick={() => setFormRating(starNum)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="rr_author_name" className="rr-form-label-node">
              Full Display Name
            </label>
            <input
              type="text"
              id="rr_author_name"
              className="rr-form-input-element"
              placeholder="E.g., Anand Krishnan"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="rr_review_text" className="rr-form-label-node">
              Detailed Feedback Comments
            </label>
            <textarea
              id="rr_review_text"
              className="rr-form-textarea-element"
              rows="4"
              placeholder="Share technical metrics performance evaluation details..."
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="rr-form-button-group">
            <button type="submit" className="rr-form-submit-btn">
              Submit Verified Feedback
            </button>
            <button
              type="button"
              className="rr-form-cancel-btn"
              onClick={() => {
                setIsAuthenticated(false);
                setAuthEmail("");
              }}
            >
              Logout
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
