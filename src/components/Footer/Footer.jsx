import React from 'react';
import './Footer.css';

const quickLinks1 = ['About us', 'Investor Relations', "We're hiring", 'Customer Care', 'Free Listing', "What's New"];
const quickLinks2 = ['Advertise', 'Media', 'Testimonials', 'Feedback', 'Business Badge', 'Jd Collection'];
const verticals   = ['B2B', 'Schools', 'Real Estate', 'All India', 'Colleges', 'Bills & Recharge'];
const services    = ['Restaurants', 'AC Repair', 'Astrologers', 'Doctors', 'Hospitals', 'Hotels'];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">

          <div>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks1.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              {quickLinks2.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">JD Verticals</h4>
            <ul className="footer-links">
              {verticals.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Popular Services</h4>
            <div className="footer-services">
              {services.map((s) => (
                <a href="#" key={s}>{s}</a>
              ))}
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p className="footer-copy">Copyright © 2026 Infotell Ltd. All Rights Reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Infringement</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
