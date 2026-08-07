const router       = require('express').Router();
const { protect }  = require('../middleware/auth');
const {
  requireAdmin,
  requireAdminOrAbove,
  requireSuperAdmin,
  requireManagerOrAbove,
} = require('../middleware/requireAdmin');
const ctrl         = require('../controllers/auth.controller');
const { googleLogin } = require('../controllers/googleAuth.controller');

// Public
router.post('/login',               ctrl.login);
router.post('/request-access',      ctrl.requestAccess);
router.post('/activate',            ctrl.activate);
router.post('/verify-otp',          ctrl.verifyOtp);
router.post('/verify-otp/resend',   ctrl.resendOtp);
router.post('/google/token',        googleLogin);

// Forgot password (public — 3-step OTP flow)
router.post('/forgot-password',     ctrl.forgotPassword);
router.post('/verify-reset-otp',    ctrl.verifyResetOtp);
router.post('/reset-password',      ctrl.resetPassword);

// ── Admin & Super Admin routes ─────────────────────────────────────────────
// Access Requests
router.get( '/requests',              protect, requireManagerOrAbove, ctrl.listRequests);  // manager gets read-only view
router.post('/requests/:id/approve',  protect, requireAdminOrAbove, ctrl.approve);
router.post('/requests/:id/reject',   protect, requireAdminOrAbove, ctrl.reject);
router.post('/requests/:id/resend',   protect, requireAdminOrAbove, ctrl.resendInvite);
router.delete('/requests/:id',        protect, requireAdminOrAbove, ctrl.removeRequest);

// Users — note: /users/deleted MUST come before /users/:id
// Team directory — declared before /users/:id-style routes for the same reason
// the others are: Express must not read the literal as an ObjectId.
router.get( '/directory',             protect, requireManagerOrAbove, ctrl.getDirectory);
router.get( '/users',                 protect, requireManagerOrAbove, ctrl.listUsers);     // manager gets read-only
router.get( '/users/deleted',         protect, requireSuperAdmin,     ctrl.listDeletedUsers); // Recycle Bin
router.patch('/users/:id/toggle',     protect, requireAdminOrAbove,   ctrl.toggleUserStatus);
router.patch('/users/:id/role',       protect, requireAdminOrAbove,   ctrl.changeRole);
router.patch('/users/:id/restore',    protect, requireSuperAdmin,     ctrl.restoreUser);
router.delete('/users/:id',           protect, requireAdminOrAbove,   ctrl.deleteUser);

// Any authenticated user — link/unlink Google account email
// Linking proves ownership via a real Google credential, verified
// server-side. PATCH is the deprecated shape — it only unlinks now; see
// legacyGoogleLink().
router.post(  '/me/google-link', protect, ctrl.linkGoogle);
router.delete('/me/google-link', protect, ctrl.unlinkGoogle);
router.patch( '/me/google-link', protect, ctrl.legacyGoogleLink);

// ── Self-service — any authenticated user ──────────────────────────
router.get(  '/me',                 protect, ctrl.getMe);
router.patch('/me',                 protect, ctrl.updateProfile);
router.patch('/me/settings',        protect, ctrl.updateSettings);
router.post( '/me/change-password', protect, ctrl.changePassword);
// Ends every session for the calling account, including the current one.
// Pairs with /me/login-history: a user who spots a login they do not
// recognise could previously see it and do nothing about it.
router.post( '/me/logout-all',      protect, ctrl.logoutAll);
router.get(  '/me/login-history',   protect, ctrl.getLoginHistory);

module.exports = router;




