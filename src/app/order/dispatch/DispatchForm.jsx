"use client";
import React, { useEffect, useState } from "react";
import styles from "./dispatchForm.module.css";

/* ✅ UPDATED API ENDPOINTS */
const API = "https://api.hunyhuny.org/api/dispatch";
const CREATE_API = "https://api.hunyhuny.org/api/dispatch";

export default function DispatchForm() {
    const [warehouses, setWarehouses] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [products, setProducts] = useState([{ name: "", qty: 1, suggestions: [] }]);

    // NEW: Stock checking + UI states
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    const initialForm = {
        orderType: "Offline",
        email: "",
        selectedWarehouse: "",
        orderRef: "",
        customerName: "",
        awb: "",
        logistics: "",
        paymentMode: "",
        parcelType: "Forward",
        processedBy: "",
        invoiceAmount: "",
        weight: "",
        length: "",
        width: "",
        height: "",
        remarks: "",
    };

    const [form, setForm] = useState(initialForm);
    const update = (k, v) => setForm({ ...form, [k]: v });

    /* ------------------ YOUR ORIGINAL DROPDOWNS ------------------ */
    useEffect(() => {
        console.log('🔄 Loading dropdown data...');
        
        fetch(`${API}/warehouses`)
            .then(r => {
                console.log('📦 Warehouses response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('📦 Warehouses data:', data);
                setWarehouses(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error('❌ Warehouses error:', err));
            
        fetch(`${API}/logistics`)
            .then(r => {
                console.log('🚚 Logistics response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('🚚 Logistics data:', data);
                setLogistics(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error('❌ Logistics error:', err));
            
        fetch(`${API}/processed-persons`)
            .then(r => {
                console.log('👤 Executives response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('👤 Executives data:', data);
                setExecutives(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error('❌ Executives error:', err));
    }, []);

    /* ------------------ NEW: STOCK CHECKER ------------------ */
    const checkStock = async (barcode) => {
        if (!barcode || stockData[barcode] || !form.selectedWarehouse) return;

        console.log('📦 Checking stock for:', { barcode, warehouse: form.selectedWarehouse });

        try {
            const url = `${API}/check-inventory?warehouse=${encodeURIComponent(form.selectedWarehouse)}&barcode=${barcode}&qty=1`;
            console.log('📦 Stock check URL:', url);
            
            const res = await fetch(url);
            const data = await res.json();
            
            console.log('📦 Stock check result:', data);
            
            setStockData(prev => ({ ...prev, [barcode]: data }));
        } catch (error) {
            console.error('❌ Stock check failed:', error);
            setStockData(prev => ({ ...prev, [barcode]: { available: 0, ok: false } }));
        }
    };

    /* ------------------ INVENTORY VALIDATION ------------------ */
    const validateInventory = async (index, qtyOverride = null) => {
        const product = products[index];
        if (!form.selectedWarehouse || !product.name) return;

        const barcode = extractBarcode(product.name);
        const qty = qtyOverride || product.qty;

        if (!barcode) return;

        console.log('🔍 Validating inventory:', {
            warehouse: form.selectedWarehouse,
            barcode,
            qty,
            productName: product.name
        });

        try {
            const url = `${API}/check-inventory?warehouse=${encodeURIComponent(form.selectedWarehouse)}&barcode=${barcode}&qty=${qty}`;
            console.log('🔍 Validation URL:', url);
            
            const res = await fetch(url);
            const result = await res.json();
            
            console.log('🔍 Validation result:', result);
            
            setStockData(prev => ({ ...prev, [`${barcode}_${index}`]: result }));
        } catch (err) {
            console.error('❌ Stock validation failed:', err);
            setStockData(prev => ({ ...prev, [`${barcode}_${index}`]: { available: 0, ok: false, message: 'Validation failed' } }));
        }
    };

    /* ------------------ EXTRACT BARCODE ------------------ */
    const extractBarcode = (str) => {
        if (!str || !str.includes("|")) return "";
        const parts = str.split("|").map((s) => s.trim());
        return parts[parts.length - 1];
    };

    /* ------------------ YOUR ORIGINAL PRODUCT SEARCH ------------------ */
    const searchProduct = async (index, value) => {
        const updated = [...products];
        updated[index].name = value;

        if (value.length > 2) {
            try {
                const res = await fetch(`${API}/search-products?query=${encodeURIComponent(value)}`);
                if (res.ok) {
                    const data = await res.json();
                    // Handle both array response and object with data property
                    updated[index].suggestions = Array.isArray(data) ? data : (data.data || []);
                } else {
                    console.error('Product search failed:', res.status);
                    updated[index].suggestions = [];
                }
            } catch (error) {
                console.error('Product search error:', error);
                updated[index].suggestions = [];
            }
        } else {
            updated[index].suggestions = [];
        }
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) {
            checkStock(barcodeMatch[1]);
            validateInventory(index);
        }
    };

    const selectProduct = (index, value) => {
        const updated = [...products];
        updated[index].name = value;
        updated[index].suggestions = [];
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) {
            checkStock(barcodeMatch[1]);
            validateInventory(index);
        }
    };

    const addProduct = () =>
        setProducts([...products, { name: "", qty: 1, suggestions: [] }]);

    const removeProduct = (i) =>
        setProducts(products.filter((_, idx) => idx !== i));

    /* ------------------ YOUR ORIGINAL SUBMIT (ENHANCED) ------------------ */
    const submitDispatch = async () => {
        if (loading) return;

        // Check if all products have sufficient stock
        const hasStockIssues = products.some((product, index) => {
            const barcode = extractBarcode(product.name);
            const validationKey = `${barcode}_${index}`;
            const validation = stockData[validationKey];
            return validation && !validation.ok;
        });

        if (hasStockIssues) {
            setError("Cannot dispatch - insufficient stock for some products");
            return;
        }

        const payload = {
            orderType: form.orderType,
            email: form.email,
            selectedWarehouse: form.selectedWarehouse,
            selectedLogistics: form.logistics,
            selectedExecutive: form.processedBy,
            selectedPaymentMode: form.paymentMode,
            parcelType: form.parcelType,
            orderRef: form.orderRef,
            customerName: form.customerName,
            awbNumber: form.awb,
            dimensions: {
                length: form.length,
                width: form.width,
                height: form.height,
            },
            weight: form.weight,
            invoiceAmount: form.invoiceAmount,
            remarks: form.remarks,
            products: products.map(p => ({
                name: p.name,
                qty: p.qty,
            })),
        };

        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${CREATE_API}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create dispatch");
            }

            setShowSuccess(true);
            setTimeout(() => {
                setForm(initialForm);
                setProducts([{ name: "", qty: 1, suggestions: [] }]);
                setStockData({});
                setShowSuccess(false);
            }, 3000);

        } catch (err) {
            setError(err.message || "Dispatch submission failed");
            setTimeout(() => setError(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    /* ------------------ PROFESSIONAL SUCCESS SCREEN ------------------ */
    if (showSuccess) {
        return (
            <div className={styles.container}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <div className={styles.successContent}>
                        <h2 className={styles.successTitle}>Dispatch Created Successfully!</h2>
                        <p className={styles.successMessage}>
                            Order <strong>{form.orderRef}</strong> has been dispatched from
                            <strong> {form.selectedWarehouse}</strong> to customer
                            <strong> {form.customerName}</strong>
                        </p>
                        <div className={styles.successSpinner} />
                    </div>
                </div>
            </div>
        );
    }

    /* ------------------ MAIN FORM ------------------ */
    return (
        <div className={styles.container}>
            {/* ERROR TOAST */}
            {error && (
                <div className={styles.errorToast}>
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError("")} className={styles.closeBtn}>×</button>
                </div>
            )}

            <header className={styles.header}>
                <h1 className={styles.title}>New Dispatch Entry</h1>
                <p className={styles.subtitle}>Every barcode tells a story of progress — keep moving forward</p>
            </header>

            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submitDispatch(); }}>
                <div className={styles.formContainer}>
                {/* MAIN FIELDS */}
                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Order Information</h3>
                    <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Order Type</label>
                        <select value={form.orderType} onChange={e => update("orderType", e.target.value)} className={styles.select}>
                            <option>Offline</option>
                            <option>Website</option>
                        </select>
                    </div>

                    {form.orderType === "Website" && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Customer Email</label>
                            <input
                                className={styles.input}
                                placeholder="customer@email.com"
                                value={form.email}
                                onChange={e => update("email", e.target.value)}
                                type="email"
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Source Warehouse *</label>
                        <select value={form.selectedWarehouse} onChange={e => update("selectedWarehouse", e.target.value)} className={styles.select} required>
                            <option value="">Select Source Warehouse</option>
                            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Order Reference *</label>
                        <input
                            className={styles.input}
                            placeholder="ORD-2025-001"
                            value={form.orderRef}
                            onChange={e => update("orderRef", e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Customer Name *</label>
                        <input
                            className={styles.input}
                            placeholder="John Doe"
                            value={form.customerName}
                            onChange={e => update("customerName", e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>AWB Number *</label>
                        <input
                            className={styles.input}
                            placeholder="AWB123456789"
                            value={form.awb}
                            onChange={e => update("awb", e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Logistics Partner *</label>
                        <select value={form.logistics} onChange={e => update("logistics", e.target.value)} className={styles.select} required>
                            <option value="">Select Logistics</option>
                            {logistics.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Payment Mode *</label>
                        <select value={form.paymentMode} onChange={e => update("paymentMode", e.target.value)} className={styles.select} required>
                            <option value="">Select Payment</option>
                            <option>COD</option>
                            <option>Prepaid</option>
                            <option>UPI</option>
                            <option>Credit Card</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Parcel Type</label>
                        <select value={form.parcelType} onChange={e => update("parcelType", e.target.value)} className={styles.select}>
                            <option>Forward</option>
                            <option>Forward + Return</option>
                            <option>Return</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Processed By</label>
                        <select value={form.processedBy} onChange={e => update("processedBy", e.target.value)} className={styles.select}>
                            <option value="">Select Executive</option>
                            {executives.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Invoice Amount (₹)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="2500"
                            value={form.invoiceAmount}
                            onChange={e => update("invoiceAmount", e.target.value)}
                        />
                    </div>
                    </div>
                </div>

                {/* DIMENSIONS */}
                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Dimensions</h3>
                    <div className={styles.dimGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Weight (kg)</label>
                            <input className={styles.input} placeholder="25.5" value={form.weight} onChange={e => update("weight", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Length (cm)</label>
                            <input className={styles.input} placeholder="120" value={form.length} onChange={e => update("length", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Width (cm)</label>
                            <input className={styles.input} placeholder="60" value={form.width} onChange={e => update("width", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Height (cm)</label>
                            <input className={styles.input} placeholder="80" value={form.height} onChange={e => update("height", e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* REMARKS */}
                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Additional Notes</h3>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Remarks</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add any additional notes or special instructions..."
                            value={form.remarks}
                            onChange={e => update("remarks", e.target.value)}
                            rows="4"
                        />
                    </div>
                </div>

                {/* PRODUCTS */}
                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Products <span className={styles.productCount}>({products.length})</span></h3>

                    {products.map((p, i) => (
                        <div key={i} className={styles.productRow}>
                            <div className={styles.searchBox}>
                                <input
                                    className={styles.input}
                                    placeholder="Product name / barcode"
                                    value={p.name}
                                    onChange={e => searchProduct(i, e.target.value)}
                                />
                                {p.suggestions.length > 0 && (
                                    <div className={styles.suggestions}>
                                        {p.suggestions.map(s => (
                                            <div
                                                key={s.p_id || s.barcode}
                                                className={styles.suggestionItem}
                                                onClick={() =>
                                                    selectProduct(i, `${s.product_name} | ${s.product_variant || ''} | ${s.barcode}`)
                                                }
                                            >
                                                <div className={styles.suggestionContent}>
                                                    <div className={styles.suggestionName}>
                                                        {s.product_name}
                                                    </div>
                                                    {s.product_variant && (
                                                        <div className={styles.suggestionVariant}>
                                                            {s.product_variant}
                                                        </div>
                                                    )}
                                                    <div className={styles.suggestionBarcode}>
                                                        {s.barcode}
                                                    </div>
                                                </div>
                                                {stockData[s.barcode] && (
                                                    <span className={styles.stockBadge}>
                                                        📦 {stockData[s.barcode].available || 'N/A'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stock Validation Display */}
                            {(() => {
                                const barcode = extractBarcode(p.name);
                                const validationKey = `${barcode}_${i}`;
                                const validation = stockData[validationKey];
                                
                                if (validation && barcode) {
                                    return (
                                        <div className={styles.validationMsg} style={{ 
                                            color: validation.ok ? "green" : "red",
                                            fontSize: "12px",
                                            marginTop: "4px"
                                        }}>
                                            {validation.ok 
                                                ? `✅ Available: ${validation.available}` 
                                                : `❌ ${validation.message || 'Insufficient stock'}`
                                            }
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className={styles.qtyGroup}>
                                <input
                                    type="number"
                                    className={styles.qtyInput}
                                    placeholder="Qty"
                                    value={p.qty}
                                    min="1"
                                    onChange={e => {
                                        const u = [...products];
                                        u[i].qty = parseInt(e.target.value) || 1;
                                        setProducts(u);
                                        validateInventory(i, u[i].qty);
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => removeProduct(i)}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className={styles.addProductBtn}
                        onClick={addProduct}
                    >
                        ➕ Add Product
                    </button>
                </div>

                {/* SUBMIT */}
                <div className={styles.submitSection}>
                    <button
                        className={`${styles.submitBtn} ${loading ? styles.loading : ''}`}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className={styles.spinner} />
                                Creating Dispatch...
                            </>
                        ) : (
                            `Submit Dispatch (${products.length} products)`
                        )}
                    </button>
                </div>
            </div>
            </form>
        </div>
    );
}
