const router       = require('express').Router();
const { protect }  = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const ctrl         = require('../controllers/auth.controller');
const { googleLogin } = require('../controllers/googleAuth.controller');

// Public
router.post('/login',               ctrl.login);
router.post('/request-access',      ctrl.requestAccess);
router.post('/activate',            ctrl.activate);
router.post('/verify-otp',          ctrl.verifyOtp);          // NEW: verify email OTP
router.post('/verify-otp/resend',   ctrl.resendOtp);          // NEW: resend OTP
router.post('/google/token',        googleLogin);

// Forgot password (public — 3-step OTP flow)
router.post('/forgot-password',     ctrl.forgotPassword);
router.post('/verify-reset-otp',    ctrl.verifyResetOtp);
router.post('/reset-password',      ctrl.resetPassword);

// Admin only
router.get( '/requests',              protect, requireAdmin, ctrl.listRequests);
router.post('/requests/:id/approve',  protect, requireAdmin, ctrl.approve);
router.post('/requests/:id/reject',   protect, requireAdmin, ctrl.reject);
router.post('/requests/:id/resend',   protect, requireAdmin, ctrl.resendInvite);
router.delete('/requests/:id',        protect, requireAdmin, ctrl.removeRequest); // DELETE request record
router.get( '/users',                 protect, requireAdmin, ctrl.listUsers);
router.patch('/users/:id/toggle',     protect, requireAdmin, ctrl.toggleUserStatus);

// Any authenticated user — link/unlink Google account email
router.patch('/me/google-link', protect, ctrl.linkGoogle);

module.exports = router;



