"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./websiteorder.module.css";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

const API = "https://api.hunyhuny.org/api/website/orders";
const ROWS_PER_PAGE = 6;

export default function WebsiteOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [chips, setChips] = useState([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        fetch(`${API}?page=1&limit=100`)
            .then(r => r.json())
            .then(res => setOrders(res.orders || []))
            .finally(() => setLoading(false));
    }, []);

    /* ---------------- CHIPS ---------------- */
    const addChip = value => {
        const v = value.trim();
        if (!v || chips.includes(v)) return;
        setChips([...chips, v]);
        setSearch("");
    };

    const onKeyDown = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            addChip(search);
        }
        if (e.key === "Backspace" && !search && chips.length) {
            setChips(chips.slice(0, -1));
        }
    };

    /* ---------------- SUGGESTIONS ---------------- */
    const suggestions = useMemo(() => {
        if (!search) return [];
        const q = search.toLowerCase();
        const pool = new Set();

        orders.forEach(o => {
            if (o.customer) pool.add(o.customer);
            if (o.warehouse) pool.add(o.warehouse);
            if (o.status) pool.add(o.status);
            if (o.awb) pool.add(o.awb);
        });

        return [...pool].filter(
            v => v.toLowerCase().includes(q) && !chips.includes(v)
        ).slice(0, 6);
    }, [search, orders, chips]);

    /* ---------------- FILTER ---------------- */
    const filtered = useMemo(() => {
        return orders.filter(o => {
            const text = `${o.customer} ${o.warehouse} ${o.status} ${o.awb}`.toLowerCase();
            const chipMatch = chips.every(c => text.includes(c.toLowerCase()));

            const d = o.created_at ? new Date(o.created_at) : null;
            const after = fromDate ? d >= new Date(fromDate) : true;
            const before = toDate ? d <= new Date(toDate) : true;

            return chipMatch && after && before;
        });
    }, [orders, chips, fromDate, toDate]);

    /* ---------------- PAGINATION ---------------- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const pagedData = filtered.slice(
        (page - 1) * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE
    );

    /* ---------------- EXPORT ---------------- */
    const exportExcel = () => {
        const data = filtered.map(o => ({
            OrderID: o.id,
            Store: "Website",
            Method: o.method,
            AWB: o.awb,
            Warehouse: o.warehouse,
            Status: o.status,
            CreatedDate: o.created_at,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Website Orders");
        XLSX.writeFile(wb, "website_orders.xlsx");
    };

    return (
        <div className={styles.page}>

            {/* TOP BAR */}
            <div className={styles.topBar}>
                <div className={styles.searchBox}>
                    {chips.map(c => (
                        <span key={c} className={styles.chip}>
              {c}
                            <button onClick={() => setChips(chips.filter(x => x !== c))}>×</button>
            </span>
                    ))}

                    <input
                        value={search}
                        placeholder="Search customer, warehouse, status..."
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={onKeyDown}
                    />

                    {suggestions.length > 0 && (
                        <div className={styles.suggestions}>
                            {suggestions.map(s => (
                                <div key={s} onClick={() => addChip(s)}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.filters}>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <span>→</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />

                    <button className={styles.iconBtn} onClick={exportExcel}>
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className={styles.card}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th># Order ID</th>
                            <th>Store</th>
                            <th>Method</th>
                            <th>AWB</th>
                            <th>Warehouse</th>
                            <th>Created Date</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading && (
                            <tr><td colSpan="7" className={styles.empty}>Loading...</td></tr>
                        )}

                        {!loading && pagedData.length === 0 && (
                            <tr><td colSpan="7" className={styles.empty}>No orders found</td></tr>
                        )}

                        {pagedData.map(o => (
                            <tr key={o.id}>
                                <td>{o.id}</td>
                                <td>Website</td>
                                <td>{o.method}</td>
                                <td>{o.awb}</td>
                                <td>{o.warehouse}</td>
                                <td>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                                <td>
                    <span className={`${styles.status} ${styles[o.status?.toLowerCase().replace(" ", "")]}`}>
                      {o.status}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            <div className={styles.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
}
