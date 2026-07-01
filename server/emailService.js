const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Lazily create and verify the SMTP transporter.
 * Throws if the configuration is invalid so the caller can surface the error.
 */
async function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify SMTP connection once at startup
  await transporter.verify();
  return transporter;
}

/**
 * Send the magic-link verification email.
 *
 * @param {string} to          - Recipient email address
 * @param {string} magicLink   - Full verification URL
 * @param {string} returnUrl   - The review page the user came from (for display only)
 */
async function sendVerificationEmail(to, magicLink, returnUrl) {
  const transport = await getTransporter();

  const pageLabel = returnUrl ? decodeURIComponent(returnUrl) : 'the review page';

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email – Infotell</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #0f172a; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4e0105 0%, #7b0a10 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 36px 40px; }
    .body p { font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 16px; }
    .btn-verify { display: inline-block; background: linear-gradient(135deg, #4e0105 0%, #7b0a10 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; margin: 8px 0 24px; letter-spacing: 0.2px; }
    .notice { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #713f12; margin-bottom: 20px; }
    .fallback { font-size: 12px; color: #94a3b8; word-break: break-all; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Infotell</h1>
      <p>Email Verification Required</p>
    </div>
    <div class="body">
      <p>Hi there,</p>
      <p>You requested to write a review on <strong>Infotell</strong>. To keep our reviews trustworthy, we need to verify your email address first.</p>
      <p>Click the button below to verify your email and return to the review form:</p>
      <div style="text-align:center; margin: 28px 0;">
        <a href="${magicLink}" class="btn-verify">✉ Verify Email &amp; Write Review</a>
      </div>
      <div class="notice">
        ⏱ This link is valid for <strong>30 minutes</strong> and can only be used once.
      </div>
      <p>If you did not request this, you can safely ignore this email. No account will be created.</p>
      
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Infotell. This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>
  `.trim();

  const textBody = `
Infotell — Email Verification

You requested to write a review on Infotell.

Click the link below to verify your email and open the review form:
${magicLink}

This link expires in 30 minutes and can only be used once.

If you did not request this, please ignore this email.
  `.trim();

  await transport.sendMail({
    from: process.env.EMAIL_FROM || `"Infotell" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your email to write a review – Infotell',
    text: textBody,
    html: htmlBody,
  });
}

module.exports = { sendVerificationEmail };
