/**
 * RBAC middleware — the permission matrix
 * ──────────────────────────────────────────────────────────────────
 * Every guard here is a 403-or-not decision made from `req.user`. The
 * failure mode that matters is the permissive one: a role quietly
 * gaining a capability it should not have. That never throws and never
 * appears in a log — it just works, for the wrong person.
 *
 * So each guard is asserted in both directions: every role that must
 * pass, and every role that must be refused. The matrix in
 * docs/RBAC.md is the specification; this file is its executable form.
 */
const {
  requireAdmin,
  requireSuperAdmin,
  requireManagerOrAbove,
  requireQIOrAbove,
  requireQualityInspector,
  requireImporter,
  getTier,
} = require('../src/middleware/requireAdmin');

const ALL_ROLES = [
  'admin',
  'manager',
  'factory-manager',
  'quality-inspector',
  'dispatch-coordinator',
];

/** Run a guard and report whether it called next() or answered 403. */
function check(guard, user) {
  let passed = false;
  let status = null;
  const req = { user };
  const res = {
    status(code) { status = code; return this; },
    json() { return this; },
  };
  guard(req, res, () => { passed = true; });
  return { passed, status };
}

/** Assert exactly which roles get through a guard. */
function expectAllowed(guard, allowedRoles) {
  for (const role of ALL_ROLES) {
    const { passed, status } = check(guard, { role });
    const shouldPass = allowedRoles.includes(role);
    expect(
      passed,
      `${role} should ${shouldPass ? 'pass' : 'be refused'}`,
    ).toBe(shouldPass);
    if (!shouldPass) expect(status).toBe(403);
  }
}

describe('getTier', () => {
  it('maps the documented tiers', () => {
    expect(getTier('admin')).toBe(1);
    expect(getTier('manager')).toBe(2);
    expect(getTier('factory-manager')).toBe(3);
    expect(getTier('quality-inspector')).toBe(3);
    expect(getTier('dispatch-coordinator')).toBe(3);
  });

  it('returns tier 0 for a super admin regardless of role string', () => {
    expect(getTier('dispatch-coordinator', true)).toBe(0);
    expect(getTier(undefined, true)).toBe(0);
  });

  it('returns 99 for an unknown role rather than 0', () => {
    // The default must be the LEAST privileged value. Returning 0 or
    // undefined here would make an unrecognised role outrank everyone.
    expect(getTier('intern')).toBe(99);
    expect(getTier(undefined)).toBe(99);
    expect(getTier(null)).toBe(99);
  });
});

describe('guards refuse an unauthenticated request', () => {
  const guards = {
    requireAdmin,
    requireSuperAdmin,
    requireManagerOrAbove,
    requireQIOrAbove,
    requireQualityInspector,
    requireImporter,
  };

  for (const [name, guard] of Object.entries(guards)) {
    it(`${name} refuses a request with no user`, () => {
      expect(check(guard, undefined).passed).toBe(false);
      expect(check(guard, {}).passed).toBe(false);
    });
  }
});

describe('permission matrix', () => {
  it('requireAdmin — admin only', () => {
    expectAllowed(requireAdmin, ['admin']);
  });

  it('requireManagerOrAbove — admin and manager', () => {
    expectAllowed(requireManagerOrAbove, ['admin', 'manager']);
  });

  it('requireQualityInspector — quality-inspector and admin', () => {
    expectAllowed(requireQualityInspector, ['admin', 'quality-inspector']);
  });

  it('requireQIOrAbove — every operational role may read inspections', () => {
    expectAllowed(requireQIOrAbove, ALL_ROLES);
  });

  it('requireImporter — excludes quality-inspector and dispatch-coordinator', () => {
    // Both are Tier 3 like factory-manager, but neither creates batches,
    // and bulk import is a far bigger lever than the single-batch form
    // they already lack.
    expectAllowed(requireImporter, ['admin', 'manager', 'factory-manager']);
  });
});

describe('super admin', () => {
  it('passes every guard via the isSuperAdmin flag', () => {
    const su = { role: 'dispatch-coordinator', isSuperAdmin: true };
    for (const guard of [requireAdmin, requireSuperAdmin, requireManagerOrAbove,
      requireQIOrAbove, requireQualityInspector, requireImporter]) {
      expect(check(guard, su).passed).toBe(true);
    }
  });

  it('is recognised by the hardcoded email and username fallbacks', () => {
    // These exist so pre-existing JWTs, minted before the flag was added,
    // still resolve to Tier 0 instead of silently losing access.
    expect(check(requireSuperAdmin, { email: 'divyanshuniyal185@gmail.com' }).passed).toBe(true);
    expect(check(requireSuperAdmin, { email: 'DIVYANSHUNIYAL185@GMAIL.COM' }).passed).toBe(true);
    expect(check(requireSuperAdmin, { username: 'divyansh' }).passed).toBe(true);
    expect(check(requireSuperAdmin, { username: 'DIVYANSH' }).passed).toBe(true);
  });

  it('refuses a lookalike email or username', () => {
    expect(check(requireSuperAdmin, { email: 'divyanshuniyal185@gmail.com.attacker.test' }).passed).toBe(false);
    expect(check(requireSuperAdmin, { username: 'divyansh2' }).passed).toBe(false);
    expect(check(requireSuperAdmin, { role: 'admin' }).passed).toBe(false);
  });
});
