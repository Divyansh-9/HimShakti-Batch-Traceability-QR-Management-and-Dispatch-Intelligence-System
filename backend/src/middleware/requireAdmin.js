/**
 * RBAC Middleware — Tiered access control
 *
 * Role tier hierarchy (highest → lowest):
 *   Tier 0: super-admin  (isSuperAdmin: true flag, identified by flag not role string)
 *   Tier 1: admin
 *   Tier 2: manager
 *   Tier 3: factory-manager | quality-inspector | dispatch-coordinator
 *
 * Usage:
 *   router.patch('/users/:id/role', protect, requireAdminOrAbove, ctrl.changeRole);
 *   router.delete('/users/:id',     protect, requireAdminOrAbove, ctrl.deleteUser);
 *   router.get('/super/deleted',    protect, requireSuperAdmin,   ctrl.listDeletedUsers);
 */

const ROLE_TIER = {
  'factory-manager':      3,
  'quality-inspector':    3,
  'dispatch-coordinator': 3,
  'manager':              2,
  'admin':                1,
  // super-admin is tier 0 — identified by isSuperAdmin flag, not this map
};

/**
 * requireAdmin — allows only admin (Tier 1) and super-admin (Tier 0).
 * Must be used after protect().
 */
function requireAdmin(req, res, next) {
  const { role, isSuperAdmin } = req.user || {};
  if (isSuperAdmin || role === 'admin') return next();
  return res.status(403).json({ success: false, error: 'Admin access required' });
}

/**
 * requireAdminOrAbove — alias for requireAdmin (admin + super-admin).
 * Kept separate for semantic clarity at route level.
 */
function requireAdminOrAbove(req, res, next) {
  return requireAdmin(req, res, next);
}

/**
 * requireSuperAdmin — allows ONLY the Super Admin (isSuperAdmin: true).
 * Used for: hard-delete, restoring deleted users, promoting to admin.
 */
function requireSuperAdmin(req, res, next) {
  if (req.user?.isSuperAdmin) return next();
  return res.status(403).json({
    success: false,
    error:   'Super Admin access required. This action is restricted to the primary system owner.',
  });
}

/**
 * requireManagerOrAbove — allows manager, admin, and super-admin.
 * Managers get read-only Admin Panel view.
 */
function requireManagerOrAbove(req, res, next) {
  const { role, isSuperAdmin } = req.user || {};
  if (isSuperAdmin || role === 'admin' || role === 'manager') return next();
  return res.status(403).json({ success: false, error: 'Manager-level access required' });
}

/**
 * getTier — returns the numeric tier for a role string.
 * isSuperAdmin users are always tier 0 regardless of their role string.
 */
function getTier(role, isSuperAdmin = false) {
  if (isSuperAdmin) return 0;
  return ROLE_TIER[role] ?? 99;
}

module.exports = { requireAdmin, requireAdminOrAbove, requireSuperAdmin, requireManagerOrAbove, getTier };
