const router  = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  requireQIOrAbove,
  requireQualityInspector,
} = require('../middleware/requireAdmin');
const ctrl    = require('../controllers/inspection.controller');

// IMPORTANT: specific paths BEFORE parameterised paths to avoid route conflicts
router.get( '/my',             protect, requireQIOrAbove,          ctrl.myInspections);
router.get( '/batch/:batchId', protect, requireQIOrAbove,          ctrl.getByBatch);
router.get( '/',               protect, requireQIOrAbove,          ctrl.listInspections);
router.post('/',               protect, requireQualityInspector,   ctrl.createInspection);
router.get( '/:id',            protect, requireQIOrAbove,          ctrl.getById);

module.exports = router;
