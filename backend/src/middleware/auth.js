/**
 * auth.js — bearer token verification
 * ──────────────────────────────────────────────────────────────────
 * `protect` used to verify the JWT's signature and nothing else, taking
 * every claim inside it at face value. A signed token is proof of who
 * logged in; it is not proof that they still *should* be logged in, and
 * three things went wrong because of that:
 *
 *   - A soft-deleted or deactivated user kept full access until their
 *     token expired. Removing someone from the system did not remove
 *     their access for up to eight hours.
 *   - A role change did not take effect until the user happened to log
 *     in again. Demoting an admin left them an admin.
 *   - A stolen token could not be revoked by anyone, including the user
 *     it was stolen from. Changing your password did not end the
 *     attacker's session.
 *
 * The token is now checked against the stored user on each request: the
 * account must still exist, still be active, and carry a matching
 * `tokenVersion`. Role and identity come from the database rather than
 * the token, so a change applies on the very next request.
 *
 * That costs one indexed lookup per authenticated request. It is worth
 * it — the alternative is an authorization system that is wrong for up
 * to eight hours after any change, with no way to shorten the window.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

/** Fields needed to authorize a request. Deliberately narrow — never
 *  widen this to a whole document, which would pull passwordHash and
 *  resetToken into req.user and from there into logs. */
const SESSION_FIELDS = 'username name email role isActive isDeleted isSuperAdmin tokenVersion';

/**
 * Super Admin is identified by a flag, but a hardcoded fallback exists
 * so tokens minted before the flag was introduced still resolve to
 * Tier 0 instead of silently losing access.
 */
function resolveSuperAdmin(user) {
  return Boolean(
    user.isSuperAdmin ||
    user.email?.toLowerCase()    === 'divyanshuniyal185@gmail.com' ||
    user.username?.toLowerCase() === 'divyansh'
  );
}

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  try {
    if (!decoded?._id) {
      // Pre-dates the `_id` claim and cannot be checked against a user.
      return res.status(401).json({ success: false, error: 'Session is no longer valid. Please log in again.' });
    }

    const user = await User.findById(decoded._id).select(SESSION_FIELDS).lean();

    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, error: 'Account no longer exists.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Contact an administrator.' });
    }

    // A token minted before this field existed carries no `tv`; read as
    // 0 so it still matches a user whose counter has never been bumped.
    const tokenVersion = decoded.tv ?? 0;
    if ((user.tokenVersion ?? 0) !== tokenVersion) {
      return res.status(401).json({ success: false, error: 'Session ended. Please log in again.' });
    }

    // Database wins over the token for everything authorization reads,
    // so a role change or promotion applies on the next request.
    req.user = {
      _id:          user._id,
      username:     user.username,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      isSuperAdmin: resolveSuperAdmin(user),
      tokenVersion: user.tokenVersion ?? 0,
    };

    return next();
  } catch (err) {
    // A database failure must not read as a valid session.
    return next(err);
  }
}

/**
 * Mint a session token.
 * `tv` pins the token to the user's current revocation counter.
 */
function generateToken(payload) {
  return jwt.sign({ tv: 0, ...payload }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Invalidate every existing session for a user.
 *
 * Called on password change, password reset, deactivation, deletion and
 * explicit "log out everywhere". Deliberately tolerant: never let a
 * revocation failure break the operation that triggered it, but do log
 * it, because a silent failure here means sessions that should be dead
 * are still alive.
 */
async function revokeSessions(userId, reason = 'unspecified') {
  try {
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
    console.log(`[auth] sessions revoked for ${userId} (${reason})`);
  } catch (err) {
    console.error(`[auth] FAILED to revoke sessions for ${userId} (${reason}):`, err.message);
  }
}

module.exports = { protect, generateToken, revokeSessions, SESSION_FIELDS };
