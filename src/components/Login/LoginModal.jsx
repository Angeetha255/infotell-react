import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setLoginOpen } from "../../store/store";
import "./LoginModal.css";

export default function LoginModal() {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [agreed, setAgreed] = useState(true);

  const close = () => dispatch(setLoginOpen(false));

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

        <button className="btn-otp">Login with OTP</button>

        <div className="login-divider">
          <span>Or Login Using</span>
        </div>

        <button className="btn-google">
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
