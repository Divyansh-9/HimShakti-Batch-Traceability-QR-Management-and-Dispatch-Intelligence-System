/**
 * googleAuth.controller.js
 *
 * POST /auth/google/token
 * Receives a Google access_token (from @react-oauth/google implicit flow),
 * verifies it by calling Google's userinfo endpoint, finds the matching
 * HimShakti user (by googleEmail field), and issues a JWT.
 *
 * Requires:
 *   GOOGLE_CLIENT_ID in backend/.env  (same Client ID used in the frontend)
 */

'use strict';
const User             = require('../models/User.model');
const { generateToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────
// POST /auth/google/token  [public]
// Body: { credential: "<Google access_token>" }
// ─────────────────────────────────────────────────────────────────
async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Google credential is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        error:   'Google Sign-In is not configured on this server. Contact your administrator.',
      });
    }

    // ── 1. Verify the access token via Google's userinfo endpoint ─
    let googleProfile;
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${credential}` } }
      );
      if (!response.ok) {
        throw new Error(`Google userinfo returned ${response.status}`);
      }
      googleProfile = await response.json();
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        error:   'Invalid Google token. Please try signing in again.',
      });
    }

    const googleEmail = googleProfile.email?.toLowerCase().trim();
    const googleName  = googleProfile.name;

    if (!googleEmail) {
      return res.status(400).json({ success: false, error: 'Could not extract email from Google account' });
    }

    // ── 2. Find the HimShakti user linked to this Google email ────
    const user = await User.findOne({ googleEmail, isActive: true });

    if (!user) {
      const inactiveUser = await User.findOne({ googleEmail, isActive: false });
      if (inactiveUser) {
        return res.status(403).json({
          success: false,
          code:    'ACCOUNT_DISABLED',
          error:   'Your HimShakti account has been disabled. Contact your administrator.',
        });
      }

      return res.status(403).json({
        success: false,
        code:    'NOT_LINKED',
        googleName,
        googleEmail,
        error:   `No HimShakti account is linked to ${googleEmail}. Sign in with your credentials first, then link your Google account from the dashboard.`,
      });
    }

    // ── 3. Issue JWT ───────────────────────────────────────────────
    const token = generateToken({ username: user.username, role: user.role });

    return res.json({
      success: true,
      token,
      user: {
        username: user.username,
        name:     user.name,
        email:    user.email,
        role:     user.role,
      },
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { googleLogin };
