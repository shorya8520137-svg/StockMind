'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './store.module.css';

const STORES_API =
    'https://13-201-222-24.nip.io/api/store-inventory/stores';
const INVENTORY_API =
    'https://13-201-222-24.nip.io/api/store-inventory/store/inventory';

export default function StoreInventory() {
    const [stores, setStores] = useState([]);
    const [activeStore, setActiveStore] = useState(null);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(STORES_API)
            .then(res => res.json())
            .then(res => {
                setStores(res || []);
                if (res?.length) setActiveStore(res[0]);
            });
    }, []);

    useEffect(() => {
        if (!activeStore) return;

        setLoading(true);
        fetch(`${INVENTORY_API}?store_id=${activeStore.id}`)
            .then(res => res.json())
            .then(res => setData(res || []))
            .finally(() => setLoading(false));
    }, [activeStore]);

    const filteredData = useMemo(() => {
        if (!search) return data;
        return data.filter(r =>
            r.product_name.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const kpi = useMemo(() => {
        const positive = data.filter(r => Number(r.stock) > 0);
        const zero = data.filter(r => Number(r.stock) === 0);

        return {
            positiveCount: positive.length,
            zeroCount: zero.length,
            qtySum: positive.reduce((a, b) => a + Number(b.stock), 0),
            stockValue: positive.reduce(
                (a, b) => a + Number(b.stock) * Number(b.price || 0),
                0
            ),
            stockValueWithTax: positive.reduce((a, b) => {
                const price = Number(b.price || 0);
                const tax = Number(b.tax || 0);
                return a + Number(b.stock) * (price + (price * tax) / 100);
            }, 0)
        };
    }, [data]);

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>
                {activeStore ? activeStore.store_name : 'Store Inventory'}
            </h2>

            {/* STORE PILLS */}
            <div className={styles.storePills}>
                {stores.map(store => (
                    <button
                        key={store.id}
                        className={`${styles.storePill} ${
                            activeStore?.id === store.id ? styles.storePillActive : ''
                        }`}
                        onClick={() => setActiveStore(store)}
                    >
                        {store.store_name}
                    </button>
                ))}
            </div>

            {/* KPI */}
            <div className={styles.kpiGrid}>
                <KpiCard title="Positive Stock" value={`${kpi.positiveCount} Products (${kpi.qtySum} Qty)`} className={styles.kpiGreen} />
                <KpiCard title="Zero Stock" value={`${kpi.zeroCount} Products`} className={styles.kpiYellow} />
                <KpiCard title="Stock Value" value={`₹ ${kpi.stockValue.toLocaleString()}`} className={styles.kpiBlue} />
                <KpiCard title="Stock Value (With Tax)" value={`₹ ${kpi.stockValueWithTax.toLocaleString()}`} className={styles.kpiPurple} />
            </div>

            {/* TABLE */}
            <div className={`${styles.tableCard} ${styles.darkTable}`}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>
                                <div className={styles.thItemWithSearch}>
                                    <span>Item</span>
                                    <input
                                        className={styles.headerSearch}
                                        placeholder="Search item..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <span className={styles.thIcons}>
                      <svg viewBox="0 0 24 24">
                        <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
                      </svg>
                    </span>
                                </div>
                            </th>
                            <Th label="Qty" />
                            <Th label="Purchase Price" />
                            <Th label="Sale Price" />
                            <Th label="Last Updated" />
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {!loading &&
                            filteredData.map((r, i) => (
                                <tr key={i}>
                                    <td className={styles.itemCell}>
                                        <strong>{r.product_name}</strong>
                                        <small>{r.sku}</small>
                                    </td>
                                    <td>
                      <span className={`${styles.qtyBadge} ${Number(r.stock) === 0 ? styles.qtyZero : styles.qtyPositive}`}>
                        {r.stock} PCS
                      </span>
                                    </td>
                                    <td className={styles.priceCell}>
                                        ₹ {Number(r.purchase_price || 0).toLocaleString()}
                                        <small>excl. tax</small>
                                    </td>
                                    <td className={styles.priceCell}>
                                        ₹ {Number(r.price || 0).toLocaleString()}
                                        <small>incl. tax</small>
                                    </td>
                                    <td className={styles.muted}>{r.date} {r.time}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.stockIn}>+ Stock In</button>
                                            <button className={styles.stockOut}>− Stock Out</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        {!loading && filteredData.length === 0 && (
                            <tr>
                                <td colSpan="6" className={styles.empty}>
                                    No records found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Th({ label }) {
    return (
        <th>
            <div className={styles.thContent}>
                <span>{label}</span>
                <span className={styles.thIcons}>
          <svg viewBox="0 0 24 24">
            <path d="M7 10l5-5 5 5H7zm10 4l-5 5-5-5h10z" />
          </svg>
          <svg viewBox="0 0 24 24">
            <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
          </svg>
        </span>
            </div>
        </th>
    );
}

function KpiCard({ title, value, className }) {
    return (
        <motion.div className={`${styles.kpiCard} ${className}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p>{title}</p>
            <h3>{value}</h3>
        </motion.div>
    );
}
