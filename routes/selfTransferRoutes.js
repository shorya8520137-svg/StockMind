const express = require('express');
const router = express.Router();
const selfTransferController = require('../controllers/selfTransferController');

/**
 * =====================================================
 * SELF TRANSFER ROUTES
 * =====================================================
 */

// Create new self transfer
router.post('/create', selfTransferController.createSelfTransfer);

// Get all self transfers with filters
router.get('/', selfTransferController.getSelfTransfers);

module.exports = router;