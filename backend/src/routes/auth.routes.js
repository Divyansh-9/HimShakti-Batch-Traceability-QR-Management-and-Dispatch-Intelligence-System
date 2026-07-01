const router       = require('express').Router();
const { protect }  = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const ctrl         = require('../controllers/auth.controller');
const { googleLogin } = require('../controllers/googleAuth.controller');

// Public
router.post('/login',          ctrl.login);
router.post('/request-access', ctrl.requestAccess);
router.post('/activate',       ctrl.activate);
router.post('/google/token',   googleLogin);   // Real Google OAuth token verification

// Admin only
router.get( '/requests',              protect, requireAdmin, ctrl.listRequests);
router.post('/requests/:id/approve',  protect, requireAdmin, ctrl.approve);
router.post('/requests/:id/reject',   protect, requireAdmin, ctrl.reject);
router.get( '/users',                 protect, requireAdmin, ctrl.listUsers);
router.patch('/users/:id/toggle',     protect, requireAdmin, ctrl.toggleUserStatus);

// Any authenticated user — link/unlink Google account email
router.patch('/me/google-link', protect, ctrl.linkGoogle);

module.exports = router;


