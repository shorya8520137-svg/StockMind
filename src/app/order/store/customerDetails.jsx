"use client";

import { useState } from "react";
import styles from "./customerDetails.module.css";

export default function CustomerDetails({ onBack }) {
    const [openSection, setOpenSection] = useState(null);

    const toggle = (key) =>
        setOpenSection(openSection === key ? null : key);

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>

                {/* BREADCRUMB */}
                <div className={styles.breadcrumb}>
                    <span onClick={onBack} className={styles.link}>Billing</span>
                    <span>/</span>
                    <span className={styles.active}>Customer Details</span>
                </div>

                {/* HEADER */}
                <div className={styles.header}>
                    <h2>Customer Details</h2>
                    <button className={styles.primaryBtn}>Save →</button>
                </div>

                {/* BASIC DETAILS */}
                <section className={styles.card}>
                    <h4>Basic Details</h4>

                    <div className={styles.fieldSm}>
                        <label>Name *</label>
                        <input className={styles.input} placeholder="Ratan TATA" />
                    </div>

                    <div className={styles.gridRow}>
                        <div className={styles.phoneWrap}>
                            <label>Phone</label>
                            <div className={styles.phone}>
                                <select className={styles.select}><option>+91</option></select>
                                <input className={styles.input} placeholder="Phone number" />
                            </div>
                        </div>

                        <div className={styles.fieldMd}>
                            <label>Email</label>
                            <input className={styles.input} placeholder="name@example.com" />
                        </div>
                    </div>
                </section>

                {/* COMPANY DETAILS */}
                <section className={styles.card}>
                    <h4>Company Details (Optional)</h4>

                    <div className={styles.gridRow}>
                        <div className={styles.fieldMd}>
                            <label>GSTIN</label>
                            <input className={styles.input} placeholder="29AABCT1332L000" />
                        </div>
                        <button className={styles.secondaryBtn}>Fetch Details</button>
                    </div>

                    <div className={styles.fieldLg}>
                        <label>Company Name</label>
                        <input
                            className={styles.input}
                            placeholder="NEXTSPEED TECHNOLOGIES PRIVATE LIMITED"
                        />
                    </div>
                </section>

                {/* ACTION SECTIONS */}
                <section className={styles.card}>
                    <button className={styles.addBtn} onClick={() => toggle("billing")}>
                        + Billing Address
                    </button>
                    {openSection === "billing" && (
                        <div className={styles.expandGrid}>
                            <input className={styles.input} placeholder="Address Line 1" />
                            <input className={styles.input} placeholder="City" />
                            <input className={styles.input} placeholder="State" />
                            <input className={styles.input} placeholder="Pincode" />
                        </div>
                    )}

                    <button className={styles.addBtn} onClick={() => toggle("shipping")}>
                        + Shipping Address
                    </button>
                    {openSection === "shipping" && (
                        <div className={styles.expandGrid}>
                            <input className={styles.input} placeholder="Address Line 1" />
                            <input className={styles.input} placeholder="City" />
                            <input className={styles.input} placeholder="State" />
                            <input className={styles.input} placeholder="Pincode" />
                        </div>
                    )}

                    <button className={styles.addBtn} onClick={() => toggle("bank")}>
                        + Bank Details
                    </button>
                    {openSection === "bank" && (
                        <div className={styles.expandGrid}>
                            <input className={styles.input} placeholder="Account Number" />
                            <input className={styles.input} placeholder="IFSC Code" />
                            <input className={styles.input} placeholder="Bank Name" />
                            <input className={styles.input} placeholder="Branch Name" />
                        </div>
                    )}
                </section>

                {/* FOOTER */}
                <div className={styles.footer}>
                    <button className={styles.primaryBtn}>Save →</button>
                    <button className={styles.secondaryBtn} onClick={onBack}>
                        Back to Billing
                    </button>
                </div>

            </div>
        </div>
    );
}
