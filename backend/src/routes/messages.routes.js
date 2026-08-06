const router      = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl        = require('../controllers/messages.controller');

// IMPORTANT: literal paths BEFORE /:id so Express does not parse them as ObjectIds
router.get( '/channels',                protect, ctrl.listChannels);
router.get( '/channel/:role',           protect, ctrl.getChannel);
router.post('/channel/:role',           protect, ctrl.postToChannel);

router.get( '/record/:refType/:refId',  protect, ctrl.getThread);
router.post('/record/:refType/:refId',  protect, ctrl.postToThread);

router.patch( '/:id', protect, ctrl.editMessage);
router.delete('/:id', protect, ctrl.deleteMessage);

module.exports = router;
