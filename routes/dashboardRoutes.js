const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * =====================================================
 * DASHBOARD ROUTES
 * All endpoints for dashboard analytics and KPIs
 * =====================================================
 */

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Get key performance indicators (KPIs)
 * @query   warehouse, dateFrom, dateTo
 * @access  Public (add auth middleware if needed)
 */
router.get('/kpis', dashboardController.getKPIs);

/**
 * @route   GET /api/dashboard/revenue-cost
 * @desc    Get revenue vs cost chart data
 * @query   warehouse, days
 * @access  Public
 */
router.get('/revenue-cost', dashboardController.getRevenueCost);

/**
 * @route   GET /api/dashboard/warehouse-volume
 * @desc    Get warehouse volume data for bar chart
 * @query   dateFrom, dateTo
 * @access  Public
 */
router.get('/warehouse-volume', dashboardController.getWarehouseVolume);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity feed
 * @query   limit
 * @access  Public
 */
router.get('/activity', dashboardController.getActivity);

/**
 * @route   GET /api/dashboard/dispatch-heatmap
 * @desc    Get dispatch heatmap data for activity visualization
 * @query   range (week, last, month)
 * @access  Public
 */
router.get('/dispatch-heatmap', dashboardController.getDispatchHeatmap);

/**
 * @route   GET /api/dashboard/inventory-summary
 * @desc    Get inventory summary statistics
 * @query   warehouse
 * @access  Public
 */
router.get('/inventory-summary', dashboardController.getInventorySummary);

module.exports = router;