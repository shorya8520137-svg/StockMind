const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Product CRUD
router.get('/', ProductController.getAllProducts);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Barcode Search
router.get('/search/:barcode', ProductController.searchByBarcode);

// Inventory Management
router.get('/inventory', ProductController.getInventory);
router.get('/inventory/by-warehouse/:warehouse', ProductController.getInventoryByWarehouse);
router.get('/inventory/export', ProductController.exportInventory);
router.post('/transfer', ProductController.transferProduct);
router.post('/bulk/transfer', ProductController.bulkTransferProducts);
router.get('/inventory/:barcode', ProductController.getProductInventory);

// Bulk Import
router.post('/bulk/import', upload.single('file'), ProductController.bulkImport);
router.post('/bulk/import/progress', upload.single('file'), ProductController.bulkImportWithProgress);

// Categories
router.get('/categories/all', ProductController.getCategories);
router.post('/categories', ProductController.createCategory);

// Locations
router.get('/warehouses', ProductController.getWarehouses);
router.get('/stores', ProductController.getStores);

module.exports = router;
