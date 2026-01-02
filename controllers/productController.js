const db = require('../db/connection');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');

class ProductController {
    // Get all products with pagination and search
    static async getAllProducts(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                search = '', 
                category = '', 
                sortBy = 'product_name',
                sortOrder = 'ASC' 
            } = req.query;

            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (search) {
                whereClause += ' AND (p.product_name LIKE ? OR p.barcode LIKE ? OR p.product_variant LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (category) {
                whereClause += ' AND c.name = ?';
                params.push(category);
            }

            const query = `
                SELECT 
                    p.p_id,
                    p.product_name,
                    p.product_variant,
                    p.barcode,
                    p.description,
                    p.price,
                    p.cost_price,
                    p.weight,
                    p.dimensions,
                    p.is_active,
                    p.created_at,
                    p.updated_at,
                    c.name as category_name,
                    c.display_name as category_display_name
                FROM dispatch_product p
                LEFT JOIN product_categories c ON p.category_id = c.id
                ${whereClause}
                ORDER BY p.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `;

            params.push(parseInt(limit), parseInt(offset));
            const [products] = await db.execute(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM dispatch_product p
                LEFT JOIN product_categories c ON p.category_id = c.id
                ${whereClause}
            `;
            const [countResult] = await db.execute(countQuery, params.slice(0, -2));
            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get single product by ID or barcode
    static async getProduct(req, res) {
        try {
            const { identifier } = req.params;
            const isNumeric = /^\d+$/.test(identifier);
            
            const query = `
                SELECT 
                    p.*,
                    c.name as category_name,
                    c.display_name as category_display_name
                FROM dispatch_product p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE ${isNumeric ? 'p.p_id = ?' : 'p.barcode = ?'}
            `;

            const [products] = await db.execute(query, [identifier]);

            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: products[0]
            });

        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Create single product
    static async createProduct(req, res) {
        try {
            const {
                product_name,
                product_variant,
                barcode,
                description,
                category_id,
                price,
                cost_price,
                weight,
                dimensions
            } = req.body;

            if (!product_name || !barcode) {
                return res.status(400).json({
                    success: false,
                    message: 'Product name and barcode are required'
                });
            }

            // Check if barcode already exists
            const [existing] = await db.execute(
                'SELECT p_id FROM dispatch_product WHERE barcode = ?',
                [barcode]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this barcode already exists'
                });
            }

            const [result] = await db.execute(`
                INSERT INTO dispatch_product (
                    product_name, product_variant, barcode, description,
                    category_id, price, cost_price, weight, dimensions,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                product_name, product_variant, barcode, description,
                category_id, price, cost_price, weight, dimensions
            ]);

            // Log activity
            await db.execute(`
                INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
                VALUES (?, 'CREATE', 'PRODUCTS', ?, ?, ?, ?)
            `, [
                req.user.userId,
                result.insertId,
                JSON.stringify({ product_name, barcode, category_id }),
                req.ip,
                req.get('User-Agent')
            ]);

            res.json({
                success: true,
                message: 'Product created successfully',
                data: {
                    p_id: result.insertId,
                    product_name,
                    barcode
                }
            });

        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update product
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const {
                product_name,
                product_variant,
                barcode,
                description,
                category_id,
                price,
                cost_price,
                weight,
                dimensions,
                is_active
            } = req.body;

            // Check if product exists
            const [existing] = await db.execute(
                'SELECT * FROM dispatch_product WHERE p_id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if barcode is being changed and if new barcode exists
            if (barcode && barcode !== existing[0].barcode) {
                const [barcodeCheck] = await db.execute(
                    'SELECT p_id FROM dispatch_product WHERE barcode = ? AND p_id != ?',
                    [barcode, id]
                );

                if (barcodeCheck.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product with this barcode already exists'
                    });
                }
            }

            await db.execute(`
                UPDATE dispatch_product SET
                    product_name = COALESCE(?, product_name),
                    product_variant = COALESCE(?, product_variant),
                    barcode = COALESCE(?, barcode),
                    description = COALESCE(?, description),
                    category_id = COALESCE(?, category_id),
                    price = COALESCE(?, price),
                    cost_price = COALESCE(?, cost_price),
                    weight = COALESCE(?, weight),
                    dimensions = COALESCE(?, dimensions),
                    is_active = COALESCE(?, is_active),
                    updated_at = NOW()
                WHERE p_id = ?
            `, [
                product_name, product_variant, barcode, description,
                category_id, price, cost_price, weight, dimensions,
                is_active, id
            ]);

            // Log activity
            await db.execute(`
                INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
                VALUES (?, 'UPDATE', 'PRODUCTS', ?, ?, ?, ?)
            `, [
                req.user.userId,
                id,
                JSON.stringify({ 
                    old: existing[0], 
                    new: { product_name, barcode, category_id } 
                }),
                req.ip,
                req.get('User-Agent')
            ]);

            res.json({
                success: true,
                message: 'Product updated successfully'
            });

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete product
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            const [existing] = await db.execute(
                'SELECT * FROM dispatch_product WHERE p_id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Soft delete
            await db.execute(
                'UPDATE dispatch_product SET is_active = 0, updated_at = NOW() WHERE p_id = ?',
                [id]
            );

            // Log activity
            await db.execute(`
                INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
                VALUES (?, 'DELETE', 'PRODUCTS', ?, ?, ?, ?)
            `, [
                req.user.userId,
                id,
                JSON.stringify({ product_name: existing[0].product_name, barcode: existing[0].barcode }),
                req.ip,
                req.get('User-Agent')
            ]);

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });

        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Bulk import products (CSV/Excel)
    static async bulkImport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const filePath = req.file.path;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
            let products = [];

            if (fileExtension === 'csv') {
                // Parse CSV
                products = await new Promise((resolve, reject) => {
                    const results = [];
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => results.push(data))
                        .on('end', () => resolve(results))
                        .on('error', reject);
                });
            } else if (['xlsx', 'xls'].includes(fileExtension)) {
                // Parse Excel
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                products = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported file format. Use CSV or Excel files.'
                });
            }

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                try {
                    // Validate required fields
                    if (!product.product_name || !product.barcode) {
                        errors.push(`Row ${i + 1}: Missing product_name or barcode`);
                        errorCount++;
                        continue;
                    }

                    // Check if barcode exists
                    const [existing] = await db.execute(
                        'SELECT p_id FROM dispatch_product WHERE barcode = ?',
                        [product.barcode]
                    );

                    if (existing.length > 0) {
                        errors.push(`Row ${i + 1}: Barcode ${product.barcode} already exists`);
                        errorCount++;
                        continue;
                    }

                    // Insert product
                    await db.execute(`
                        INSERT INTO dispatch_product (
                            product_name, product_variant, barcode, description,
                            category_id, price, cost_price, weight, dimensions,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `, [
                        product.product_name,
                        product.product_variant || null,
                        product.barcode,
                        product.description || null,
                        product.category_id || null,
                        product.price || null,
                        product.cost_price || null,
                        product.weight || null,
                        product.dimensions || null
                    ]);

                    successCount++;

                } catch (error) {
                    errors.push(`Row ${i + 1}: ${error.message}`);
                    errorCount++;
                }
            }

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            // Log bulk import activity
            await db.execute(`
                INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
                VALUES (?, 'BULK_IMPORT', 'PRODUCTS', ?, ?, ?)
            `, [
                req.user.userId,
                JSON.stringify({ 
                    total: products.length, 
                    success: successCount, 
                    errors: errorCount 
                }),
                req.ip,
                req.get('User-Agent')
            ]);

            res.json({
                success: true,
                message: 'Bulk import completed',
                data: {
                    total: products.length,
                    success: successCount,
                    errors: errorCount,
                    errorDetails: errors.slice(0, 10) // Limit error details
                }
            });

        } catch (error) {
            console.error('Bulk import error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all categories
    static async getCategories(req, res) {
        try {
            const [categories] = await db.execute(`
                SELECT 
                    id,
                    name,
                    display_name,
                    description,
                    parent_id,
                    is_active,
                    created_at
                FROM product_categories 
                WHERE is_active = 1
                ORDER BY display_name ASC
            `);

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Download template for bulk import
    static async downloadTemplate(req, res) {
        try {
            const templateData = [
                {
                    product_name: 'Sample Baby Wear',
                    product_variant: 'Size - 6-12m',
                    barcode: 'SAMPLE-001',
                    description: 'Sample baby clothing item',
                    category_id: 1,
                    price: 25.99,
                    cost_price: 15.00,
                    weight: 0.2,
                    dimensions: '10x8x2'
                },
                {
                    product_name: 'Sample Baby Toy',
                    product_variant: 'Red Color',
                    barcode: 'SAMPLE-002',
                    description: 'Educational baby toy',
                    category_id: 4,
                    price: 12.50,
                    cost_price: 8.00,
                    weight: 0.15,
                    dimensions: '15x10x5'
                }
            ];

            // Create workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(templateData);

            // Add column widths
            worksheet['!cols'] = [
                { width: 25 }, // product_name
                { width: 15 }, // product_variant
                { width: 15 }, // barcode
                { width: 30 }, // description
                { width: 12 }, // category_id
                { width: 10 }, // price
                { width: 12 }, // cost_price
                { width: 10 }, // weight
                { width: 15 }  // dimensions
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

    // Create category
    static async createCategory(req, res) {
        try {
            const { name, display_name, description, parent_id } = req.body;

            if (!name || !display_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and display name are required'
                });
            }

            const [result] = await db.execute(`
                INSERT INTO product_categories (name, display_name, description, parent_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `, [name, display_name, description, parent_id]);

            res.json({
                success: true,
                message: 'Category created successfully',
                data: {
                    id: result.insertId,
                    name,
                    display_name
                }
            });

        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
        try {
            const { name, display_name, description, parent_id } = req.body;

            if (!name || !display_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and display name are required'
                });
            }

            const [result] = await db.execute(`
                INSERT INTO product_categories (name, display_name, description, parent_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `, [name, display_name, description, parent_id]);

            res.json({
                success: true,
                message: 'Category created successfully',
                data: {
                    id: result.insertId,
                    name,
                    display_name
                }
            });

        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = ProductController;