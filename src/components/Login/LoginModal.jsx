import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setLoginOpen } from "../../store/store";
import { apiService } from "../../services/api";
import "./LoginModal.css";

export default function LoginModal() {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => dispatch(setLoginOpen(false));

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !mobile.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!agreed) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.auth.verifyOtp({
        name: name.trim(),
        mobile: mobile.trim(),
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        close();
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Google OAuth implementation would go here
      // For now, redirect to backend Google auth endpoint
      window.location.href = 'http://localhost:5006/api/public/auth/google';
    } catch (err) {
      setError("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="login-card">
        <button className="login-close" onClick={close}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="login-header">
          <div className="login-brand">Infotell</div>
          <div className="login-welcome">
            <h2>Welcome</h2>
            <p>Login for a seamless experience</p>
          </div>
        </div>

        <div className="input-group-field">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group-field">
          <label>Enter Mobile Number</label>
          <span className="country-code">+91</span>
          <input
            type="tel"
            placeholder="10-digit number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            maxLength={10}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="terms-row">
          <input
            type="checkbox"
            id="tc"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="tc">
            I Agree to <a href="#">Terms and Conditions</a>
          </label>
        </div>

        <button className="btn-otp" onClick={handleOtpLogin} disabled={loading}>
          {loading ? "Sending OTP..." : "Login with OTP"}
        </button>

        <div className="login-divider">
          <span>Or Login Using</span>
        </div>

        <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
          <img src="./img/icon/google.png" alt="Google" />
          Continue with Google
        </button>

        <a href="#" className="login-skip" onClick={close}>
          Skip for now
        </a>
      </div>
    </div>
  );
}
