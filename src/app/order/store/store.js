"use client";

import { useState } from "react";
import styles from "./store.module.css";
import Billing from "./billing";

export default function Store() {
    const [openAction, setOpenAction] = useState(null);
    const [openBilling, setOpenBilling] = useState(false);

    const rows = [
        {
            amount: "₹ 5,799.00",
            status: "Paid",
            mode: "UPI",
            bill: "MG/24-25/1034",
            customer: "Harshit Jain",
            date: "31 Mar 2025",
        },
        {
            amount: "₹ 11,998.00",
            status: "Paid",
            mode: "Card",
            bill: "MG/24-25/1036",
            customer: "Priyanka",
            date: "31 Mar 2025",
        },
    ];

    return (
        <div className={styles.wrapper}>
            {/* TOP ACTION BAR */}
            <div className={styles.topBar}>
                <h2>Store Sales</h2>
                <button
                    className={styles.primaryBtn}
                    onClick={() => setOpenBilling(true)}
                >
                    + Create Bill
                </button>
            </div>

            {/* TABLE */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Mode</th>
                        <th>Billing #</th>
                        <th>Customer</th>
                        <th className={styles.dateHead}>
                            Date <span>⇅</span>
                        </th>
                        <th></th>
                    </tr>
                    </thead>

                    <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            <td className={styles.amount}>{row.amount}</td>
                            <td>
                                <span className={styles.paid}>{row.status}</span>
                            </td>
                            <td>
                                <span className={styles.mode}>{row.mode}</span>
                            </td>
                            <td>{row.bill}</td>
                            <td>{row.customer}</td>
                            <td className={styles.date}>{row.date}</td>

                            <td className={styles.actionCell}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() =>
                                        setOpenAction(openAction === i ? null : i)
                                    }
                                >
                                    ⋯
                                </button>

                                {openAction === i && (
                                    <div className={styles.actionMenu}>
                                        <button>View</button>
                                        <button>Send</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ BILLING (CONTROLLED PROPERLY) */}
            {openBilling && (
                <Billing onClose={() => setOpenBilling(false)} />
            )}
        </div>
    );
}
