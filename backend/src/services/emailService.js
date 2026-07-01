/**
 * emailService.js
 * Sends branded HTML transactional emails via Nodemailer.
 *
 * Configuration (set in backend/.env):
 *   EMAIL_FROM_NAME   — display name,       e.g. "HimShakti Traceability"
 *   EMAIL_FROM_ADDR   — sender address,     e.g. "noreply@himshakti.com"
 *   EMAIL_HOST        — SMTP host,          e.g. "smtp.gmail.com"
 *   EMAIL_PORT        — SMTP port,          e.g. 465 (SSL) or 587 (TLS)
 *   EMAIL_SECURE      — "true" for port 465, "false" for 587
 *   EMAIL_USER        — SMTP login username
 *   EMAIL_PASS        — SMTP password / Gmail App Password
 *
 * Quick Gmail setup (takes ~2 minutes):
 *   1. myaccount.google.com → Security → 2-Step Verification → enable
 *   2. myaccount.google.com → Security → App passwords → create "HimShakti Mail"
 *   3. Copy the 16-char password → EMAIL_PASS in .env
 *   4. Set EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=465, EMAIL_SECURE=true
 */

'use strict';
const nodemailer = require('nodemailer');

// ── Transporter (lazy-init so missing config silently degrades) ──────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null; // email not configured

  _transporter = nodemailer.createTransport({
    host:   EMAIL_HOST,
    port:   parseInt(EMAIL_PORT || '465', 10),
    secure: EMAIL_SECURE !== 'false', // true by default (port 465)
    auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
    tls:    { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });

  return _transporter;
}

// ── Branded HTML email template ──────────────────────────────────────────────
function buildInviteHtml({ recipientName, role, inviteLink, expiresHours = 48, approvedBy }) {
  const BRAND_COLOR   = '#e8632a';
  const BRAND_DARK    = '#c4501e';
  const GREEN         = '#1a4731';
  const ROLE_DISPLAY  = role
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your HimShakti Access Has Been Approved</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header banner -->
        <tr>
          <td style="background:${GREEN};padding:32px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;background:${BRAND_COLOR};border-radius:10px;display:inline-block;text-align:center;line-height:40px;">
                      <span style="color:#fff;font-size:16px;font-weight:900;">HS</span>
                    </div>
                    <div style="display:inline-block;vertical-align:middle;margin-left:10px;">
                      <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;line-height:1;">HimShakti</p>
                      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.05em;">Traceability Platform</p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">

            <!-- Status pill -->
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

            <!-- CTA button -->
            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
              Click the button below to set your password and activate your account. This link is single-use and expires in <strong>${expiresHours} hours</strong>.
            </p>

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

            <!-- Fallback link -->
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin:0;font-size:11px;color:#6b7280;word-break:break-all;">
              <a href="${inviteLink}" style="color:${BRAND_COLOR};">${inviteLink}</a>
            </p>

          </td>
        </tr>

        <!-- Divider -->
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
      <!-- /Card -->

    </td></tr>
  </table>

</body>
</html>`;
}

// ── Rejection email ──────────────────────────────────────────────────────────
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
            If you believe this is an error, please contact your HimShakti administrator directly. You may also submit a new request through the platform.
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

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send the approval invite email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendApprovalEmail({ toEmail, toName, role, inviteLink, approvedBy }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] Not configured — skipping approval email. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env');
    return { sent: false, reason: 'Email not configured' };
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'HimShakti Traceability';
  const fromAddr = process.env.EMAIL_FROM_ADDR || process.env.EMAIL_USER;

  await transporter.sendMail({
    from:    `"${fromName}" <${fromAddr}>`,
    to:      `"${toName}" <${toEmail}>`,
    subject: `✅ Your HimShakti access has been approved — set your password`,
    html:    buildInviteHtml({ recipientName: toName, role, inviteLink, expiresHours: 48, approvedBy }),
    text:    `Hi ${toName},\n\nYour HimShakti Traceability Platform access request has been approved.\n\nSet your password here (expires in 48 hours):\n${inviteLink}\n\n— HimShakti Team`,
  });

  return { sent: true };
}

/**
 * Send the rejection notification email.
 * Returns { sent: true } or { sent: false, reason: '...' }
 */
async function sendRejectionEmail({ toEmail, toName, role, note, rejectedBy }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] Not configured — skipping rejection email.');
    return { sent: false, reason: 'Email not configured' };
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'HimShakti Traceability';
  const fromAddr = process.env.EMAIL_FROM_ADDR || process.env.EMAIL_USER;

  await transporter.sendMail({
    from:    `"${fromName}" <${fromAddr}>`,
    to:      `"${toName}" <${toEmail}>`,
    subject: `HimShakti Access Request — Update`,
    html:    buildRejectionHtml({ recipientName: toName, role, note, rejectedBy }),
    text:    `Hi ${toName},\n\nYour HimShakti access request was not approved at this time.${note ? `\n\nNote: ${note}` : ''}\n\nPlease contact your administrator if you have questions.`,
  });

  return { sent: true };
}

module.exports = { sendApprovalEmail, sendRejectionEmail };
