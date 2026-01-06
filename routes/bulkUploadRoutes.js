const express = require('express');
const router = express.Router();
const bulkUploadController = require('../controllers/bulkUploadController');

// POST /api/bulk-upload - Upload bulk inventory data (main endpoint)
router.post('/', bulkUploadController.bulkUpload);

// POST /api/bulk-upload/progress - Upload bulk inventory data with real-time progress
router.post('/progress', bulkUploadController.bulkUploadWithProgress);

// GET /api/bulk-upload/warehouses - Get available warehouses
router.get('/warehouses', bulkUploadController.getWarehouses);

// GET /api/bulk-upload/history - Get bulk upload history
router.get('/history', bulkUploadController.getBulkUploadHistory);

module.exports = router;