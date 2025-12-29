"use client";

import { useEffect, useState } from "react";
import styles from "./inventoryTerminal.module.css";

export default function InventoryTerminalOverlay({
                                                     visible,
                                                     rows = [],
                                                     warehouse,
                                                     onComplete
                                                 }) {
    const [logs, setLogs] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!visible) return;

        let i = 0;
        const total = rows.length;

        setLogs([
            "[INIT] Inventory bulk upload started",
            `[WAREHOUSE] ${warehouse}`,
            "----------------------------------"
        ]);

        const interval = setInterval(() => {
            if (i >= total) {
                setLogs(l => [
                    ...l,
                    "----------------------------------",
                    "[SUCCESS] Inventory entry completed"
                ]);
                clearInterval(interval);
                setTimeout(onComplete, 1200);
                return;
            }

            const r = rows[i];
            setLogs(l => [
                ...l,
                `→ Processing ${i + 1}/${total}`,
                `  Product : ${r.product}`,
                `  Barcode : ${r.code}`,
                `  Qty     : ${r.qty}`
            ]);

            setCount(i + 1);
            i++;
        }, 350);

        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.terminal}>
                <div className={styles.header}>
                    <div className={styles.loader} />
                    <span>{count} / {rows.length}</span>
                </div>

                <pre className={styles.logs}>
                    {logs.join("\n")}
                </pre>
            </div>
        </div>
    );
}
