const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ProductController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
        }
    }
});

// All product routes require authentication
router.use(authMiddleware);

// Product CRUD operations
router.get('/', 
    permissionMiddleware('products.view'),
    ProductController.getAllProducts
);

router.get('/:identifier', 
    permissionMiddleware('products.view'),
    ProductController.getProduct
);

router.post('/', 
    permissionMiddleware('products.create'),
    ProductController.createProduct
);

router.put('/:id', 
    permissionMiddleware('products.edit'),
    ProductController.updateProduct
);

router.delete('/:id', 
    permissionMiddleware('products.delete'),
    ProductController.deleteProduct
);

// Bulk import
router.post('/bulk/import', 
    permissionMiddleware('products.bulk_import'),
    upload.single('file'),
    ProductController.bulkImport
);

// Download template
router.get('/bulk/template', 
    permissionMiddleware('products.view'),
    ProductController.downloadTemplate
);

// Category management
router.get('/categories/all', 
    permissionMiddleware('products.view'),
    ProductController.getCategories
);

router.post('/categories', 
    permissionMiddleware('products.categories'),
    ProductController.createCategory
);

module.exports = router;