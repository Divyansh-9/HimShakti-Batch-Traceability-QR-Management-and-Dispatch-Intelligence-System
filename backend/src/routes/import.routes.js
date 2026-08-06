const router      = require('express').Router();
const { protect } = require('../middleware/auth');
const { requireImporter } = require('../middleware/requireAdmin');
const ctrl        = require('../controllers/import.controller');

// IMPORTANT: literal paths BEFORE /:id so Express does not parse them as ObjectIds
router.get( '/schema',       protect, requireImporter, ctrl.getImportSchema);
router.post('/map-headers',  protect, requireImporter, ctrl.mapHeaders);
router.post('/validate',     protect, requireImporter, ctrl.validateImport);
router.post('/commit',       protect, requireImporter, ctrl.commitImport);

router.get( '/',             protect, requireImporter, ctrl.listImports);
router.post('/:id/rollback', protect, requireImporter, ctrl.rollbackImport);
router.get( '/:id',          protect, requireImporter, ctrl.getImport);

module.exports = router;
