"use client";
import React, { useEffect, useState } from "react";
import styles from "./dispatchForm.module.css";

/* ✅ CORRECT API BASES */
const API = "https://13-201-222-24.nip.io/api/dispatch";           // search & dropdowns
const CREATE_API = "https://13-201-222-24.nip.io/api/dispatch-beta"; // submit

export default function DispatchForm() {
    const [warehouses, setWarehouses] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [products, setProducts] = useState([{ name: "", qty: 1, suggestions: [] }]);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const initialForm = {
        orderType: "Offline",
        warehouse: "",
        orderRef: "",
        customerName: "",
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

    /* ------------------ DROPDOWNS ------------------ */
    useEffect(() => {
        fetch(`${API}/warehouses`).then(r => r.json()).then(setWarehouses);
        fetch(`${API}/logistics`).then(r => r.json()).then(setLogistics);
        fetch(`${API}/processed-persons`).then(r => r.json()).then(setExecutives);
    }, []);

    /* ------------------ PRODUCT SEARCH (FIXED) ------------------ */
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
    };

    const selectProduct = (index, value) => {
        const updated = [...products];
        updated[index].name = value;
        updated[index].suggestions = [];
        setProducts(updated);
    };

    const addProduct = () =>
        setProducts([...products, { name: "", qty: 1, suggestions: [] }]);

    const removeProduct = (i) =>
        setProducts(products.filter((_, idx) => idx !== i));

    /* ------------------ SUBMIT (ONLY BETA) ------------------ */
    const submitDispatch = async () => {
        if (loading) return;

        const payload = {
            selectedWarehouse: form.warehouse,
            selectedLogistics: form.logistics,
            selectedExecutive: form.processedBy,
            selectedPaymentMode: form.paymentMode,
            parcelType: "Forward",
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

            const res = await fetch(`${CREATE_API}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed");

            setShowSuccess(true);

            setTimeout(() => {
                setForm(initialForm);
                setProducts([{ name: "", qty: 1, suggestions: [] }]);
                setShowSuccess(false);
            }, 2000);

        } catch (err) {
            console.error(err);
            alert("Dispatch submission failed");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------ SUCCESS CARD ------------------ */
    if (showSuccess) {
        return (
            <div className={styles.page} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{
                    background: "#0e162b",
                    padding: "40px",
                    borderRadius: "14px",
                    textAlign: "center",
                    width: "420px"
                }}>
                    <h2>Order Placed Successfully</h2>
                    <p style={{ marginTop: "8px", opacity: 0.8 }}>
                        Order has been placed successfully for <b>{form.customerName}</b>
                    </p>

                    <div style={{
                        margin: "24px auto 0",
                        width: "40px",
                        height: "40px",
                        border: "4px solid rgba(255,255,255,0.2)",
                        borderTop: "4px solid #4da3ff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                    }} />

                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    /* ------------------ FORM ------------------ */
    return (
        <div className={styles.page}>
            <h2 className={styles.title}>Dispatch Entry</h2>

            <div className={styles.grid}>
                <select onChange={e => update("orderType", e.target.value)}>
                    <option>Offline</option>
                    <option>Website</option>
                </select>

                <select onChange={e => update("warehouse", e.target.value)}>
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => <option key={w}>{w}</option>)}
                </select>

                <input placeholder="Order Reference" onChange={e => update("orderRef", e.target.value)} />
                <input placeholder="Customer Name" onChange={e => update("customerName", e.target.value)} />
                <input placeholder="AWB Number" onChange={e => update("awb", e.target.value)} />

                <select onChange={e => update("logistics", e.target.value)}>
                    <option value="">Select Logistics</option>
                    {logistics.map(l => <option key={l}>{l}</option>)}
                </select>

                <select onChange={e => update("paymentMode", e.target.value)}>
                    <option>Payment Mode</option>
                    <option>COD</option>
                    <option>Prepaid</option>
                </select>

                <select onChange={e => update("processedBy", e.target.value)}>
                    <option value="">Processed By</option>
                    {executives.map(p => <option key={p}>{p}</option>)}
                </select>

                <input placeholder="Invoice Amount" onChange={e => update("invoiceAmount", e.target.value)} />
            </div>

            <div className={styles.dimGrid}>
                <input placeholder="Weight (kg)" onChange={e => update("weight", e.target.value)} />
                <input placeholder="Length (cm)" onChange={e => update("length", e.target.value)} />
                <input placeholder="Width (cm)" onChange={e => update("width", e.target.value)} />
                <input placeholder="Height (cm)" onChange={e => update("height", e.target.value)} />
            </div>

            <textarea
                className={styles.remarks}
                placeholder="Remarks"
                onChange={e => update("remarks", e.target.value)}
            />

            <h3 className={styles.section}>Products</h3>

            {products.map((p, i) => (
                <div key={i} className={styles.productRow}>
                    <div className={styles.searchBox}>
                        <input
                            placeholder="Product name / barcode"
                            value={p.name}
                            onChange={e => searchProduct(i, e.target.value)}
                        />
                        {p.suggestions.length > 0 && (
                            <div className={styles.suggestions}>
                                {p.suggestions.map(s => (
                                    <div
                                        key={s.barcode}
                                        onClick={() =>
                                            selectProduct(i, `${s.product_name} | ${s.product_variant} | ${s.barcode}`)
                                        }
                                    >
                                        {s.product_name} ({s.barcode})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <input
                        type="number"
                        placeholder="Qty"
                        value={p.qty}
                        onChange={e => {
                            const u = [...products];
                            u[i].qty = e.target.value;
                            setProducts(u);
                        }}
                    />

                    <button onClick={() => removeProduct(i)}>✕</button>
                </div>
            ))}

            <button className={styles.addBtn} onClick={addProduct}>+ Add Product</button>

            <button
                className={styles.submit}
                onClick={submitDispatch}
                disabled={loading}
            >
                {loading ? "Submitting..." : "Submit Dispatch"}
            </button>
        </div>
    );
}
