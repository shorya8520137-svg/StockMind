"use client";
import React, { useEffect, useState } from "react";
import styles from "../order/dispatch/dispatchForm.module.css";

/* API ENDPOINTS */
const API = "https://13-201-222-24.nip.io/api/dispatch";
const PRODUCTS_API = "https://13-201-222-24.nip.io/api/products";

export default function TransferForm({ onClose }) {
    const [warehouses, setWarehouses] = useState([]);
    const [stores, setStores] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [products, setProducts] = useState([{ name: "", qty: 1, suggestions: [] }]);

    // Stock checking + UI states
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    const initialForm = {
        transferType: "W to W", // Main transfer type selector
        sourceWarehouse: "",
        sourceStore: "",
        destinationWarehouse: "",
        destinationStore: "",
        orderRef: "",
        awb: "",
        logistics: "",
        paymentMode: "",
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

    /* ------------------ LOAD DROPDOWNS ------------------ */
    useEffect(() => {
        // Load warehouses from dispatch API
        fetch(`${API}/warehouses`).then(r => r.json()).then(setWarehouses);
        
        // Load logistics from dispatch API
        fetch(`${API}/logistics`).then(r => r.json()).then(setLogistics);
        
        // Load executives from dispatch API
        fetch(`${API}/processed-persons`).then(r => r.json()).then(setExecutives);
        
        // Load stores from products API
        fetch(`${PRODUCTS_API}/stores`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStores(data.data);
                }
            })
            .catch(err => console.error('Error fetching stores:', err));
    }, []);

    /* ------------------ STOCK CHECKER ------------------ */
    const checkStock = async (barcode) => {
        if (!barcode || stockData[barcode]) return;

        try {
            const res = await fetch(`https://13-201-222-24.nip.io/api/product-tracking/${barcode}`);
            const data = await res.json();
            setStockData(prev => ({ ...prev, [barcode]: data.finalStock || 0 }));
        } catch {
            setStockData(prev => ({ ...prev, [barcode]: null }));
        }
    };

    /* ------------------ PRODUCT SEARCH ------------------ */
    const searchProduct = async (index, value) => {
        const updated = [...products];
        updated[index].name = value;

        if (value.length > 2) {
            const res = await fetch(`${API}/search-products?query=${value}`);
            updated[index].suggestions = await res.json();
        } else {
            updated[index].suggestions = [];
        }
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) checkStock(barcodeMatch[1]);
    };

    const selectProduct = (index, value) => {
        const updated = [...products];
        updated[index].name = value;
        updated[index].suggestions = [];
        setProducts(updated);

        // Extract barcode for stock check
        const barcodeMatch = value.match(/\| (\w+)$/);
        if (barcodeMatch) checkStock(barcodeMatch[1]);
    };

    const addProduct = () =>
        setProducts([...products, { name: "", qty: 1, suggestions: [] }]);

    const removeProduct = (i) =>
        setProducts(products.filter((_, idx) => idx !== i));

    /* ------------------ SUBMIT TRANSFER ------------------ */
    const submitTransfer = async () => {
        if (loading) return;

        const payload = {
            selectedWarehouse: form.sourceWarehouse || form.sourceStore,
            selectedLogistics: form.logistics,
            selectedExecutive: form.processedBy,
            selectedPaymentMode: form.paymentMode,
            parcelType: "Self Transfer",
            orderRef: form.orderRef,
            transferType: form.transferType,
            sourceWarehouse: form.sourceWarehouse,
            sourceStore: form.sourceStore,
            destinationWarehouse: form.destinationWarehouse,
            destinationStore: form.destinationStore,
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

            const res = await fetch(`https://13-201-222-24.nip.io/api/self-transfer/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create transfer");
            }

            setShowSuccess(true);
            setTimeout(() => {
                setForm(initialForm);
                setProducts([{ name: "", qty: 1, suggestions: [] }]);
                setStockData({});
                setShowSuccess(false);
                onClose();
            }, 3000);

        } catch (err) {
            setError(err.message || "Transfer submission failed");
            setTimeout(() => setError(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    /* ------------------ SUCCESS SCREEN ------------------ */
    if (showSuccess) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.container} onClick={e => e.stopPropagation()}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>✅</div>
                        <div className={styles.successContent}>
                            <h2 className={styles.successTitle}>Self Transfer Created Successfully!</h2>
                            <p className={styles.successMessage}>
                                Self Transfer <strong>{form.orderRef}</strong> has been created from
                                <strong> {form.sourceWarehouse || form.sourceStore}</strong> to 
                                <strong> {form.destinationWarehouse || form.destinationStore}</strong>
                            </p>
                            <div className={styles.successSpinner} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ------------------ MAIN FORM ------------------ */
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={e => e.stopPropagation()}>
                {/* ERROR TOAST */}
                {error && (
                    <div className={styles.errorToast}>
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError("")} className={styles.closeBtn}>×</button>
                    </div>
                )}

                <header className={styles.header}>
                    <h1 className={styles.title}>New Self Transfer Entry</h1>
                    <p className={styles.subtitle}>Transfer inventory between locations — warehouse to warehouse, warehouse to store, store to store, store to warehouse</p>
                    <button 
                        className={styles.closeBtn} 
                        onClick={onClose} 
                        style={{
                            position: 'absolute', 
                            top: '20px', 
                            right: '20px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: '#64748b',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </header>

                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submitTransfer(); }}>
                    <div className={styles.formContainer}>
                    {/* MAIN FIELDS */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Transfer Information</h3>
                        <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Transfer Type *</label>
                            <select 
                                value={form.transferType} 
                                onChange={e => {
                                    update("transferType", e.target.value);
                                    // Clear all location selections when transfer type changes
                                    update("sourceWarehouse", "");
                                    update("sourceStore", "");
                                    update("destinationWarehouse", "");
                                    update("destinationStore", "");
                                }} 
                                className={styles.select}
                                required
                            >
                                <option value="W to W">Warehouse to Warehouse</option>
                                <option value="W to S">Warehouse to Store</option>
                                <option value="S to S">Store to Store</option>
                                <option value="S to W">Store to Warehouse</option>
                            </select>
                        </div>

                        {/* SOURCE SELECTION */}
                        {(form.transferType === 'W to W' || form.transferType === 'W to S') && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Source Warehouse *</label>
                                <select value={form.sourceWarehouse} onChange={e => update("sourceWarehouse", e.target.value)} className={styles.select} required>
                                    <option value="">Select Source Warehouse</option>
                                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                        )}

                        {(form.transferType === 'S to S' || form.transferType === 'S to W') && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Source Store *</label>
                                <select value={form.sourceStore} onChange={e => update("sourceStore", e.target.value)} className={styles.select} required>
                                    <option value="">Select Source Store</option>
                                    {stores.map(store => (
                                        <option key={store.store_code} value={store.store_code}>
                                            {store.store_name} - {store.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* DESTINATION SELECTION */}
                        {(form.transferType === 'W to W' || form.transferType === 'S to W') && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Destination Warehouse *</label>
                                <select value={form.destinationWarehouse} onChange={e => update("destinationWarehouse", e.target.value)} className={styles.select} required>
                                    <option value="">Select Destination Warehouse</option>
                                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                        )}

                        {(form.transferType === 'W to S' || form.transferType === 'S to S') && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Destination Store *</label>
                                <select value={form.destinationStore} onChange={e => update("destinationStore", e.target.value)} className={styles.select} required>
                                    <option value="">Select Destination Store</option>
                                    {stores.map(store => (
                                        <option key={store.store_code} value={store.store_code}>
                                            {store.store_name} - {store.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Order Reference *</label>
                            <input
                                className={styles.input}
                                placeholder="STF-2025-001"
                                value={form.orderRef}
                                onChange={e => update("orderRef", e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>AWB Number</label>
                            <input
                                className={styles.input}
                                placeholder="AWB123456789"
                                value={form.awb}
                                onChange={e => update("awb", e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Logistics</label>
                            <select value={form.logistics} onChange={e => update("logistics", e.target.value)} className={styles.select}>
                                <option value="">Select Logistics</option>
                                {logistics.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Payment Mode</label>
                            <select value={form.paymentMode} onChange={e => update("paymentMode", e.target.value)} className={styles.select}>
                                <option value="">Select Payment</option>
                                <option>Internal</option>
                                <option>Transfer</option>
                                <option>Adjustment</option>
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
                                                    key={s.barcode}
                                                    className={styles.suggestionItem}
                                                    onClick={() =>
                                                        selectProduct(i, `${s.product_name} | ${s.product_variant} | ${s.barcode}`)
                                                    }
                                                >
                                                    {s.product_name} ({s.product_variant})
                                                    <span className={styles.barcode}>{s.barcode}</span>
                                                    {stockData[s.barcode] !== undefined && (
                                                        <span className={styles.stockBadge}>
                                                            📦 {stockData[s.barcode] || 'N/A'}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

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
                                    Creating Self Transfer...
                                </>
                            ) : (
                            `Submit Self Transfer (${products.length} products)`
                            )}
                        </button>
                    </div>
                </div>
                </form>
            </div>
        </div>
    );
}