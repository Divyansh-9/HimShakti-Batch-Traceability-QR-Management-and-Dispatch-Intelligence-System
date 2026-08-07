/**
 * protect — session revocation
 * ──────────────────────────────────────────────────────────────────
 * `protect` used to verify a signature and trust every claim inside the
 * token. These tests pin the three failures that came from that, each
 * of which was silent and each of which lasted up to eight hours:
 *
 *   - a deleted or deactivated user kept working access;
 *   - a role change did not apply until the user re-logged in;
 *   - nobody, including the victim, could revoke a stolen token.
 *
 * The User model is stubbed rather than hitting Mongo: the behaviour
 * under test is the decision logic, and a test that needs a database
 * is one that stops being run.
 */
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = 'test-jwt-secret';
const USER_ID = '507f1f77bcf86cd799439011';

const userModulePath = require.resolve('../src/models/User.model');

/** Install a fake User model whose findById resolves to `record`. */
function stubUser(record) {
  require.cache[userModulePath] = {
    id: userModulePath,
    filename: userModulePath,
    loaded: true,
    exports: {
      findById: () => ({
        select: () => ({ lean: async () => record }),
      }),
    },
  };
  delete require.cache[require.resolve('../src/middleware/auth')];
  return require('../src/middleware/auth');
}

/** Run protect and capture what it decided. */
async function run(auth, token) {
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  let status = null;
  let body = null;
  let passed = false;
  let errored = null;
  const res = {
    status(c) { status = c; return this; },
    json(b) { body = b; return this; },
  };
  await auth.protect(req, res, (err) => { if (err) errored = err; else passed = true; });
  return { passed, status, error: body?.error, user: req.user, errored };
}

const ACTIVE_USER = {
  _id: USER_ID,
  username: 'ramesh',
  name: 'Ramesh Singh',
  email: 'ramesh@example.test',
  role: 'factory-manager',
  isActive: true,
  isDeleted: false,
  isSuperAdmin: false,
  tokenVersion: 0,
};

let savedSecret;
beforeEach(() => {
  savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SECRET;
});
afterEach(() => {
  if (savedSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = savedSecret;
  delete require.cache[userModulePath];
  delete require.cache[require.resolve('../src/middleware/auth')];
});

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

describe('rejects malformed credentials', () => {
  it('refuses a request with no Authorization header', async () => {
    const auth = stubUser(ACTIVE_USER);
    expect((await run(auth, null)).status).toBe(401);
  });

  it('refuses a token signed with the wrong key', async () => {
    const auth = stubUser(ACTIVE_USER);
    const forged = jwt.sign({ _id: USER_ID, tv: 0 }, 'not-the-secret');
    expect((await run(auth, forged)).status).toBe(401);
  });

  it('refuses an expired token', async () => {
    const auth = stubUser(ACTIVE_USER);
    const expired = jwt.sign({ _id: USER_ID, tv: 0 }, SECRET, { expiresIn: '-1s' });
    expect((await run(auth, expired)).status).toBe(401);
  });

  it('refuses a well-signed token that carries no user id', async () => {
    const auth = stubUser(ACTIVE_USER);
    expect((await run(auth, sign({ username: 'ramesh' }))).status).toBe(401);
  });
});

describe('account state is checked on every request', () => {
  it('allows an active user', async () => {
    const auth = stubUser(ACTIVE_USER);
    const r = await run(auth, sign({ _id: USER_ID, tv: 0 }));
    expect(r.passed).toBe(true);
    expect(r.user.username).toBe('ramesh');
  });

  it('refuses a user who no longer exists', async () => {
    const auth = stubUser(null);
    expect((await run(auth, sign({ _id: USER_ID, tv: 0 }))).status).toBe(401);
  });

  it('refuses a soft-deleted user holding a still-valid token', async () => {
    // The whole point of soft delete: removing someone must remove their
    // access now, not up to eight hours later.
    const auth = stubUser({ ...ACTIVE_USER, isDeleted: true });
    expect((await run(auth, sign({ _id: USER_ID, tv: 0 }))).status).toBe(401);
  });

  it('refuses a deactivated user with 403, distinct from an invalid token', async () => {
    const auth = stubUser({ ...ACTIVE_USER, isActive: false });
    const r = await run(auth, sign({ _id: USER_ID, tv: 0 }));
    expect(r.status).toBe(403);
    expect(r.error).toMatch(/deactivated/i);
  });
});

describe('tokenVersion revocation', () => {
  it('refuses a token whose version is behind the account', async () => {
    // Password changed, or "log out everywhere" pressed, since issue.
    const auth = stubUser({ ...ACTIVE_USER, tokenVersion: 3 });
    const r = await run(auth, sign({ _id: USER_ID, tv: 2 }));
    expect(r.status).toBe(401);
    expect(r.error).toMatch(/session ended/i);
  });

  it('accepts a token whose version matches', async () => {
    const auth = stubUser({ ...ACTIVE_USER, tokenVersion: 3 });
    expect((await run(auth, sign({ _id: USER_ID, tv: 3 }))).passed).toBe(true);
  });

  it('treats a legacy token with no version as version 0', async () => {
    // Tokens minted before this field existed must keep working, or
    // deploying the fix logs out every user at once.
    const auth = stubUser({ ...ACTIVE_USER, tokenVersion: 0 });
    expect((await run(auth, sign({ _id: USER_ID }))).passed).toBe(true);
  });

  it('revokes legacy tokens once the account version is bumped', async () => {
    const auth = stubUser({ ...ACTIVE_USER, tokenVersion: 1 });
    expect((await run(auth, sign({ _id: USER_ID }))).status).toBe(401);
  });
});

describe('the database is authoritative, not the token', () => {
  it('uses the stored role, so a demotion applies on the next request', async () => {
    const auth = stubUser({ ...ACTIVE_USER, role: 'factory-manager' });
    // Token still claims admin from before the demotion.
    const r = await run(auth, sign({ _id: USER_ID, tv: 0, role: 'admin' }));
    expect(r.user.role).toBe('factory-manager');
  });

  it('does not grant super admin just because the token claims it', async () => {
    const auth = stubUser({ ...ACTIVE_USER, isSuperAdmin: false });
    const r = await run(auth, sign({ _id: USER_ID, tv: 0, isSuperAdmin: true }));
    expect(r.user.isSuperAdmin).toBe(false);
  });

  it('still recognises super admin from the stored flag', async () => {
    const auth = stubUser({ ...ACTIVE_USER, isSuperAdmin: true });
    const r = await run(auth, sign({ _id: USER_ID, tv: 0 }));
    expect(r.user.isSuperAdmin).toBe(true);
  });

  it('honours the hardcoded super admin fallback for pre-flag accounts', async () => {
    const auth = stubUser({ ...ACTIVE_USER, isSuperAdmin: false, username: 'divyansh' });
    expect((await run(auth, sign({ _id: USER_ID, tv: 0 }))).user.isSuperAdmin).toBe(true);
  });

  it('never exposes passwordHash or resetToken on req.user', async () => {
    const auth = stubUser({ ...ACTIVE_USER, passwordHash: 'x', resetToken: 'y' });
    const r = await run(auth, sign({ _id: USER_ID, tv: 0 }));
    expect(r.user.passwordHash).toBeUndefined();
    expect(r.user.resetToken).toBeUndefined();
  });
});

describe('database failure', () => {
  it('passes the error on rather than treating the request as authenticated', async () => {
    require.cache[userModulePath] = {
      id: userModulePath,
      filename: userModulePath,
      loaded: true,
      exports: { findById: () => ({ select: () => ({ lean: async () => { throw new Error('db down'); } }) }) },
    };
    delete require.cache[require.resolve('../src/middleware/auth')];
    const auth = require('../src/middleware/auth');

    const r = await run(auth, sign({ _id: USER_ID, tv: 0 }));
    expect(r.passed).toBe(false);
    expect(r.errored).toBeInstanceOf(Error);
  });
});

describe('generateToken', () => {
  it('defaults tv to 0 when a caller forgets to pass it', async () => {
    const auth = stubUser(ACTIVE_USER);
    const decoded = jwt.verify(auth.generateToken({ _id: USER_ID }), SECRET);
    expect(decoded.tv).toBe(0);
  });

  it('lets an explicit tv override the default', async () => {
    const auth = stubUser(ACTIVE_USER);
    const decoded = jwt.verify(auth.generateToken({ _id: USER_ID, tv: 5 }), SECRET);
    expect(decoded.tv).toBe(5);
  });
});
