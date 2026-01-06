const express = require('express');
const router = express.Router();
const damageRecoveryController = require('../controllers/damageRecoveryController');

// POST /api/damage-recovery/damage - Report damage
router.post('/damage', damageRecoveryController.reportDamage);

// POST /api/damage-recovery/recover - Recover stock
router.post('/recover', damageRecoveryController.recoverStock);

// GET /api/damage-recovery/log - Get damage & recovery log
router.get('/log', damageRecoveryController.getDamageRecoveryLog);

// GET /api/damage-recovery/warehouses - Get warehouses (use dispatch controller)
router.get('/warehouses', (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.getWarehouses(req, res);
});

// GET /api/damage-recovery/search-products - Search products (use dispatch controller)
router.get('/search-products', (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.searchProducts(req, res);
});

// GET /api/damage-recovery/summary - Get damage/recovery summary by warehouse
router.get('/summary', damageRecoveryController.getDamageRecoverySummary);

module.exports = router;