const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');

// POST /api/returns - Create new return
router.post('/', returnsController.createReturn);

// GET /api/returns - Get all returns with filters
// Example: /api/returns?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&page=1&limit=50
router.get('/', returnsController.getReturns);

// GET /api/returns/warehouses - Use dispatch warehouses endpoint
router.get('/warehouses', (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.getWarehouses(req, res);
});

// GET /api/returns/search-products - Use dispatch search endpoint
router.get('/search-products', (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.searchProducts(req, res);
});

// GET /api/returns/:id - Get return by ID
router.get('/:id', returnsController.getReturnById);

// POST /api/returns/bulk - Process bulk returns
router.post('/bulk', returnsController.processBulkReturns);

// GET /api/returns/suggestions/products - Get product suggestions for returns
// Example: /api/returns/suggestions/products?search=samsung
router.get('/suggestions/products', returnsController.getProductSuggestions);

// GET /api/returns/suggestions/warehouses - Get warehouse suggestions
router.get('/suggestions/warehouses', returnsController.getWarehouses);

module.exports = router;