"use client";

import { useEffect, useRef, useState } from "react";
import TrackingMap from "./TrackingMap";
import Orders from "./Order";
import "./dashboard.css";

const API_BASE = "https://13-201-222-24.nip.io";
const POLL_INTERVAL = 15000;

export default function Dashboard() {
    const [awb, setAwb] = useState("");
    const [journey, setJourney] = useState([]);

    // Left panel data
    const [progress, setProgress] = useState({
        total: 0,
        completed: 0,
        percent: 0,
    });

    const [warehouseSummary, setWarehouseSummary] = useState([]);

    const pollRef = useRef(null);

    /* ===============================
       TRACKING (SEARCH + MAP)
    =============================== */
    const fetchTracking = async () => {
        if (!awb) return;

        try {
            const res = await fetch(`${API_BASE}/api/tracking/${awb}`);
            if (!res.ok) return;

            const data = await res.json();
            setJourney(data.journey || []);
        } catch (err) {
            console.error("Tracking error:", err);
        }
    };

    useEffect(() => {
        if (!awb) return;

        fetchTracking();
        pollRef.current = setInterval(fetchTracking, POLL_INTERVAL);

        return () => clearInterval(pollRef.current);
    }, [awb]);

    /* ===============================
       TODAY'S PROGRESS
    =============================== */
    const fetchProgress = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tracking/progress`);
            if (!res.ok) return;

            const data = await res.json();
            setProgress(data);
        } catch (err) {
            console.error("Progress error:", err);
        }
    };

    /* ===============================
       WAREHOUSE SUMMARY
    =============================== */
    const fetchWarehouseSummary = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tracking/warehouse-summary`);
            if (!res.ok) return;

            const data = await res.json();
            setWarehouseSummary(data.summary || []);
        } catch (err) {
            console.error("Warehouse summary error:", err);
        }
    };

    /* ===============================
       INITIAL LOAD (LEFT PANEL)
    =============================== */
    useEffect(() => {
        fetchProgress();
        fetchWarehouseSummary();
    }, []);

    return (
        <div className="tracking-layout">
            {/* ================= LEFT PANEL ================= */}
            <aside className="left-panel">
                {/* Today's Progress */}
                <div className="progress-card">
                    <h3>Today's Progress</h3>

                    <div className="progress-bar">
                        <span style={{ width: `${progress.percent}%` }} />
                    </div>

                    <p>
                        {progress.completed} / {progress.total} dispatches (
                        {progress.percent}%)
                    </p>
                </div>

                {/* Warehouse Dispatch */}
                <div className="warehouse-card">
                    <h3>Warehouse Dispatch</h3>

                    {warehouseSummary.length === 0 ? (
                        <p>No dispatches today</p>
                    ) : (
                        <table>
                            <tbody>
                            {warehouseSummary.map((w, i) => (
                                <tr key={i}>
                                    <td>{w.warehouse}</td>
                                    <td>{w.dispatch}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </aside>

            {/* ================= RIGHT PANEL ================= */}
            <main className="right-panel">
                <TrackingMap awb={awb} setAwb={setAwb} journey={journey} />
                <Orders />
            </main>
        </div>
    );
}
