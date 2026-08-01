const crypto        = require('crypto');
const bcrypt        = require('bcryptjs');
const User          = require('../models/User.model');
const AccessRequest = require('../models/AccessRequest.model');
const { generateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { sendApprovalEmail, sendRejectionEmail, sendOtpEmail, sendPasswordResetOtpEmail } = require('../services/emailService');

// ─────────────────────────────────────────────────────────────────
// POST /auth/login
// Now checks MongoDB users collection — hardcoded block is gone.
// ─────────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim(), isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken({ username: user.username, name: user.name, role: user.role });
    return res.json({
      success: true,
      token,
      user: { username: user.username, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/request-access
// Public — saves new request. 409 on duplicate email.
// ─────────────────────────────────────────────────────────────────
async function requestAccess(req, res, next) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'name, email, and role are required' });
    }

    const request = await AccessRequest.create({ name, email, role });
    return res.status(201).json({ success: true, message: 'Access request submitted', id: request._id });
  } catch (err) {
    // Duplicate email → clean 409 (Issue 2 fix)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error:   'A request for this email already exists. The admin team will be in touch.',
      });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /auth/requests  [admin only]
// Returns all requests sorted newest first.
// ─────────────────────────────────────────────────────────────────
async function listRequests(req, res, next) {
  try {
    const requests = await AccessRequest.find()
      .select('-inviteToken')   // never expose the stored hash
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/requests/:id/approve  [admin only]
// Generates a secure crypto token (NOT a JWT — Issue 3 fix).
// Returns the raw invite link for the admin to share.
// ─────────────────────────────────────────────────────────────────
async function approve(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, error: `Request is already ${request.status}` });
    }

    // Generate random 32-byte token — raw sent to user, hashed stored in DB
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    request.status      = 'approved';
    request.inviteToken  = hashedToken;
    request.inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    request.inviteUsed   = false;
    request.approvedBy   = req.user.username;
    await request.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink  = `${frontendUrl}/invite?token=${rawToken}`;

    // ── Auto-send approval email ──────────────────────────────────────────
    let emailResult = { sent: false, reason: 'no email address on record' };
    if (request.email) {
      try {
        emailResult = await sendApprovalEmail({
          toEmail:    request.email,
          toName:     request.name,
          role:       request.role,
          inviteLink,
          approvedBy: req.user.username,
        });
      } catch (emailErr) {
        // Never block the approval response due to email failure
        console.error('[Email] Approval email failed:', emailErr.message);
        emailResult = { sent: false, reason: emailErr.message };
      }
    }

    return res.json({
      success:    true,
      message:    emailResult.sent
        ? `Request approved — invite email sent to ${request.email}`
        : 'Request approved — email not sent (see emailError). Share the invite link manually.',
      inviteLink,
      expiresIn:  '48 hours',
      requestId:  request._id,
      emailSent:  emailResult.sent,
      emailError: emailResult.sent ? undefined : emailResult.reason,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/requests/:id/reject  [admin only]
// ─────────────────────────────────────────────────────────────────
async function reject(req, res, next) {
  try {
    const { note } = req.body;
    const request  = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, error: `Request is already ${request.status}` });
    }

    request.status     = 'rejected';
    request.note       = note || '';
    request.approvedBy = req.user.username;
    await request.save();

    // ── Auto-send rejection notification email ────────────────────────────
    if (request.email) {
      try {
        await sendRejectionEmail({
          toEmail:    request.email,
          toName:     request.name,
          role:       request.role,
          note:       note || '',
          rejectedBy: req.user.username,
        });
      } catch (emailErr) {
        console.error('[Email] Rejection email failed:', emailErr.message);
      }
    }

    return res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/activate  [public]
// New user sets their password using the one-time invite token.
// After account is created, a 6-digit OTP is sent to verify email.
// ─────────────────────────────────────────────────────────────────
async function activate(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    // Hash the incoming raw token and look it up in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const request = await AccessRequest.findOne({
      inviteToken:  hashedToken,
      status:       'approved',
      inviteUsed:   false,
      inviteExpiry: { $gt: new Date() },
    });

    if (!request) {
      return res.status(400).json({
        success: false,
        error:   'Invite link is invalid, expired, or already used.',
      });
    }

    // Check if a user with this email already exists (edge case: double activation)
    const existing = await User.findOne({ email: request.email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Account already activated. Please sign in.' });
    }

    // Generate username from first name (lowercased, no spaces)
    const baseUsername = request.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let suffix   = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${suffix++}`;
    }

    // Generate 6-digit OTP — raw for email, SHA-256 stored in DB
    const rawOtp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // Create user account (emailVerified: false until OTP confirmed)
    await User.create({
      username,
      passwordHash:  await bcrypt.hash(password, 12),
      name:          request.name,
      email:         request.email,
      role:          request.role,
      emailVerified: false,
      otpCode:       hashedOtp,
      otpExpiry:     new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Invalidate the invite token — one use only
    request.inviteUsed  = true;
    request.inviteToken = undefined;
    await request.save();

    // Send OTP email (non-blocking — account is created regardless)
    let otpSent = false;
    try {
      const result = await sendOtpEmail({
        toEmail:  request.email,
        toName:   request.name,
        otp:      rawOtp,
        username,
      });
      otpSent = result.sent;
    } catch (emailErr) {
      console.error('[Email] OTP email failed:', emailErr.message);
    }

    return res.json({
      success:     true,
      message:     'Account created — please verify your email with the OTP sent to you.',
      requiresOtp: true,
      otpSent,
      username,
      email:       request.email,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/verify-otp  [public]
// Verifies the 6-digit OTP. Marks the account as emailVerified.
// ─────────────────────────────────────────────────────────────────
async function verifyOtp(req, res, next) {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) {
      return res.status(400).json({ success: false, error: 'username and otp are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Already verified
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified. You can sign in.' });
    }

    // Check expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Compare hashed OTP
    const hashedInput = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (hashedInput !== user.otpCode) {
      return res.status(400).json({ success: false, error: 'Incorrect OTP. Please check and try again.' });
    }

    // Mark verified, clear OTP fields
    user.emailVerified = true;
    user.otpCode       = null;
    user.otpExpiry     = null;
    await user.save();

    return res.json({
      success:  true,
      message:  'Email verified successfully! You can now sign in.',
      username: user.username,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/verify-otp/resend  [public]
// Re-generates and re-sends the OTP for a given username.
// Rate-limit friendly — only works if account exists & not verified.
// ─────────────────────────────────────────────────────────────────
async function resendOtp(req, res, next) {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'username is required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified. Please sign in.' });
    }

    // Generate fresh OTP
    const rawOtp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    user.otpCode   = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    let otpSent = false;
    try {
      const result = await sendOtpEmail({
        toEmail:  user.email,
        toName:   user.name,
        otp:      rawOtp,
        username: user.username,
      });
      otpSent = result.sent;
    } catch (emailErr) {
      console.error('[Email] Resend OTP failed:', emailErr.message);
    }

    return res.json({ success: true, otpSent, message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /auth/users  [admin only]
// Returns all registered users (no passwordHash) + summary stats.
// ─────────────────────────────────────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Role distribution for the admin stats panel
    const roleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    // Pending request count
    const pendingCount = await AccessRequest.countDocuments({ status: 'pending' });

    return res.json({
      success: true,
      count:   users.length,
      stats: {
        totalUsers:    users.length,
        activeUsers:   users.filter(u => u.isActive).length,
        pendingRequests: pendingCount,
        roleCounts,
      },
      data: users,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /auth/users/:id/toggle  [admin only]
// Activate or deactivate a user account.
// ─────────────────────────────────────────────────────────────────
async function toggleUserStatus(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Prevent admin from deactivating themselves
    if (user.username === req.user.username) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
    }
    user.isActive = !user.isActive;
    await user.save();
    return res.json({
      success:  true,
      message:  `User ${user.username} is now ${user.isActive ? 'active' : 'inactive'}`,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /auth/me/google-link  [any authenticated user]
// Saves or removes the user's linked Google email on their own account.
// No real OAuth flow — stores email for display / future SSO readiness.
// ─────────────────────────────────────────────────────────────────
async function linkGoogle(req, res, next) {
  try {
    const { googleEmail } = req.body;
    // req.user is set by protect() middleware
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!googleEmail) {
      // Unlink
      user.googleEmail = null;
      user.googleLinkedAt = null;
    } else {
      // Basic email format check
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(googleEmail)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
      }
      user.googleEmail    = googleEmail.toLowerCase().trim();
      user.googleLinkedAt = new Date();
    }
    await user.save();
    return res.json({
      success:      true,
      googleEmail:  user.googleEmail,
      linkedAt:     user.googleLinkedAt,
      message:      user.googleEmail ? 'Google account linked' : 'Google account unlinked',
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/requests/:id/resend  [admin only]
// Re-generates invite token and re-sends approval email.
// Useful when email failed on first attempt or link expired.
// ─────────────────────────────────────────────────────────────────
async function resendInvite(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
    if (request.status !== 'approved') {
      return res.status(409).json({ success: false, error: 'Request is not in approved state' });
    }
    // Check if already activated
    const user = await User.findOne({ email: request.email });
    if (user) {
      return res.status(409).json({ success: false, error: 'User has already activated their account.' });
    }

    // Re-generate fresh 48h token
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    request.inviteToken  = hashedToken;
    request.inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    request.inviteUsed   = false;
    await request.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink  = `${frontendUrl}/invite?token=${rawToken}`;

    let emailResult = { sent: false, reason: 'no email on record' };
    if (request.email) {
      try {
        emailResult = await sendApprovalEmail({
          toEmail:    request.email,
          toName:     request.name,
          role:       request.role,
          inviteLink,
          approvedBy: req.user.username,
        });
      } catch (emailErr) {
        console.error('[Email] Resend invite failed:', emailErr.message);
        emailResult = { sent: false, reason: emailErr.message };
      }
    }

    return res.json({
      success:    true,
      message:    emailResult.sent
        ? `New invite email sent to ${request.email}`
        : 'Token refreshed — email not sent. Share the link manually.',
      inviteLink,
      expiresIn:  '48 hours',
      emailSent:  emailResult.sent,
      emailError: emailResult.sent ? undefined : emailResult.reason,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /auth/requests/:id  [admin only]
// Permanently removes an access request record.
// If the invite was never activated, also removes the pending User doc.
// ─────────────────────────────────────────────────────────────────
async function removeRequest(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

    // If invite was sent but account never activated, clean up the unverified User too
    if (request.email && !request.inviteUsed) {
      await User.deleteOne({ email: request.email, emailVerified: false });
    }

    await request.deleteOne();

    return res.json({
      success: true,
      message: `Request for ${request.name} (${request.email}) removed.`,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Step 1: find user by username or email, generate 6-digit OTP,
//         hash it, store in user doc, send to their email.
// ─────────────────────────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { identifier } = req.body; // username OR email
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Username or email is required' });
    }

    const id = identifier.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ username: id }, { email: id }],
      isActive: true,
    });

    // Always respond with the same message to prevent user enumeration
    const GENERIC_MSG = 'If that account exists and has an email linked, an OTP has been sent.';

    if (!user) return res.json({ success: true, message: GENERIC_MSG });

    if (!user.email) {
      // Account exists but has no email — send a 422 so frontend can show a specific message
      return res.status(422).json({
        success: false,
        code: 'NO_EMAIL',
        error: 'This account has no email address linked. Contact your administrator to reset your password.',
      });
    }

    // Generate 6-digit numeric OTP
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashed = await bcrypt.hash(otp, 10);

    user.otpCode     = hashed;
    user.otpExpiry   = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otpAttempts = 0;
    await user.save();

    await sendPasswordResetOtpEmail({
      toEmail:  user.email,
      toName:   user.name,
      otp,
      username: user.username,
    });

    // Return masked email so frontend can display it
    const [local, domain] = user.email.split('@');
    const maskedEmail = local.slice(0, 2) + '***@' + domain;

    return res.json({ success: true, message: GENERIC_MSG, maskedEmail, username: user.username });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/verify-reset-otp
// Step 2: verify the OTP (max 5 attempts), return a short-lived
//         resetToken (signed JWT, single-use, 5-min expiry).
// ─────────────────────────────────────────────────────────────────
async function verifyResetOtp(req, res, next) {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, error: 'Identifier and OTP are required' });
    }

    const id = identifier.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ username: id }, { email: id }],
      isActive: true,
    });

    if (!user || !user.otpCode) {
      return res.status(400).json({ success: false, error: 'OTP not found or already used. Please request a new one.' });
    }

    // Check expiry
    if (user.otpExpiry < new Date()) {
      user.otpCode = null; user.otpExpiry = null; user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempt limit
    if (user.otpAttempts >= 5) {
      user.otpCode = null; user.otpExpiry = null; user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const valid = await bcrypt.compare(String(otp).trim(), user.otpCode);
    if (!valid) {
      user.otpAttempts += 1;
      await user.save();
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({
        success: false,
        error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP correct — clear it and issue a short-lived reset token
    const resetToken = jwt.sign(
      { sub: user._id.toString(), purpose: 'password-reset' },
      process.env.JWT_SECRET || 'hs-secret',
      { expiresIn: '5m' }
    );

    user.otpCode      = null;
    user.otpExpiry    = null;
    user.otpAttempts  = 0;
    user.resetToken   = resetToken; // store so it can be invalidated after use
    user.resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return res.json({ success: true, resetToken });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /auth/reset-password
// Step 3: verify resetToken, update passwordHash, clear token.
// ─────────────────────────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET || 'hs-secret');
    } catch {
      return res.status(401).json({ success: false, error: 'Reset link has expired. Please start over.' });
    }

    if (payload.purpose !== 'password-reset') {
      return res.status(401).json({ success: false, error: 'Invalid reset token.' });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.resetToken !== resetToken) {
      return res.status(401).json({ success: false, error: 'Reset token already used or invalid. Please start over.' });
    }

    // Update password
    user.passwordHash    = await bcrypt.hash(newPassword, 12);
    user.resetToken      = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, requestAccess, listRequests, approve, reject, activate, verifyOtp, resendOtp, resendInvite, removeRequest, listUsers, toggleUserStatus, linkGoogle, forgotPassword, verifyResetOtp, resetPassword };

