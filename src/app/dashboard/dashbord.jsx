"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import styles from "./dashboard.module.css";

const API_BASE = "https://api.hunyhuny.org/api/dashboard";

export default function Dashboard() {
    const { user, logout, hasPermission } = useAuth();
    const [kpis, setKpis] = useState(null);
    const [lineData, setLineData] = useState([]);
    const [barData, setBarData] = useState([]);
    const [activity, setActivity] = useState([]);
    const [heatmap, setHeatmap] = useState(null);
    const [filter, setFilter] = useState("week");

    /* ---------------- FETCH ALL ---------------- */

    useEffect(() => {
        fetch(`${API_BASE}/kpis`)
            .then(r => r.json())
            .then(setKpis);

        fetch(`${API_BASE}/revenue-cost`)
            .then(r => r.json())
            .then(setLineData);

        fetch(`${API_BASE}/warehouse-volume`)
            .then(r => r.json())
            .then(data =>
                setBarData(
                    data.map(d => ({ name: d.warehouse, value: d.count }))
                )
            );

        fetch(`${API_BASE}/activity`)
            .then(r => r.json())
            .then(setActivity);
    }, []);

    /* ---------------- HEATMAP ---------------- */

    useEffect(() => {
        fetch(`${API_BASE}/dispatch-heatmap?range=${filter}`)
            .then(r => r.json())
            .then(setHeatmap);
    }, [filter]);

    const maxValue = heatmap?.max || 1;

    return (
        <div className={styles.pageScroll}>
            {/* KPI ROW */}
            <section className={styles.kpis}>
                <div className={styles.kpi}><span>Orders</span><b>{kpis?.dispatches ?? "-"}</b></div>
                <div className={styles.kpi}><span>Revenue</span><b>₹{kpis?.revenue ?? "-"}</b></div>
                <div className={styles.kpi}><span>Cost</span><b>₹{kpis?.cost ?? "-"}</b></div>
                <div className={styles.kpi}><span>Profit</span><b>₹{kpis?.profit ?? "-"}</b></div>
            </section>

            {/* GRID */}
            <section className={styles.grid}>

                {/* LINE CHART */}
                <div className={`${styles.card} ${styles.span2}`}>
                    <h3>Revenue vs Cost</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Line dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                            <Line dataKey="cost" stroke="#f97316" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* HEATMAP */}
                <div className={styles.card}>
                    <div className={styles.heatHeader}>
                        <h3>Activity Heatmap</h3>
                        <select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="week">This Week</option>
                            <option value="last">Last Week</option>
                        </select>
                    </div>

                    <div className={styles.heatmap}>
                        {heatmap?.matrix?.map((row, r) =>
                            row.map((val, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    className={styles.cell}
                                    style={{
                                        background: `rgba(249,115,22,${val / maxValue})`,
                                    }}
                                >
                                    {val}
                                </div>
                            ))
                        )}
                    </div>

                    <div className={styles.legend}>
                        <span>Low</span>
                        <div />
                        <span>High</span>
                    </div>
                </div>

                {/* BAR CHART */}
                <div className={styles.card}>
                    <h3>Warehouse Volume</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* ACTIVITY */}
                <div className={styles.card}>
                    <h3>Activity</h3>
                    <ul className={styles.activity}>
                        {activity.map((a, i) => (
                            <li key={i}>{a.message}</li>
                        ))}
                    </ul>
                </div>

            </section>
        </div>
    );
}
