'use client';

import React, { useState, useEffect } from 'react';
import { Download, Upload, Plus, Search, Filter, Edit, Trash2, Package, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import styles from './products.module.css';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [notification, setNotification] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        product_name: '',
        product_variant: '',
        barcode: '',
        description: '',
        category_id: '',
        price: '',
        cost_price: '',
        weight: '',
        dimensions: ''
    });

    // Category form state
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        display_name: '',
        description: '',
        parent_id: ''
    });
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [currentPage, searchTerm, selectedCategory]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20,
                search: searchTerm,
                category: selectedCategory
            });

            const response = await fetch(`http://localhost:3001/api/products?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                setProducts(data.data.products);
                setTotalPages(data.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            showNotification('Failed to fetch products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/products/categories/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const downloadTemplate = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/products/bulk/template', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'products_template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showNotification('Template downloaded successfully!');
            } else {
                showNotification('Failed to download template', 'error');
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            showNotification('Failed to download template', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingProduct 
                ? `http://localhost:3001/api/products/${editingProduct.p_id}`
                : 'http://localhost:3001/api/products';
            
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setShowAddForm(false);
                setEditingProduct(null);
                setFormData({
                    product_name: '',
                    product_variant: '',
                    barcode: '',
                    description: '',
                    category_id: '',
                    price: '',
                    cost_price: '',
                    weight: '',
                    dimensions: ''
                });
                fetchProducts();
                showNotification(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
            } else {
                showNotification(data.message || 'Error saving product', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Error saving product', 'error');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            product_name: product.product_name || '',
            product_variant: product.product_variant || '',
            barcode: product.barcode || '',
            description: product.description || '',
            category_id: product.category_id || '',
            price: product.price || '',
            cost_price: product.cost_price || '',
            weight: product.weight || '',
            dimensions: product.dimensions || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                fetchProducts();
                showNotification('Product deleted successfully!');
            } else {
                showNotification(data.message || 'Error deleting product', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Error deleting product', 'error');
        }
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        const fileInput = e.target.file;
        const file = fileInput.files[0];

        if (!file) {
            showNotification('Please select a file', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:3001/api/products/bulk/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setShowBulkImport(false);
                fetchProducts();
                showNotification(`Import completed! Success: ${data.data.success}, Errors: ${data.data.errors}`);
            } else {
                showNotification(data.message || 'Error importing products', 'error');
            }
        } catch (error) {
            console.error('Error importing products:', error);
            showNotification('Error importing products', 'error');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/products/categories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryForm)
            });

            const data = await response.json();
            if (data.success) {
                setShowCategoryForm(false);
                setCategoryForm({
                    name: '',
                    display_name: '',
                    description: '',
                    parent_id: ''
                });
                fetchCategories();
                showNotification('Category created successfully!');
            } else {
                showNotification(data.message || 'Error creating category', 'error');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            showNotification('Error creating category', 'error');
        }
    };

    return (
        <div className={styles.container}>
            {/* Notification */}
            {notification && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.titleSection}>
                        <Package className={styles.titleIcon} size={32} />
                        <div>
                            <h1>Product Management</h1>
                            <p>Manage your product catalog with ease</p>
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button 
                        className={`${styles.btn} ${styles.primaryBtn}`}
                        onClick={() => setShowAddForm(true)}
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                    <button 
                        className={`${styles.btn} ${styles.secondaryBtn}`}
                        onClick={() => setShowBulkImport(true)}
                    >
                        <Upload size={18} />
                        Bulk Import
                    </button>
                    <button 
                        className={`${styles.btn} ${styles.outlineBtn}`}
                        onClick={() => setShowCategoryForm(true)}
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Package size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <h3>{products.length}</h3>
                        <p>Total Products</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Filter size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <h3>{categories.length}</h3>
                        <p>Categories</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersCard}>
                <div className={styles.filtersHeader}>
                    <h3>
                        <Search size={20} />
                        Search & Filter
                    </h3>
                </div>
                <div className={styles.filtersContent}>
                    <div className={styles.searchGroup}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name, barcode, or variant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={styles.categorySelect}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.name}>
                                {category.display_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h3>Products ({products.length})</h3>
                </div>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading products...</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Product Details</th>
                                    <th>Barcode</th>
                                    <th>Category</th>
                                    <th>Pricing</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.p_id}>
                                        <td>
                                            <div className={styles.productInfo}>
                                                <div className={styles.productAvatar}>
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className={styles.productName}>{product.product_name}</div>
                                                    {product.product_variant && (
                                                        <div className={styles.productVariant}>{product.product_variant}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <code className={styles.barcode}>{product.barcode}</code>
                                        </td>
                                        <td>
                                            <span className={styles.categoryBadge}>
                                                {product.category_display_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.pricing}>
                                                {product.price && <div className={styles.price}>${product.price}</div>}
                                                {product.cost_price && <div className={styles.costPrice}>Cost: ${product.cost_price}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                                    onClick={() => handleEdit(product)}
                                                    title="Edit Product"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(product.p_id)}
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={styles.paginationBtn}
                >
                    Previous
                </button>
                <span className={styles.paginationInfo}>Page {currentPage} of {totalPages}</span>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={styles.paginationBtn}
                >
                    Next
                </button>
            </div>

            {/* Add/Edit Product Modal */}
            {showAddForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingProduct(null);
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.product_name}
                                        onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Product Variant</label>
                                    <input
                                        type="text"
                                        value={formData.product_variant}
                                        onChange={(e) => setFormData({...formData, product_variant: e.target.value})}
                                        placeholder="e.g., Size - 6-12m, Red Color"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Barcode *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                        placeholder="Enter unique barcode"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Selling Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Cost Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                        placeholder="0.000"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Dimensions</label>
                                    <input
                                        type="text"
                                        placeholder="L x W x H (e.g., 10x8x2)"
                                        value={formData.dimensions}
                                        onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter product description..."
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                                <button 
                                    type="button" 
                                    className={`${styles.btn} ${styles.outlineBtn}`}
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingProduct(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Bulk Import Products</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowBulkImport(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className={styles.bulkImportContent}>
                            <div className={styles.templateSection}>
                                <div className={styles.templateHeader}>
                                    <FileSpreadsheet size={24} />
                                    <div>
                                        <h3>Download Template</h3>
                                        <p>Get the Excel template with sample data and correct column format</p>
                                    </div>
                                </div>
                                <button 
                                    className={`${styles.btn} ${styles.outlineBtn}`}
                                    onClick={downloadTemplate}
                                >
                                    <Download size={18} />
                                    Download Template
                                </button>
                            </div>

                            <div className={styles.divider}>
                                <span>OR</span>
                            </div>

                            <form onSubmit={handleBulkImport}>
                                <div className={styles.uploadSection}>
                                    <div className={styles.uploadArea}>
                                        <Upload size={48} />
                                        <h3>Upload Your File</h3>
                                        <p>Choose CSV or Excel file with your product data</p>
                                        <input
                                            type="file"
                                            name="file"
                                            accept=".csv,.xlsx,.xls"
                                            required
                                            className={styles.fileInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.columnInfo}>
                                    <h4>Required Columns:</h4>
                                    <div className={styles.columnGrid}>
                                        <div className={styles.columnItem}>
                                            <strong>product_name</strong> - Product name (required)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>barcode</strong> - Unique barcode (required)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>product_variant</strong> - Product variant (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>description</strong> - Product description (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>category_id</strong> - Category ID (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>price</strong> - Selling price (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>cost_price</strong> - Cost price (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>weight</strong> - Weight in kg (optional)
                                        </div>
                                        <div className={styles.columnItem}>
                                            <strong>dimensions</strong> - L x W x H (optional)
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                                        <Upload size={18} />
                                        Import Products
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`${styles.btn} ${styles.outlineBtn}`}
                                        onClick={() => setShowBulkImport(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Form Modal */}
            {showCategoryForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Add New Category</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowCategoryForm(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className={styles.formGroup}>
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                                    placeholder="e.g., baby_wear"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Display Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.display_name}
                                    onChange={(e) => setCategoryForm({...categoryForm, display_name: e.target.value})}
                                    placeholder="e.g., Baby Wear"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                                    placeholder="Enter category description..."
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                                    Create Category
                                </button>
                                <button 
                                    type="button" 
                                    className={`${styles.btn} ${styles.outlineBtn}`}
                                    onClick={() => setShowCategoryForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;