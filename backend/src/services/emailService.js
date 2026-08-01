/**
 * emailService.js
 * Dual-transport email service — automatically picks the right provider:
 *
 *   TRANSPORT PRIORITY:
 *   1. Resend (HTTP API)   — set RESEND_API_KEY in .env  → works on Render free tier
 *   2. Nodemailer (SMTP)   — set EMAIL_HOST/USER/PASS     → works locally with Gmail App Password
 *   3. No-op               — neither configured            → logs a warning, degrades gracefully
 *
 * ── Resend setup (for Render / production) ──────────────────────────────────
 *   1. Sign up free at resend.com
 *   2. Dashboard → API Keys → Create Key
 *   3. Add to .env:  RESEND_API_KEY=re_xxxxxxxxxxxx
 *   4. (Optional) Add & verify your domain in Resend for a custom FROM address.
 *      Without a verified domain, emails come from "onboarding@resend.dev".
 *
 * ── Nodemailer / Gmail setup (for local dev) ────────────────────────────────
 *   1. myaccount.google.com → Security → 2-Step Verification → enable
 *   2. myaccount.google.com → Security → App passwords → create "HimShakti Mail"
 *   3. Add to .env:  EMAIL_HOST=smtp.gmail.com  EMAIL_PORT=465
 *                    EMAIL_USER=you@gmail.com   EMAIL_PASS=xxxxxxxxxxxx
 */

'use strict';

const nodemailer = require('nodemailer');

// ── Transport detection ───────────────────────────────────────────────────────

/**
 * Returns which transport is available: 'resend' | 'smtp' | null
 */
function detectTransport() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
  return null;
}

/**
 * Sends an email using whichever transport is configured.
 * @param {{ from, to, subject, html, text }} options
 * @returns {{ sent: boolean, reason?: string }}
 */
async function sendEmail({ from, to, subject, html, text }) {
  const transport = detectTransport();

  // ── Resend (HTTP, works on Render free tier) ───────────────────────────────
  if (transport === 'resend') {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return { sent: true };
  }

  // ── Nodemailer / SMTP (Gmail App Password, for local dev) ─────────────────
  if (transport === 'smtp') {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE !== 'false',
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls:    { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    });

    await transporter.sendMail({ from, to, subject, html, text });
    return { sent: true };
  }

  // ── Not configured ─────────────────────────────────────────────────────────
  return { sent: false, reason: 'Email not configured' };
}

/** Builds the FROM header based on configured provider */
function getFrom() {
  const name = process.env.EMAIL_FROM_NAME || 'HimShakti Traceability';

  // Resend: use verified domain address if set, otherwise their sandbox address
  if (process.env.RESEND_API_KEY) {
    const addr = process.env.EMAIL_FROM_ADDR || 'onboarding@resend.dev';
    return `${name} <${addr}>`;
  }

  // SMTP
  const addr = process.env.EMAIL_FROM_ADDR || process.env.EMAIL_USER || 'noreply@himshakti.in';
  return `"${name}" <${addr}>`;
}

// ── HTML Templates ────────────────────────────────────────────────────────────

function buildInviteHtml({ recipientName, role, inviteLink, expiresHours = 48, approvedBy }) {
  const BRAND_COLOR  = '#e8632a';
  const BRAND_DARK   = '#c4501e';
  const GREEN        = '#1a4731';
  const ROLE_DISPLAY = role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your HimShakti Access Has Been Approved</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">

      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${GREEN};padding:32px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${BRAND_COLOR};border-radius:10px;display:inline-block;text-align:center;line-height:40px;">
                  <span style="color:#fff;font-size:16px;font-weight:900;">HS</span>
                </div>
                <div style="display:inline-block;vertical-align:middle;margin-left:10px;">
                  <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;line-height:1;">HimShakti</p>
                  <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.05em;">Traceability Platform</p>
                </div>
              </div>
            </td></tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:100px;padding:4px 14px;margin-bottom:24px;">
              <span style="color:#065f46;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">✓ Access Approved</span>
            </div>

            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;">
              Welcome to HimShakti, ${recipientName.split(' ')[0]}!
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              Your access request has been reviewed and approved by <strong style="color:#374151;">${approvedBy}</strong>.
              You've been granted the <strong style="color:#374151;">${ROLE_DISPLAY}</strong> role on the HimShakti Traceability Platform.
            </p>

            <!-- Role badge -->
            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Your Access Details</p>
              <p style="margin:0;font-size:14px;color:#111827;">
                <strong>Name:</strong> ${recipientName}<br/>
                <strong>Role:</strong> ${ROLE_DISPLAY}<br/>
                <strong>Link expires:</strong> ${expiresHours} hours from now
              </p>
            </div>

            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
              Click the button below to set your password and activate your account. This link is single-use and expires in <strong>${expiresHours} hours</strong>.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:${BRAND_COLOR};border-radius:12px;text-align:center;">
                  <a href="${inviteLink}"
                     style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                    Set Your Password →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin:0;font-size:11px;color:#6b7280;word-break:break-all;">
              <a href="${inviteLink}" style="color:${BRAND_COLOR};">${inviteLink}</a>
            </p>
          </td>
        </tr>

        <tr><td style="border-top:1px solid #f3f4f6;"></td></tr>

        <!-- Security note -->
        <tr>
          <td style="padding:20px 40px;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              🔒 <strong style="color:#6b7280;">Security note:</strong> This link is personal and single-use.
              Do not share it. If you did not request access to HimShakti, please ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;background:#fafafa;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">
              © 2026 HimShakti Food Processing Pvt. Ltd., Uttarakhand, India<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildRejectionHtml({ recipientName, role, note, rejectedBy }) {
  const ROLE_DISPLAY = role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>HimShakti Access Request Update</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a4731;padding:32px 40px 28px;">
          <div style="display:inline-block;background:#e8632a;width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;vertical-align:middle;">
            <span style="color:#fff;font-size:16px;font-weight:900;">HS</span>
          </div>
          <span style="color:#fff;font-size:16px;font-weight:700;margin-left:12px;vertical-align:middle;">HimShakti Traceability</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:100px;padding:4px 14px;margin-bottom:24px;">
            <span style="color:#991b1b;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Access Request Update</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Hi ${recipientName.split(' ')[0]},</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
            Thank you for your interest in the HimShakti Traceability Platform. After review, your request for <strong style="color:#374151;">${ROLE_DISPLAY}</strong> access was not approved at this time.
          </p>
          ${note ? `<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;">Reviewer Note</p>
            <p style="margin:0;font-size:14px;color:#374151;">${note}</p>
          </div>` : ''}
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
            If you believe this is an error, please contact your HimShakti administrator directly.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px 28px;background:#fafafa;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">
            © 2026 HimShakti Food Processing Pvt. Ltd., Uttarakhand, India
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildOtpHtml({ recipientName, otp, username }) {
  const BRAND_COLOR = '#e8632a';
  const GREEN       = '#1a4731';
  const digits      = otp.split('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your HimShakti account</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${GREEN};padding:28px 40px;">
            <div style="display:inline-block;background:${BRAND_COLOR};width:36px;height:36px;border-radius:9px;text-align:center;line-height:36px;vertical-align:middle;">
              <span style="color:#fff;font-size:14px;font-weight:900;">HS</span>
            </div>
            <span style="color:#fff;font-size:15px;font-weight:700;margin-left:10px;vertical-align:middle;">HimShakti Traceability</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:100px;padding:4px 14px;margin-bottom:24px;">
              <span style="color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">🔐 Verify Your Email</span>
            </div>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2;">
              Almost there, ${recipientName.split(' ')[0]}!
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Enter this 6-digit code to verify your email and complete your HimShakti account setup.
              Your username is <strong style="color:#111827;">${username}</strong>.
            </p>

            <!-- OTP digit boxes -->
            <div style="text-align:center;margin-bottom:28px;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  ${digits.map(d => `
                  <td style="padding:0 5px;">
                    <div style="width:52px;height:64px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;text-align:center;line-height:64px;font-size:32px;font-weight:900;color:#111827;font-family:'Courier New',monospace;">
                      ${d}
                    </div>
                  </td>`).join('')}
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Expires in <strong>10 minutes</strong></p>
            </div>

            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                🔒 <strong style="color:#6b7280;">Security note:</strong> This code is single-use and expires in 10 minutes.
                If you did not request this, please ignore this email.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;background:#fafafa;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">
              © 2026 HimShakti Food Processing Pvt. Ltd., Uttarakhand, India<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send the approval invite email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendApprovalEmail({ toEmail, toName, role, inviteLink, approvedBy }) {
  const transport = detectTransport();
  if (!transport) {
    console.warn('[Email] Not configured — skipping approval email. Set RESEND_API_KEY or EMAIL_HOST/USER/PASS in .env');
    return { sent: false, reason: 'Email not configured' };
  }

  console.log(`[Email] Sending approval email via ${transport} to ${toEmail}`);

  try {
    return await sendEmail({
      from:    getFrom(),
      to:      toEmail,
      subject: `✅ Your HimShakti access has been approved — set your password`,
      html:    buildInviteHtml({ recipientName: toName, role, inviteLink, expiresHours: 48, approvedBy }),
      text:    `Hi ${toName},\n\nYour HimShakti access request has been approved.\n\nSet your password here (expires in 48 hours):\n${inviteLink}\n\n— HimShakti Team`,
    });
  } catch (err) {
    console.error(`[Email] Approval email failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send the rejection notification email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendRejectionEmail({ toEmail, toName, role, note, rejectedBy }) {
  const transport = detectTransport();
  if (!transport) {
    console.warn('[Email] Not configured — skipping rejection email.');
    return { sent: false, reason: 'Email not configured' };
  }

  console.log(`[Email] Sending rejection email via ${transport} to ${toEmail}`);

  try {
    return await sendEmail({
      from:    getFrom(),
      to:      toEmail,
      subject: `HimShakti Access Request — Update`,
      html:    buildRejectionHtml({ recipientName: toName, role, note, rejectedBy }),
      text:    `Hi ${toName},\n\nYour HimShakti access request was not approved at this time.${note ? `\n\nNote: ${note}` : ''}\n\nPlease contact your administrator if you have questions.`,
    });
  } catch (err) {
    console.error(`[Email] Rejection email failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send the 6-digit OTP verification email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendOtpEmail({ toEmail, toName, otp, username }) {
  const transport = detectTransport();
  if (!transport) {
    console.warn('[Email] Not configured — skipping OTP email.');
    return { sent: false, reason: 'Email not configured' };
  }

  console.log(`[Email] Sending OTP email via ${transport} to ${toEmail}`);

  try {
    return await sendEmail({
      from:    getFrom(),
      to:      toEmail,
      subject: `${otp} — Your HimShakti verification code`,
      html:    buildOtpHtml({ recipientName: toName, otp, username }),
      text:    `Hi ${toName},\n\nYour HimShakti verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n— HimShakti Team`,
    });
  } catch (err) {
    console.error(`[Email] OTP email failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}


/**
 * Send a 6-digit password-reset OTP email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendPasswordResetOtpEmail({ toEmail, toName, otp, username }) {
  const transport = detectTransport();
  if (!transport) {
    console.warn('[Email] Not configured — skipping password-reset OTP email.');
    return { sent: false, reason: 'Email not configured' };
  }

  console.log(`[Email] Sending password-reset OTP via ${transport} to ${toEmail}`);

  const BRAND_COLOR = '#e8632a';
  const GREEN       = '#1a4731';
  const digits      = otp.split('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your HimShakti password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${GREEN};padding:28px 40px;">
            <div style="display:inline-block;background:${BRAND_COLOR};width:36px;height:36px;border-radius:9px;text-align:center;line-height:36px;vertical-align:middle;">
              <span style="color:#fff;font-size:14px;font-weight:900;">HS</span>
            </div>
            <span style="color:#fff;font-size:15px;font-weight:700;margin-left:10px;vertical-align:middle;">HimShakti Traceability</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:100px;padding:4px 14px;margin-bottom:24px;">
              <span style="color:#991b1b;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">🔑 Password Reset</span>
            </div>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2;">
              Reset your password, ${toName.split(' ')[0]}
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              We received a password reset request for username <strong style="color:#111827;">${username}</strong>.
              Use the code below to reset your password. This code expires in <strong>5 minutes</strong>.
            </p>

            <!-- OTP digit boxes -->
            <div style="text-align:center;margin-bottom:28px;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  ${digits.map(d => `
                  <td style="padding:0 5px;">
                    <div style="width:52px;height:64px;background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;text-align:center;line-height:64px;font-size:32px;font-weight:900;color:#991b1b;font-family:'Courier New',monospace;">
                      ${d}
                    </div>
                  </td>`).join('')}
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Expires in <strong>5 minutes</strong></p>
            </div>

            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                🔒 <strong style="color:#6b7280;">Security note:</strong> If you did not request a password reset,
                please ignore this email. Your password will not be changed.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;background:#fafafa;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">
              © 2026 HimShakti Food Processing Pvt. Ltd., Uttarakhand, India<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    return await sendEmail({
      from:    getFrom(),
      to:      toEmail,
      subject: `${otp} — Reset your HimShakti password`,
      html,
      text: `Hi ${toName},\n\nYour HimShakti password reset code is: ${otp}\n\nThis code expires in 5 minutes.\nUsername: ${username}\n\nIf you did not request this, please ignore this email.\n\n— HimShakti Team`,
    });
  } catch (err) {
    console.error(`[Email] Password-reset OTP email failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendApprovalEmail, sendRejectionEmail, sendOtpEmail, sendPasswordResetOtpEmail };

