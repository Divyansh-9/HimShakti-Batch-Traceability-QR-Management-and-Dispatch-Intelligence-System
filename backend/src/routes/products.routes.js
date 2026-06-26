const router = require('express').Router();
const { getProducts, getProductById } = require('../controllers/products.controller');
router.get('/',    getProducts);
router.get('/:id', getProductById);
module.exports = router;
