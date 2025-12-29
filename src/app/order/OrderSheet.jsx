"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./order.module.css";
import { api } from "../../utils/api";
import ChatUI from "./chatui";

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "../../components/ui/alert-dialog";

const PAGE_SIZE = 12;

export default function OrderSheet() {
    const [orders, setOrders] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [input, setInput] = useState("");
    const [page, setPage] = useState(1);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [checkedId, setCheckedId] = useState(null);

    // ✅ NEW: loader + success message
    const [deleting, setDeleting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetchOrders([]);
    }, []);

    const fetchOrders = async (tokenList) => {
        const res = await api("/api/ordersheet-universal-search", "POST", {
            tokens: tokenList,
        });
        setOrders(Array.isArray(res) ? res : []);
        setPage(1);
        setCheckedId(null);
    };

    const addToken = (value) => {
        const v = value.trim().toLowerCase();
        if (!v || tokens.includes(v)) return;
        const updated = [...tokens, v];
        setTokens(updated);
        setInput("");
        fetchOrders(updated);
    };

    const removeToken = (t) => {
        const updated = tokens.filter((x) => x !== t);
        setTokens(updated);
        fetchOrders(updated);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const d = new Date(o.timestamp);
            if (fromDate && d < new Date(fromDate)) return false;
            if (toDate && d > new Date(toDate)) return false;
            return true;
        });
    }, [orders, fromDate, toDate]);

    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
    const paginatedOrders = filteredOrders.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    return (
        <div className={styles.container}>

            {/* 🔄 SMALL CENTER LOADER */}
            {deleting && (
                <div className={styles.centerLoader}>
                    <div className={styles.spinner} />
                </div>
            )}

            {/* ✅ SUCCESS MESSAGE */}
            {successMsg && (
                <div className={styles.successToast}>
                    {successMsg}
                </div>
            )}

            {/* FILTER BAR */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    {tokens.map((t, i) => (
                        <span key={i} className={styles.chip}>
                            {t}
                            <button onClick={() => removeToken(t)}>×</button>
                        </span>
                    ))}
                    <input
                        className={styles.searchInput}
                        placeholder="Search customer, warehouse, status, AWB…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addToken(input)}
                    />
                </div>

                <div className={styles.dateFilter}>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <span>→</span>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
            </div>

            {/* TABLE */}
            <div className={styles.tableWrapper}>
                <table className={styles.orderTable}>
                    <thead>
                    <tr>
                        <th>Delete</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>AWB</th>
                        <th>Order Ref</th>
                        <th>Warehouse</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Date</th>
                    </tr>
                    </thead>

                    <tbody>
                    {paginatedOrders.map((o) => (
                        <tr key={o.id}>
                            <td>
                                <AlertDialog
                                    open={checkedId === o.id}
                                    onOpenChange={(open) =>
                                        setCheckedId(open ? o.id : null)
                                    }
                                >
                                    <AlertDialogTrigger asChild>
                                        <input
                                            type="checkbox"
                                            checked={checkedId === o.id}
                                            onChange={() => setCheckedId(o.id)}
                                        />
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Do you want to delete this order?
                                                <br />
                                                <b>{o.product_name}</b>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                onClick={() => setCheckedId(null)}
                                            >
                                                Cancel
                                            </AlertDialogCancel>

                                            <AlertDialogAction
                                                onClick={async () => {
                                                    setDeleting(true);
                                                    setCheckedId(null);

                                                    await api(
                                                        `/api/orders/delete/${o.warehouse}/${o.id}`,
                                                        "DELETE"
                                                    );

                                                    setTimeout(async () => {
                                                        setDeleting(false);
                                                        setSuccessMsg(
                                                            `${o.product_name} deleted successfully`
                                                        );

                                                        await fetchOrders(tokens);

                                                        setTimeout(() => {
                                                            setSuccessMsg("");
                                                        }, 2000);
                                                    }, 1000);
                                                }}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </td>

                            <td>{o.customer}</td>
                            <td>{o.product_name}</td>
                            <td>{o.awb}</td>
                            <td>{o.order_ref}</td>
                            <td>{o.warehouse}</td>
                            <td>
                                    <span className={`${styles.statusBadge} ${styles[o.status]}`}>
                                        {o.status}
                                    </span>
                            </td>
                            <td>{o.payment_mode}</td>
                            <td>₹{o.invoice_amount}</td>
                            <td>{new Date(o.timestamp).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className={styles.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>{page} / {totalPages || 1}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>

            <ChatUI />
        </div>
    );
}
