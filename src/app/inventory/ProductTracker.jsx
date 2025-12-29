"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./productTracker.module.css";
import { api } from "../../utils/api";

export default function ProductTracker({
                                           barcodeOverride,
                                           warehouseFilter,
                                           onClose,
                                       }) {
    const barcode = barcodeOverride;

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* 🔍 CHIP SEARCH */
    const [input, setInput] = useState("");
    const [tokens, setTokens] = useState([]);

    /* 📅 DATE FILTER */
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [summary, setSummary] = useState({
        openingStock: 0,
        totalDispatch: 0,
        totalDamage: 0,
        totalReturn: 0,
        totalRecovery: 0,
        finalStock: 0,
    });

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        if (!barcode || !warehouseFilter) {
            setLoading(false);
            return;
        }

        let mounted = true;
        document.body.style.overflow = "hidden";

        const fetchTracker = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await api(
                    `/api/tracker/track/${encodeURIComponent(
                        barcode
                    )}?warehouse=${encodeURIComponent(warehouseFilter)}`
                );

                if (!mounted) return;

                setSummary({
                    openingStock: data.openingStock ?? 0,
                    totalDispatch: data.totalDispatch ?? 0,
                    totalDamage: data.totalDamage ?? 0,
                    totalReturn: data.totalReturn ?? 0,
                    totalRecovery: data.totalRecovery ?? 0,
                    finalStock: data.finalStock ?? 0,
                });

                setLogs(Array.isArray(data.logs) ? data.logs : []);
                setLoading(false);
            } catch (err) {
                if (mounted) {
                    setError("Failed to load tracking data");
                    setLoading(false);
                }
            }
        };

        fetchTracker();

        return () => {
            mounted = false;
            document.body.style.overflow = "auto";
        };
    }, [barcode, warehouseFilter]);

    /* ================= CHIP HANDLERS ================= */
    const addToken = (value) => {
        const v = value.trim();
        if (!v) return;
        if (!tokens.includes(v)) setTokens([...tokens, v]);
        setInput("");
    };

    const removeToken = (t) => {
        setTokens(tokens.filter((x) => x !== t));
    };

    /* ================= FILTER LOGS ================= */
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            // token filter
            const tokenMatch = tokens.every((t) =>
                Object.values(log).some((v) =>
                    String(v).toLowerCase().includes(t.toLowerCase())
                )
            );

            // date filter
            const logDate = log.timestamp?.split("T")[0];
            const afterFrom = !fromDate || logDate >= fromDate;
            const beforeTo = !toDate || logDate <= toDate;

            return tokenMatch && afterFrom && beforeTo;
        });
    }, [logs, tokens, fromDate, toDate]);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeTopBtn} onClick={onClose}>
                    ✕
                </button>

                <h2 className={styles.header}>
                    Product Tracker — <span>{barcode}</span>
                </h2>

                {/* ================= SUMMARY ================= */}
                <div className={styles.breakdownBox}>
                    <div>Opening Stock: <strong>{summary.openingStock}</strong></div>
                    <div>Dispatch: {summary.totalDispatch}</div>
                    <div>Damage: {summary.totalDamage}</div>
                    <div>Return: {summary.totalReturn}</div>
                    <div>Recover: {summary.totalRecovery}</div>
                    <div className={styles.finalStock}>
                        Final Stock: <strong>{summary.finalStock}</strong>
                    </div>
                </div>

                {/* ================= FILTER BAR (SINGLE GRID) ================= */}
                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper}>
                        {tokens.map((t, i) => (
                            <span key={i} className={styles.chip}>
                                {t}
                                <button onClick={() => removeToken(t)}>×</button>
                            </span>
                        ))}

                        <input
                            placeholder="Search type, warehouse, user, AWB…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && addToken(input)
                            }
                        />
                    </div>

                    <input
                        type="date"
                        className={styles.dateInput}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />

                    <input
                        type="date"
                        className={styles.dateInput}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>

                {/* ================= TABLE ================= */}
                <div className={styles.tableWrapper}>
                    <table className={styles.logTable}>
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>Qty</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Warehouse</th>
                            <th>By</th>
                            <th>AWB</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className={styles.status}>
                                    Loading…
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="7" className={styles.status}>
                                    {error}
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={styles.status}>
                                    No records
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, i) => {
                                const [date, time] =
                                log.timestamp?.split("T") || [];
                                return (
                                    <tr key={i}>
                                        <td>
                                                <span
                                                    className={`${styles.statusTag} ${styles[log.type]}`}
                                                >
                                                    {log.type}
                                                </span>
                                        </td>
                                        <td>{log.quantity}</td>
                                        <td>{date}</td>
                                        <td>{time?.slice(0, 8)}</td>
                                        <td>{log.warehouse || "—"}</td>
                                        <td>{log.processed_by || "—"}</td>
                                        <td>{log.awb || "—"}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
