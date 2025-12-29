"use client";

import { useState } from "react";
import styles from "./billing.module.css";
import CustomerDetails from "./customerDetails";

export default function Billing({ onClose }) {
    const [activeScreen, setActiveScreen] = useState("billing");
    const [invoiceDate, setInvoiceDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    /* ================= PRODUCTS ================= */
    const [products, setProducts] = useState([
        {
            name: "Product name / barcode",
            hsn: "",
            qty: 1,
            unit: "PCS",
            unitPrice: "",
            priceWithTax: "",
            discount: 0,
            total: 0,
        },
    ]);

    const updateProduct = (index, key, value) => {
        const updated = [...products];
        updated[index][key] = value;

        const price = Number(updated[index].priceWithTax || 0);
        const discount = Number(updated[index].discount || 0);
        updated[index].total = Math.max(price - discount, 0);

        setProducts(updated);
    };

    const addProduct = () => {
        setProducts([
            ...products,
            {
                name: "Product name / barcode",
                hsn: "",
                qty: 1,
                unit: "PCS",
                unitPrice: "",
                priceWithTax: "",
                discount: 0,
                total: 0,
            },
        ]);
    };

    const removeProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    /* ================= SPLIT PAYMENT ================= */
    const [payments, setPayments] = useState([
        { notes: "", amount: "", mode: "Cash" }
    ]);

    const updatePayment = (index, key, value) => {
        const updated = [...payments];
        updated[index][key] = value;
        setPayments(updated);
    };

    const addSplitPayment = () => {
        setPayments([
            ...payments,
            { notes: "", amount: "", mode: "Cash" }
        ]);
    };

    const removePayment = (index) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>

                {/* Breadcrumb */}
                <div className={styles.breadcrumb}>
                    <span
                        className={activeScreen === "billing" ? styles.activeCrumb : styles.crumb}
                        onClick={() => setActiveScreen("billing")}
                    >
                        Billing
                    </span>
                    <span className={styles.separator}>/</span>
                    <span
                        className={activeScreen === "customer" ? styles.activeCrumb : styles.crumb}
                        onClick={() => setActiveScreen("customer")}
                    >
                        Customer Details
                    </span>
                </div>

                {activeScreen === "customer" ? (
                    <CustomerDetails onBack={() => setActiveScreen("billing")} />
                ) : (
                    <>
                        {/* Header */}
                        <div className={styles.headerRow}>
                            <h2 className={styles.title}>Billing</h2>
                            <button className={styles.closeBtn} onClick={onClose}>✕</button>
                        </div>

                        {/* Meta */}
                        <div className={styles.metaRow}>
                            <input value="DHIMAN" readOnly />
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>

                        {/* Add to Bill */}
                        <div className={styles.addBillBar}>
                            <select>
                                <option>All Categories</option>
                            </select>
                            <input placeholder="Search or scan barcode for existing products" />
                            <input placeholder="Qty" />
                            <button onClick={addProduct}>+ Add to Bill</button>
                        </div>

                        {/* Product Table */}
                        <div className={styles.tableWrap}>
                            <div className={styles.tableHead}>
                                <span>Product Name</span>
                                <span>Quantity</span>
                                <span>Unit Price</span>
                                <span>Price with Tax</span>
                                <span>Discount</span>
                                <span>Total</span>
                            </div>

                            {products.map((p, i) => (
                                <div className={styles.row} key={i}>
                                    <div>
                                        <strong>{p.name}</strong>
                                        <div className={styles.muted}>HSN: {p.hsn || "-"}</div>
                                    </div>

                                    <div className={styles.qtyUnit}>
                                        <input
                                            value={p.qty}
                                            onChange={(e) => updateProduct(i, "qty", e.target.value)}
                                        />
                                        <span>PCS</span>
                                    </div>

                                    <input
                                        value={p.unitPrice}
                                        onChange={(e) => updateProduct(i, "unitPrice", e.target.value)}
                                    />

                                    <input
                                        value={p.priceWithTax}
                                        onChange={(e) => updateProduct(i, "priceWithTax", e.target.value)}
                                    />

                                    <div className={styles.discountBox}>
                                        <input
                                            value={p.discount}
                                            onChange={(e) => updateProduct(i, "discount", e.target.value)}
                                        />
                                        <span>%</span>
                                    </div>

                                    <div className={styles.total}>
                                        ₹{p.total.toFixed(2)}
                                        <button onClick={() => removeProduct(i)}>🗑</button>
                                    </div>
                                </div>
                            ))}

                            <div className={styles.tableFooter}>
                                <div>
                                    Apply discount (%) to all items?
                                    <input />
                                </div>
                                <button className={styles.outlineBtn}>+ Additional Charges</button>
                            </div>
                        </div>

                        {/* ================= PAYMENT (FIXED) ================= */}
                        <div className={styles.section}>
                            <div className={styles.paymentTop}>
                                <strong>Advance Payment</strong>
                                <label>
                                    <input type="checkbox" /> Mark as fully paid
                                </label>
                            </div>

                            {payments.map((p, i) => (
                                <div className={styles.paymentRow} key={i}>
                                    <textarea
                                        placeholder="Advance received, UTR number etc..."
                                        value={p.notes}
                                        onChange={(e) =>
                                            updatePayment(i, "notes", e.target.value)
                                        }
                                    />

                                    <input
                                        placeholder="Amount"
                                        value={p.amount}
                                        onChange={(e) =>
                                            updatePayment(i, "amount", e.target.value)
                                        }
                                    />

                                    <select
                                        value={p.mode}
                                        onChange={(e) =>
                                            updatePayment(i, "mode", e.target.value)
                                        }
                                    >
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Card</option>
                                        <option>Bank</option>
                                    </select>

                                    {payments.length > 1 && (
                                        <button onClick={() => removePayment(i)}>🗑</button>
                                    )}
                                </div>
                            ))}

                            <button
                                className={styles.outlineBtn}
                                onClick={addSplitPayment}
                            >
                                + Split Payment
                            </button>
                        </div>

                        {/* Signature */}
                        <div className={styles.section}>
                            <div className={styles.signatureBox}>
                                ✎ Add Signature to Invoice (Optional)
                            </div>
                        </div>

                        {/* Notes + Total */}
                        <div className={styles.bottomGrid}>
                            <textarea placeholder="Enter notes, thanks message, etc." />

                            <div className={styles.totalBox}>
                                <div>Taxable Amount <span>₹0.00</span></div>
                                <div>Total Tax <span>₹0.00</span></div>
                                <strong>Total Amount <span>₹0.00</span></strong>
                            </div>
                        </div>

                        {/* Centered Place Order */}
                        <div className={styles.placeOrderCenter}>
                            <button className={styles.primaryBtn}>
                                Place Order
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
