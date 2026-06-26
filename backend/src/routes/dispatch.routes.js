const router = require('express').Router();
const { getFEFOQueue } = require('../controllers/dispatch.controller');
router.get('/fefo', getFEFOQueue);
module.exports = router;
