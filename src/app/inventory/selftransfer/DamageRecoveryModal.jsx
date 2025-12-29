"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./damageRecovery.module.css";

const API = "https://13-201-222-24.nip.io/api/stock";

export default function DamageRecoveryModal({ onClose }) {
    const [locationType, setLocationType] = useState("WAREHOUSE");
    const [locationQuery, setLocationQuery] = useState("");
    const [locations, setLocations] = useState([]);
    const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
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
            activeIndex: -1,
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

        fetch(`${API}/search?q=${encodeURIComponent(locationQuery)}`)
            .then(r => r.json())
            .then(d => {
                setLocations(
                    locationType === "WAREHOUSE"
                        ? d.data.warehouses
                        : d.data.stores
                );
                setActiveLocationIndex(-1);
            });
    }, [locationQuery, locationType]);

    /* ---------------- PRODUCT SEARCH (PER ROW) ---------------- */
    function searchProduct(value, rowIndex) {
        const updated = [...rows];
        updated[rowIndex].productQuery = value;

        if (value.length < 2) {
            updated[rowIndex].products = [];
            setRows(updated);
            return;
        }

        fetch(`${API}/search?q=${encodeURIComponent(value)}`)
            .then(r => r.json())
            .then(d => {
                updated[rowIndex].products = d.data.products || [];
                updated[rowIndex].activeIndex = -1;
                setRows([...updated]);
            });
    }

    /* ---------------- KEYBOARD NAV ---------------- */
    function handleKeyNav(e, list, rowIndex) {
        if (!list.length) return;

        const updated = [...rows];

        if (e.key === "ArrowDown") {
            e.preventDefault();
            updated[rowIndex].activeIndex =
                (updated[rowIndex].activeIndex + 1) % list.length;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            updated[rowIndex].activeIndex =
                (updated[rowIndex].activeIndex - 1 + list.length) % list.length;
        }

        if (e.key === "Enter" && updated[rowIndex].activeIndex >= 0) {
            e.preventDefault();
            const p = list[updated[rowIndex].activeIndex];
            updated[rowIndex].selectedProduct = p;
            updated[rowIndex].productQuery = p.product_name;
            updated[rowIndex].products = [];
        }

        setRows(updated);
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
                validRows.map(r =>
                    fetch(`${API}/damage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            productType: r.selectedProduct.product_name,
                            barcode: r.selectedProduct.barcode,
                            inventory:
                                locationType === "WAREHOUSE"
                                    ? selectedLocation.Warehouse_name.split(" ")[0].toLowerCase()
                                    : selectedLocation.store_code.toLowerCase(),
                            actionType: action,
                            quantity: Number(r.qty),
                        }),
                    })
                )
            );

            setMsg("✔ Successfully processed");
            setTimeout(onClose, 900);

        } catch (err) {
            setMsg("Operation failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.panel}>
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
                                            setLocationQuery(l.Warehouse_name || l.store_name);
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
                                    onKeyDown={e =>
                                        handleKeyNav(e, row.products, idx)
                                    }
                                />

                                {row.products.length > 0 && (
                                    <div className={styles.suggestBox}>
                                        {row.products.map((p, i) => (
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
                                                <span className={styles.primary}>{p.product_name}</span>
                                                <span className={styles.secondary}>{p.barcode}</span>
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
                            activeIndex: -1,
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
            </div>
        </div>
    );
}
