const router      = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl        = require('../controllers/notifications.controller');

router.get(   '/',            protect, ctrl.getNotifications);
router.get(   '/unread',      protect, ctrl.getUnreadCount);
router.patch( '/:id/read',   protect, ctrl.markOneRead);
router.patch( '/read-all',   protect, ctrl.markAllRead);
router.delete('/clear',      protect, ctrl.clearRead);

module.exports = router;
