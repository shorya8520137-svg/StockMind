const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');

/**
 * TIMELINE ROUTES
 * Handles product timeline and inventory movement tracking
 */

// GET /api/timeline/:productCode - Get timeline for specific product
// Example: /api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&dateTo=2025-01-31&limit=50
router.get('/:productCode', timelineController.getProductTimeline);

// GET /api/timeline - Get timeline summary (grouped by product or warehouse)
// Example: /api/timeline?warehouse=BLR_WH&groupBy=product&dateFrom=2025-01-01
router.get('/', timelineController.getTimelineSummary);

module.exports = router;