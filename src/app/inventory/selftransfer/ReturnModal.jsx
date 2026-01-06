"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./returnModal.module.css";

const API = "https://13-201-222-24.nip.io/api/dispatch";
const RETURNS_API = "https://13-201-222-24.nip.io/api/returns";

export default function ReturnModal({ onClose }) {
    const [warehouseQuery, setWarehouseQuery] = useState("");
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const [productQuery, setProductQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [qty, setQty] = useState(1);
    const [subtype, setSubtype] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    /* ------------------------------
       WAREHOUSE SEARCH
    -------------------------------- */
    useEffect(() => {
        fetch(`${API}/warehouses`)
            .then(r => r.json())
            .then(data => {
                const allWarehouses = Array.isArray(data) ? data : [];
                // Filter warehouses based on query
                if (warehouseQuery.length < 2) {
                    setWarehouses([]);
                } else {
                    const filtered = allWarehouses
                        .map(code => ({ warehouse_code: code, Warehouse_name: code }))
                        .filter(w => 
                            w.warehouse_code.toLowerCase().includes(warehouseQuery.toLowerCase()) ||
                            w.Warehouse_name.toLowerCase().includes(warehouseQuery.toLowerCase())
                        );
                    setWarehouses(filtered);
                }
            })
            .catch(() => setWarehouses([]));
    }, [warehouseQuery]);

    /* ------------------------------
       PRODUCT SEARCH
    -------------------------------- */
    useEffect(() => {
        if (productQuery.length < 2) {
            setProducts([]);
            return;
        }

        fetch(`${API}/search-products?query=${productQuery}`)
            .then(r => r.json())
            .then(data => {
                setProducts(Array.isArray(data) ? data : (data.data || []));
            })
            .catch(() => setProducts([]));
    }, [productQuery]);

    /* ------------------------------
       SUBMIT RETURN
    -------------------------------- */
    async function submit() {
        if (!selectedWarehouse || !selectedProduct || !qty) {
            setMsg("Please complete all fields");
            return;
        }

        try {
            setLoading(true);
            setMsg("");

            const res = await fetch(RETURNS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_type: selectedProduct.product_name,
                    barcode: selectedProduct.barcode,
                    warehouse: selectedWarehouse.warehouse_code,
                    quantity: Number(qty),
                    subtype: subtype || undefined
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");

            setMsg("✔ Return created successfully");
            setTimeout(onClose, 900);

        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div 
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <motion.div 
                    className={styles.panel}
                    initial={{ scale: 0.92, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 10, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                >
                <button className={styles.close} onClick={onClose}>✕</button>

                <div className={styles.header}>Product Return</div>

                {/* Warehouse */}
                <div className={styles.field}>
                    <label className={styles.label}>Warehouse</label>
                    <div className={styles.suggestWrap}>
                        <input
                            className={styles.input}
                            placeholder="Search warehouse"
                            value={warehouseQuery}
                            onChange={e => {
                                setWarehouseQuery(e.target.value);
                                setSelectedWarehouse(null);
                            }}
                        />

                        {warehouses.length > 0 && (
                            <div className={styles.suggestBox}>
                                {warehouses.map(w => (
                                    <div
                                        key={w.warehouse_code}
                                        className={styles.suggestItem}
                                        onMouseDown={() => {
                                            setSelectedWarehouse(w);
                                            setWarehouseQuery(
                                                `${w.Warehouse_name} (${w.warehouse_code})`
                                            );
                                            setWarehouses([]);
                                        }}
                                    >
                                        <b>{w.Warehouse_name}</b>
                                        <span>{w.warehouse_code}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product */}
                <div className={styles.field}>
                    <label className={styles.label}>Product</label>
                    <div className={styles.suggestWrap}>
                        <input
                            className={styles.input}
                            placeholder="Search product"
                            value={productQuery}
                            onChange={e => {
                                setProductQuery(e.target.value);
                                setSelectedProduct(null);
                            }}
                        />

                        {products.length > 0 && (
                            <div className={styles.suggestBox}>
                                {products.map(p => (
                                    <div
                                        key={p.p_id}
                                        className={styles.suggestItem}
                                        onMouseDown={() => {
                                            setSelectedProduct(p);
                                            setProductQuery(p.product_name);
                                            setProducts([]);
                                        }}
                                    >
                                        <b>{p.product_name}</b>
                                        <span>{p.barcode}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quantity */}
                <div className={styles.field}>
                    <label className={styles.label}>Quantity</label>
                    <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                    />
                </div>

                {/* Subtype */}
                <div className={styles.field}>
                    <label className={styles.label}>Part / Subtype (optional)</label>
                    <input
                        className={styles.input}
                        placeholder="e.g. cover, handle"
                        value={subtype}
                        onChange={e => setSubtype(e.target.value)}
                    />
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.submit}
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Submit Return"}
                    </button>
                </div>

                {msg && <div className={styles.msg}>{msg}</div>}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
