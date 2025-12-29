"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import styles from "./transferFIFO.module.css";

const API = "https://13-201-222-24.nip.io/api/stock";

export default function TransferFIFO({ onClose }) {
    const [mounted, setMounted] = useState(false);

    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const [sourceType, setSourceType] = useState("WAREHOUSE");
    const [destType, setDestType] = useState("WAREHOUSE");

    const [source, setSource] = useState(null);
    const [destination, setDestination] = useState(null);

    const [sourceQuery, setSourceQuery] = useState("");
    const [destQuery, setDestQuery] = useState("");

    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [productSuggestions, setProductSuggestions] = useState([]);

    const [items, setItems] = useState([
        { search: "", barcode: "", variant: "", qty: "" }
    ]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    /* ---------- SEARCH ---------- */
    async function searchLocations(q, type, setter) {
        if (!q || q.length < 2) return setter([]);
        const res = await fetch(`${API}/locations`);
        const data = await res.json();
        if (data.success) {
            setter(
                data.locations.filter(
                    l => l.type === type && l.name.toLowerCase().includes(q.toLowerCase())
                )
            );
        }
    }

    async function searchProducts(q, index) {
        if (!q || q.length < 2) return setProductSuggestions([]);
        const res = await fetch(`${API}/api/masters/products?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success) {
            setProductSuggestions(data.data.map(p => ({ ...p, index })));
        }
    }

    function updateItem(i, patch) {
        setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
    }

    function addRow() {
        setItems(prev => [...prev, { search: "", barcode: "", variant: "", qty: "" }]);
    }

    /* ---------- EXCEL ---------- */
    function downloadTemplate() {
        const ws = XLSX.utils.json_to_sheet([
            { Product: "", Variant: "", Barcode: "", Qty: "" }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transfer");
        XLSX.writeFile(wb, "transfer-template.xlsx");
    }

    function uploadExcel(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
            const wb = XLSX.read(evt.target.result, { type: "binary" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            const parsed = rows
                .map(r => ({
                    search: r.Product || "",
                    variant: r.Variant || "",
                    barcode: String(r.Barcode || "").trim(),
                    qty: r.Qty || ""
                }))
                .filter(r => r.barcode && r.qty);

            if (!parsed.length) return setMsg("Invalid Excel file");

            setItems(parsed);
            setMsg(`Loaded ${parsed.length} items from Excel`);
        };

        reader.readAsBinaryString(file);
    }

    /* ---------- SUBMIT ---------- */
    async function submit() {
        if (!reference || !source || !destination) {
            setMsg("All fields are required");
            return;
        }

        try {
            setLoading(true);
            setMsg("");

            await fetch(`${API}/transfer/self-fifo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reference,
                    source,
                    destination,
                    items: items.map(i => ({
                        barcode: i.barcode,
                        qty: Number(i.qty)
                    }))
                })
            });

            setMsg("✔ Transfer completed successfully");
        } catch {
            setMsg("Transfer failed");
        } finally {
            setLoading(false);
        }
    }

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.panel}>
                <button className={styles.close} onClick={onClose}>✕</button>

                <div className={styles.header}>Inventory Transfer (FIFO)</div>

                <div className={styles.field}>
                    <label className={styles.label}>Reference</label>
                    <input className={styles.input} value={reference} onChange={e => setReference(e.target.value)} />
                </div>

                {/* SOURCE */}
                <div className={styles.field}>
                    <label className={styles.label}>Source</label>
                    <div className={styles.row}>
                        <select className={styles.select} value={sourceType} onChange={e => setSourceType(e.target.value)}>
                            <option value="WAREHOUSE">Warehouse</option>
                            <option value="STORE">Store</option>
                        </select>

                        <div className={styles.suggestWrap}>
                            <input
                                className={styles.input}
                                placeholder="Search source"
                                value={sourceQuery}
                                onChange={e => {
                                    setSourceQuery(e.target.value);
                                    searchLocations(e.target.value, sourceType, setSourceSuggestions);
                                }}
                            />
                            {sourceSuggestions.length > 0 && (
                                <div className={styles.suggestBox}>
                                    {sourceSuggestions.map(l => (
                                        <div
                                            key={l.code}
                                            className={styles.suggestItem}
                                            onMouseDown={() => {
                                                setSource(l);
                                                setSourceQuery(`${l.name} (${l.code})`);
                                                setSourceSuggestions([]);
                                            }}
                                        >
                                            <span className={styles.primary}>{l.name}</span>
                                            <span className={styles.secondary}>{l.code}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DESTINATION */}
                <div className={styles.field}>
                    <label className={styles.label}>Destination</label>
                    <div className={styles.row}>
                        <select className={styles.select} value={destType} onChange={e => setDestType(e.target.value)}>
                            <option value="WAREHOUSE">Warehouse</option>
                            <option value="STORE">Store</option>
                        </select>

                        <div className={styles.suggestWrap}>
                            <input
                                className={styles.input}
                                placeholder="Search destination"
                                value={destQuery}
                                onChange={e => {
                                    setDestQuery(e.target.value);
                                    searchLocations(e.target.value, destType, setDestSuggestions);
                                }}
                            />
                            {destSuggestions.length > 0 && (
                                <div className={styles.suggestBox}>
                                    {destSuggestions.map(l => (
                                        <div
                                            key={l.code}
                                            className={styles.suggestItem}
                                            onMouseDown={() => {
                                                setDestination(l);
                                                setDestQuery(`${l.name} (${l.code})`);
                                                setDestSuggestions([]);
                                            }}
                                        >
                                            <span className={styles.primary}>{l.name}</span>
                                            <span className={styles.secondary}>{l.code}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BULK TRANSFER */}
                <div className={styles.excelRow}>
                    <button onClick={downloadTemplate}>Download Template</button>
                    <label className={styles.upload}>
                        Upload Excel
                        <input type="file" hidden accept=".xlsx,.xls" onChange={uploadExcel} />
                    </label>
                </div>

                {/* ITEMS */}
                <div className={styles.subHeader}>Items</div>

                {items.map((it, i) => (
                    <div key={i} className={styles.itemRow}>
                        <div className={styles.suggestWrap}>
                            <input
                                className={styles.input}
                                placeholder="Search product"
                                value={it.search}
                                onChange={e => {
                                    updateItem(i, { search: e.target.value });
                                    searchProducts(e.target.value, i);
                                }}
                            />
                            {productSuggestions.filter(p => p.index === i).length > 0 && (
                                <div className={styles.suggestBox}>
                                    {productSuggestions.filter(p => p.index === i).map(p => (
                                        <div
                                            key={p.p_id}
                                            className={styles.suggestItem}
                                            onMouseDown={() => {
                                                updateItem(i, {
                                                    search: p.product_name,
                                                    barcode: p.barcode,
                                                    variant: p.product_variant || ""
                                                });
                                                setProductSuggestions([]);
                                            }}
                                        >
                                            <span className={styles.primary}>{p.product_name}</span>
                                            <span className={styles.secondary}>{p.barcode}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input className={styles.input} value={it.variant || "—"} readOnly />
                        <input className={styles.input} value={it.barcode} readOnly />
                        <input className={styles.input} type="number" value={it.qty} onChange={e => updateItem(i, { qty: e.target.value })} />
                    </div>
                ))}

                <button className={styles.addRow} onClick={addRow}>+ Add Product</button>

                <div className={styles.footer}>
                    <button className={styles.submit} onClick={submit} disabled={loading}>
                        {loading ? "Processing…" : "Submit Transfer"}
                    </button>
                </div>

                {msg && <div className={styles.msg}>{msg}</div>}
            </div>
        </div>,
        document.body
    );
}
