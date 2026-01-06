"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./damageRecovery.module.css";

const API = "https://13-201-222-24.nip.io/api/dispatch";

export default function DamageRecoveryModal({ onClose }) {
    const [locationType, setLocationType] = useState("WAREHOUSE");
    const [locationQuery, setLocationQuery] = useState("");
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [action, setAction] = useState("damage");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const locationRef = useRef(null);

    /* ---------- MULTI PRODUCT ROWS ---------- */
    const [rows, setRows] = useState([
        {
            productQuery: "",
            products: [],
            selectedProduct: null,
            qty: 1,
        },
    ]);

    /* ---------------- LOCATION SEARCH ---------------- */
    useEffect(() => {
        if (locationQuery.length < 2) {
            setLocations([]);
            return;
        }

        fetch(`${API}/warehouses`)
            .then(r => r.json())
            .then(data => {
                const allWarehouses = Array.isArray(data) ? data : [];
                // Filter warehouses based on query and location type
                if (locationQuery.length < 2) {
                    setLocations([]);
                } else {
                    const filtered = allWarehouses
                        .map(code => ({ 
                            warehouse_code: code, 
                            Warehouse_name: code,
                            store_code: code,
                            store_name: code 
                        }))
                        .filter(w => 
                            w.warehouse_code.toLowerCase().includes(locationQuery.toLowerCase()) ||
                            w.Warehouse_name.toLowerCase().includes(locationQuery.toLowerCase())
                        );
                    setLocations(filtered);
                }
            })
            .catch(() => setLocations([]));
    }, [locationQuery, locationType]);

    /* ---------------- PRODUCT SEARCH ---------------- */
    function searchProduct(value, rowIndex) {
        const updated = [...rows];
        updated[rowIndex].productQuery = value;

        if (value.length < 2) {
            updated[rowIndex].products = [];
            setRows(updated);
            return;
        }

        fetch(`${API}/search-products?query=${encodeURIComponent(value)}`)
            .then(r => r.json())
            .then(data => {
                updated[rowIndex].products = Array.isArray(data) ? data : (data.data || []);
                setRows([...updated]);
            })
            .catch(() => {
                updated[rowIndex].products = [];
                setRows([...updated]);
            });
    }

    /* ---------------- SUBMIT ---------------- */
    async function submit() {
        if (!selectedLocation) {
            setMsg("Please select location");
            return;
        }

        const validRows = rows.filter(r => r.selectedProduct && r.qty);

        if (!validRows.length) {
            setMsg("Please select at least one product");
            return;
        }

        try {
            setLoading(true);
            setMsg("");

            await Promise.all(
                validRows.map(r => {
                    const endpoint = action === "damage" 
                        ? "https://13-201-222-24.nip.io/api/damage-recovery/damage"
                        : "https://13-201-222-24.nip.io/api/damage-recovery/recover";
                    return fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            product_type: r.selectedProduct.product_name,
                            barcode: r.selectedProduct.barcode,
                            inventory_location:
                                locationType === "WAREHOUSE"
                                    ? selectedLocation.warehouse_code
                                    : selectedLocation.store_code,
                            quantity: Number(r.qty),
                            action_type: action === "recovery" ? "recover" : action
                        }),
                    });
                })
            );

            setMsg("✔ Successfully processed");
            setTimeout(onClose, 900);

        } catch (err) {
            console.error(err);
            setMsg("Operation failed");
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

                <div className={styles.header}>Damage / Recovery</div>

                {/* LOCATION TYPE */}
                <div className={styles.field}>
                    <label className={styles.label}>Location Type</label>
                    <select
                        className={styles.select}
                        value={locationType}
                        onChange={e => {
                            setLocationType(e.target.value);
                            setLocationQuery("");
                            setSelectedLocation(null);
                        }}
                    >
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="STORE">Store</option>
                    </select>
                </div>

                {/* LOCATION SEARCH */}
                <div className={styles.field}>
                    <label className={styles.label}>{locationType}</label>
                    <div className={styles.suggestWrap}>
                        <input
                            ref={locationRef}
                            className={styles.input}
                            placeholder={`Search ${locationType.toLowerCase()}`}
                            value={locationQuery}
                            onChange={e => setLocationQuery(e.target.value)}
                        />

                        {locations.length > 0 && (
                            <div className={styles.suggestBox}>
                                {locations.map((l, i) => (
                                    <div
                                        key={i}
                                        className={styles.suggestItem}
                                        onMouseDown={() => {
                                            setSelectedLocation(l);
                                            setLocationQuery(
                                                l.Warehouse_name || l.store_name
                                            );
                                            setLocations([]);
                                        }}
                                    >
                                        <span className={styles.primary}>
                                            {l.Warehouse_name || l.store_name}
                                        </span>
                                        <span className={styles.secondary}>
                                            {l.warehouse_code || l.store_code}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCT ROWS */}
                {rows.map((row, idx) => (
                    <div key={idx}>
                        <div className={styles.field}>
                            <label className={styles.label}>Product</label>
                            <div className={styles.suggestWrap}>
                                <input
                                    className={styles.input}
                                    placeholder="Search product"
                                    value={row.productQuery}
                                    onChange={e => searchProduct(e.target.value, idx)}
                                />

                                {row.products.length > 0 && (
                                    <div className={styles.suggestBox}>
                                        {row.products.map(p => (
                                            <div
                                                key={p.p_id}
                                                className={styles.suggestItem}
                                                onMouseDown={() => {
                                                    const updated = [...rows];
                                                    updated[idx].selectedProduct = p;
                                                    updated[idx].productQuery = p.product_name;
                                                    updated[idx].products = [];
                                                    setRows(updated);
                                                }}
                                            >
                                                <span className={styles.primary}>
                                                    {p.product_name}
                                                </span>
                                                <span className={styles.secondary}>
                                                    {p.barcode}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Quantity</label>
                            <input
                                className={styles.input}
                                type="number"
                                min="1"
                                value={row.qty}
                                onChange={e => {
                                    const updated = [...rows];
                                    updated[idx].qty = e.target.value;
                                    setRows(updated);
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* ADD PRODUCT */}
                <button
                    className={styles.addRow}
                    onClick={() =>
                        setRows([...rows, {
                            productQuery: "",
                            products: [],
                            selectedProduct: null,
                            qty: 1,
                        }])
                    }
                >
                    + Add Product
                </button>

                {/* ACTION */}
                <div className={styles.actionRow}>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            checked={action === "damage"}
                            onChange={() => setAction("damage")}
                        />
                        Damage
                    </label>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            checked={action === "recovery"}
                            onChange={() => setAction("recovery")}
                        />
                        Recovery
                    </label>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.submit}
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading ? "Processing…" : "Submit"}
                    </button>
                </div>

                {msg && <div className={styles.msg}>{msg}</div>}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
