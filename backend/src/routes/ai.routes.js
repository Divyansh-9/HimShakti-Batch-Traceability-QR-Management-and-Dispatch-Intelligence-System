const router = require('express').Router();
const { runAudit } = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/rateLimiter');
const { protect }   = require('../middleware/auth');
router.post('/dispatch-audit', protect, aiLimiter, runAudit);
module.exports = router;
