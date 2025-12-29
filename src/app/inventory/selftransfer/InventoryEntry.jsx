"use client";

import { useState } from "react";
import styles from "./inventoryEntry.module.css";
import InventoryTerminalOverlay from "./InventoryTerminalOverlay";

const API = "https://13-201-222-24.nip.io/api/inventory-entry";

export default function InventoryEntry({ onClose }) {
    const [warehouseInput, setWarehouseInput] = useState("");
    const [warehouseCode, setWarehouseCode] = useState("");
    const [warehouseSuggestions, setWarehouseSuggestions] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [showTerminal, setShowTerminal] = useState(false);

    async function searchWarehouse(q) {
        setWarehouseInput(q);
        setWarehouseCode("");

        if (q.length < 2) {
            setWarehouseSuggestions([]);
            return;
        }

        const res = await fetch(`${API}/warehouses/suggest?q=${q}`);
        const data = await res.json();
        setWarehouseSuggestions(data);
    }

    function downloadTemplate() {
        const csv =
            "Product,Variant,Barcode,Qty\n" +
            "Sample Product,Red,ABC123,10\n";

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "inventory-bulk-template.csv";
        a.click();

        URL.revokeObjectURL(url);
    }

    async function submit() {
        if (!warehouseCode) {
            setMsg("Warehouse is required");
            return;
        }

        if (!file) {
            setMsg("Please upload an Excel / CSV file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("warehouse", warehouseCode);

        try {
            setLoading(true);
            setMsg("");
            setShowTerminal(true);

            const res = await fetch(`${API}/inventory-entry`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || "Upload failed");
            }

            setMsg("✔ Inventory uploaded successfully");
            setFile(null);
            setWarehouseInput("");
            setWarehouseCode("");

        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.panel}>
                    <button className={styles.close} onClick={onClose}>✕</button>

                    <div className={styles.header}>Inventory Entry</div>
                    <div className={styles.subHeader}>
                        Bulk upload inventory using Excel / CSV
                    </div>

                    {/* TEMPLATE */}
                    <div className={styles.templateRow}>
                        <button className={styles.linkBtn} onClick={downloadTemplate}>
                            ⬇ Download Template
                        </button>
                    </div>

                    {/* FILE */}
                    <div className={styles.field}>
                        <label className={styles.label}>Upload File</label>
                        <div className={styles.fileBox}>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={e => setFile(e.target.files[0])}
                            />
                            {file && <span className={styles.fileName}>{file.name}</span>}
                        </div>
                    </div>

                    {/* WAREHOUSE */}
                    <div className={styles.field}>
                        <label className={styles.label}>Warehouse</label>
                        <div className={styles.suggestWrap}>
                            <input
                                className={styles.input}
                                value={warehouseInput}
                                placeholder="Search warehouse"
                                onChange={e => searchWarehouse(e.target.value)}
                            />

                            {warehouseSuggestions.length > 0 && (
                                <div className={styles.suggestBox}>
                                    {warehouseSuggestions.map(w => (
                                        <div
                                            key={w.warehouse_code}
                                            className={styles.suggestItem}
                                            onMouseDown={() => {
                                                setWarehouseInput(
                                                    `${w.warehouse_name} (${w.warehouse_code})`
                                                );
                                                setWarehouseCode(w.warehouse_code);
                                                setWarehouseSuggestions([]);
                                            }}
                                        >
                                            <span className={styles.primary}>
                                                {w.warehouse_name}
                                            </span>
                                            <span className={styles.secondary}>
                                                {w.warehouse_code}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className={styles.footer}>
                        <button
                            className={styles.submit}
                            onClick={submit}
                            disabled={loading}
                        >
                            {loading ? "Uploading…" : "Submit Inventory"}
                        </button>
                    </div>

                    {msg && <div className={styles.msg}>{msg}</div>}
                </div>
            </div>

            <InventoryTerminalOverlay
                open={showTerminal}
                warehouse={warehouseCode}
                fileName={file?.name}
                onDone={() => setShowTerminal(false)}
            />
        </>
    );
}
