const router       = require('express').Router();
const { protect }  = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const ctrl         = require('../controllers/auth.controller');

// Public
router.post('/login',          ctrl.login);
router.post('/request-access', ctrl.requestAccess);
router.post('/activate',       ctrl.activate);

// Admin only
router.get( '/requests',             protect, requireAdmin, ctrl.listRequests);
router.post('/requests/:id/approve', protect, requireAdmin, ctrl.approve);
router.post('/requests/:id/reject',  protect, requireAdmin, ctrl.reject);

module.exports = router;
