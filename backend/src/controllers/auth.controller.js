const crypto        = require('crypto');
const bcrypt        = require('bcryptjs');
const User          = require('../models/User.model');
const AccessRequest = require('../models/AccessRequest.model');
const { generateToken } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

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

    await User.create({
      username,
      passwordHash: await bcrypt.hash(password, 12),
      name:         request.name,
      email:        request.email,
      role:         request.role,
    });

    // Invalidate the invite token — one use only
    request.inviteUsed  = true;
    request.inviteToken = undefined;
    await request.save();

    return res.json({
      success:  true,
      message:  'Account activated successfully',
      username,
    });
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

module.exports = { login, requestAccess, listRequests, approve, reject, activate, listUsers, toggleUserStatus, linkGoogle };

