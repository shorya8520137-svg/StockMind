"use client";

import { useEffect, useState } from "react";
import styles from "./returnModal.module.css";

const API = "https://13-201-222-24.nip.io/api/returns";

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
        if (warehouseQuery.length < 2) {
            setWarehouses([]);
            return;
        }

        fetch(`${API}/suggest/warehouses?q=${warehouseQuery}`)
            .then(r => r.json())
            .then(setWarehouses)
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

        fetch(`${API}/suggest/products?q=${productQuery}`)
            .then(r => r.json())
            .then(setProducts)
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

            const res = await fetch(API, {
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
        <div className={styles.overlay}>
            <div className={styles.panel}>
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
            </div>
        </div>
    );
}
