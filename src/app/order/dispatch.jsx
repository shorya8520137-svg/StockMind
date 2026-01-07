"use client";

import React, { useState } from "react";
import styles from "./dispatchForm.module.css";
import { api } from "../../utils/api";

/**
 * ✅ Frontend local
 * ✅ Backend AWS
 * ❌ No window
 */
const API_BASE_URL = "https://api.hunyhuny.org";

export default function DispatchForm() {
    const initialState = {
        orderRef: "",
        customerName: "",
        awbNumber: "",
        products: [{ name: "", qty: 1 }],
    };

    const [state, setState] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [inventoryResult, setInventoryResult] = useState([]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api(
                `${API_BASE_URL}/api/dispatch-beta/create`,
                "POST",
                state
            );

            // backend expected:
            // updatedInventory: [{ name, remainingStock }]
            setInventoryResult(res?.updatedInventory || []);
            setSubmitted(true);
            setState(initialState);
        } catch (e) {
            alert("Dispatch failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= SUCCESS SCREEN ================= */
    if (submitted) {
        return (
            <div className={styles.fullPage}>
                <div className={styles.card}>
                    <img
                        src="/dispatch-form-header.jpg"
                        className={styles.image}
                        alt="Success"
                    />

                    <h2 className={styles.title}>Dispatch Submitted</h2>
                    <p className={styles.subText}>
                        Order has been dispatched successfully
                    </p>

                    <div className={styles.inventoryBox}>
                        {inventoryResult.map((p, i) => (
                            <div key={i} className={styles.inventoryRow}>
                                <span>{p.name}</span>
                                <span className={styles.stock}>
                                    Stock Left: {p.remainingStock}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        className={styles.primaryBtn}
                        onClick={() => setSubmitted(false)}
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    /* ================= FORM SCREEN ================= */
    return (
        <div className={styles.fullPage}>
            <div className={styles.card}>
                <img
                    src="/dispatch-form-header.jpg"
                    className={styles.image}
                    alt="Dispatch"
                />

                <h2 className={styles.title}>Dispatch Entry</h2>

                <input
                    className={styles.input}
                    placeholder="Order Reference"
                    value={state.orderRef}
                    onChange={(e) =>
                        setState({ ...state, orderRef: e.target.value })
                    }
                />

                <input
                    className={styles.input}
                    placeholder="Customer Name"
                    value={state.customerName}
                    onChange={(e) =>
                        setState({ ...state, customerName: e.target.value })
                    }
                />

                <input
                    className={styles.input}
                    placeholder="AWB Number"
                    value={state.awbNumber}
                    onChange={(e) =>
                        setState({ ...state, awbNumber: e.target.value })
                    }
                />

                {state.products.map((p, i) => (
                    <div key={i} className={styles.row}>
                        <input
                            className={styles.input}
                            placeholder="Product Name"
                            value={p.name}
                            onChange={(e) => {
                                const updated = [...state.products];
                                updated[i].name = e.target.value;
                                setState({ ...state, products: updated });
                            }}
                        />

                        <input
                            className={styles.qty}
                            type="number"
                            value={p.qty}
                            onChange={(e) => {
                                const updated = [...state.products];
                                updated[i].qty = e.target.value;
                                setState({ ...state, products: updated });
                            }}
                        />
                    </div>
                ))}

                <button
                    className={styles.primaryBtn}
                    disabled={loading}
                    onClick={handleSubmit}
                >
                    {loading ? "Submitting..." : "Submit Dispatch"}
                </button>
            </div>
        </div>
    );
}
