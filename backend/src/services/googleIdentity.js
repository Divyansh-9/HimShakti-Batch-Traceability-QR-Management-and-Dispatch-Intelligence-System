/**
 * googleIdentity.js — verify a Google access token, get the identity
 * ──────────────────────────────────────────────────────────────────
 * Single place that turns a token from the browser into a Google email
 * this server is willing to believe.
 *
 * It exists because the same verification is needed in two flows that
 * previously did not share it — signing in with Google, and linking a
 * Google account to an existing user. The link flow did not verify at
 * all: it took whatever email the client typed. See linkGoogle().
 */

/** Google's tokeninfo/userinfo endpoint for OAuth2 access tokens. */
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * Exchange a Google access token for the verified profile behind it.
 *
 * @param   {string} credential  access_token from @react-oauth/google
 * @returns {Promise<{ email: string, name: string|null, emailVerified: boolean }>}
 * @throws  {Error} with `.statusCode` set, safe to hand to next()
 */
async function verifyGoogleToken(credential) {
  if (!credential || typeof credential !== 'string') {
    const err = new Error('A Google credential is required.');
    err.statusCode = 400;
    throw err;
  }

  let profile;
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (!res.ok) throw new Error(`userinfo returned ${res.status}`);
    profile = await res.json();
  } catch {
    // Deliberately opaque: the caller supplied the token, and echoing
    // Google's response back tells an attacker how their probe landed.
    const err = new Error('Invalid Google token. Please try again.');
    err.statusCode = 401;
    throw err;
  }

  const email = profile.email?.toLowerCase().trim();
  if (!email) {
    const err = new Error('Could not read an email address from that Google account.');
    err.statusCode = 400;
    throw err;
  }

  // Google returns `email_verified: false` for some workspace and alias
  // cases. Linking one would let somebody claim an address they have not
  // proven they own — the exact hole this module exists to close.
  if (profile.email_verified === false) {
    const err = new Error('That Google account has an unverified email address and cannot be linked.');
    err.statusCode = 400;
    throw err;
  }

  return { email, name: profile.name || null, emailVerified: profile.email_verified !== false };
}

module.exports = { verifyGoogleToken };
