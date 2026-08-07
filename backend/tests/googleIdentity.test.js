/**
 * googleIdentity — the verification that was missing
 * ──────────────────────────────────────────────────────────────────
 * Account linking previously trusted whatever email the client sent.
 * Because googleAuth.controller resolves logins by matching
 * `googleEmail`, that let one user claim another person's address: the
 * victim clicks "Sign in with Google", Google authenticates them
 * correctly, and the server hands them the attacker's account.
 *
 * Every test here guards a way that hole could reopen.
 */
const { verifyGoogleToken } = require('../src/services/googleIdentity');

let originalFetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

/** Stub Google's userinfo response. */
function googleReturns(profile, ok = true) {
  global.fetch = async () => ({ ok, status: ok ? 200 : 401, json: async () => profile });
}

describe('rejects anything unproven', () => {
  it('refuses a missing credential', async () => {
    await expect(verifyGoogleToken(undefined)).rejects.toThrow(/credential is required/i);
  });

  it('refuses a non-string credential', async () => {
    // An object here would sail into the Authorization header as
    // "[object Object]" and produce a confusing 401 from Google.
    await expect(verifyGoogleToken({ email: 'attacker@example.test' })).rejects.toThrow(/credential is required/i);
  });

  it('refuses when Google rejects the token', async () => {
    googleReturns({}, false);
    await expect(verifyGoogleToken('bad-token')).rejects.toThrow(/invalid google token/i);
  });

  it('refuses when the network call fails', async () => {
    global.fetch = async () => { throw new Error('ECONNREFUSED'); };
    await expect(verifyGoogleToken('t')).rejects.toThrow(/invalid google token/i);
  });

  it('refuses a profile with no email', async () => {
    googleReturns({ name: 'No Email' });
    await expect(verifyGoogleToken('t')).rejects.toThrow(/could not read an email/i);
  });

  it('refuses an unverified Google email', async () => {
    // Linking an address Google itself has not verified would defeat the
    // entire point of verifying.
    googleReturns({ email: 'unverified@example.test', email_verified: false });
    await expect(verifyGoogleToken('t')).rejects.toThrow(/unverified/i);
  });
});

describe('accepts a verified identity', () => {
  it('returns the normalised email and name', async () => {
    googleReturns({ email: '  Ramesh@Example.TEST ', name: 'Ramesh', email_verified: true });
    const r = await verifyGoogleToken('t');
    expect(r.email).toBe('ramesh@example.test');
    expect(r.name).toBe('Ramesh');
  });

  it('takes the email from Google, never from the caller', async () => {
    // The credential string is attacker-controlled; the email must come
    // only from the verified response.
    googleReturns({ email: 'real@example.test', email_verified: true });
    const r = await verifyGoogleToken('victim@example.test');
    expect(r.email).toBe('real@example.test');
  });

  it('treats a missing email_verified as verified', async () => {
    // Google omits the field for plain consumer accounts. Refusing those
    // would break the common case; only an explicit false is a refusal.
    googleReturns({ email: 'a@example.test' });
    await expect(verifyGoogleToken('t')).resolves.toMatchObject({ email: 'a@example.test' });
  });

  it('sends the credential as a bearer token to Google', async () => {
    let seen = null;
    global.fetch = async (url, init) => {
      seen = { url, auth: init.headers.Authorization };
      return { ok: true, json: async () => ({ email: 'a@example.test' }) };
    };
    await verifyGoogleToken('tok-123');
    expect(seen.url).toContain('googleapis.com');
    expect(seen.auth).toBe('Bearer tok-123');
  });
});

describe('error shape', () => {
  it('carries a statusCode the controller can return directly', async () => {
    googleReturns({}, false);
    await expect(verifyGoogleToken('t')).rejects.toMatchObject({ statusCode: 401 });

    googleReturns({ name: 'x' });
    await expect(verifyGoogleToken('t')).rejects.toMatchObject({ statusCode: 400 });
  });
});
