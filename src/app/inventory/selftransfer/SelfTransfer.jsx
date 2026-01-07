"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import styles from "./selfTransfer.module.css";

const API_BASE = "https://api.hunyhuny.org";

const MOVEMENT_META = {
    OPENING: { label: "Opening", color: "#22c55e" },
    SELF_TRANSFER: { label: "Self Transfer", color: "#8b5cf6" },
    DISPATCH: { label: "Dispatch", color: "#ef4444" },
    RETURN: { label: "Return", color: "#22c55e" },
    DAMAGE: { label: "Damage", color: "#f97316" },
    RECOVER: { label: "Recover", color: "#0ea5e9" }
};

export default function SelfTransfer() {
    const [ledger, setLedger] = useState([]);
    const [summary, setSummary] = useState({ total_in: 0, total_out: 0, net: 0 });
    const [selectedRef, setSelectedRef] = useState(null);

    /* LOAD DATA (UNCHANGED) */
    const loadLedger = useCallback(async () => {
        const res = await fetch(`${API_BASE}/api/inventory-ledger`);
        const data = await res.json();
        if (data.success) setLedger(data.data || []);
    }, []);

    const loadSummary = useCallback(async () => {
        const res = await fetch(`${API_BASE}/api/inventory-ledger/summary`);
        const data = await res.json();
        if (data.success) setSummary(data.data);
    }, []);

    useEffect(() => {
        loadLedger();
        loadSummary();
    }, [loadLedger, loadSummary]);

    /* GRAPH DATA */
    const graphData = useMemo(() => {
        const map = {};
        ledger.forEach(l => {
            const key = new Date(l.event_time).toISOString().slice(0, 13);
            if (!map[key]) map[key] = { time: key, net: 0 };
            map[key].net += l.direction === "IN" ? l.qty : -l.qty;
        });
        return Object.values(map);
    }, [ledger]);

    return (
        <div className={styles.page}>

            {/* SUMMARY */}
            <div className={styles.summaryGrid}>
                <div className={styles.card}>
                    <span>Total IN</span>
                    <strong className={styles.in}>+{summary.total_in}</strong>
                </div>
                <div className={styles.card}>
                    <span>Total OUT</span>
                    <strong className={styles.out}>-{summary.total_out}</strong>
                </div>
                <div className={styles.card}>
                    <span>NET</span>
                    <strong>{summary.net}</strong>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className={styles.mainGrid}>

                {/* LEFT — TIMELINE */}
                <div className={styles.timeline}>
                    <div className={styles.rail} />
                    {ledger.map((l, i) => {
                        const meta = MOVEMENT_META[l.movement_type] || {};
                        return (
                            <div
                                key={i}
                                className={styles.node}
                                onClick={() => setSelectedRef(l.reference)}
                            >
                <span
                    className={styles.dot}
                    style={{ background: meta.color }}
                />
                                <div className={styles.nodeCard}>
                                    <small>{new Date(l.event_time).toLocaleString()}</small>
                                    <strong>{meta.label}</strong>
                                    <div>{l.product_name}</div>
                                    <span>{l.warehouse}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT — GRAPH + TABLE */}
                <div className={styles.rightCol}>

                    {/* GRAPH */}
                    <div className={styles.graph}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={graphData}>
                                <XAxis dataKey="time" hide />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    dataKey="net"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* TABLE */}
                    <div className={styles.tableWrap}>
                        <table>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Product</th>
                                <th>Warehouse</th>
                                <th>Qty</th>
                                <th>Dir</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(selectedRef
                                    ? ledger.filter(l => l.reference === selectedRef)
                                    : ledger
                            ).map((r, i) => (
                                <tr key={i}>
                                    <td>{new Date(r.event_time).toLocaleString()}</td>
                                    <td style={{ color: MOVEMENT_META[r.movement_type]?.color }}>
                                        {MOVEMENT_META[r.movement_type]?.label}
                                    </td>
                                    <td>{r.product_name}</td>
                                    <td>{r.warehouse}</td>
                                    <td>{r.qty}</td>
                                    <td className={r.direction === "IN" ? styles.in : styles.out}>
                                        {r.direction}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}
