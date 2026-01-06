"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./order.module.css";
import ChatUI from "./chatui";

const PAGE_SIZE = 12;

export default function OrderSheet() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Timeline modal states
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const [tokens, setTokens] = useState([]);
    const [input, setInput] = useState("");
    const [page, setPage] = useState(1);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    
    // Remarks editing state
    const [editingRemark, setEditingRemark] = useState(null);
    const [remarkValues, setRemarkValues] = useState({});
    const [savingRemark, setSavingRemark] = useState(null);

    // Export functionality state
    const [isExporting, setIsExporting] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [exporting, setExporting] = useState(false);

    // Status update state
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [openStatusDropdown, setOpenStatusDropdown] = useState(null);

    const statusOptions = [
        { value: 'Pending', label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
        { value: 'Processing', label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
        { value: 'Confirmed', label: 'Confirmed', color: '#10b981', bg: '#d1fae5' },
        { value: 'Packed', label: 'Packed', color: '#6366f1', bg: '#e0e7ff' },
        { value: 'Dispatched', label: 'Dispatched', color: '#ec4899', bg: '#fce7f3' },
        { value: 'In Transit', label: 'In Transit', color: '#f97316', bg: '#fed7aa' },
        { value: 'Out for Delivery', label: 'Out for Delivery', color: '#14b8a6', bg: '#ccfbf1' },
        { value: 'Delivered', label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
        { value: 'Cancelled', label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
        { value: 'Returned', label: 'Returned', color: '#8b5cf6', bg: '#ede9fe' }
    ];

    const searchRef = useRef(null);

    // Fetch orders from API
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Use the updated dispatch tracking API
            const response = await fetch('https://13-201-222-24.nip.io/api/order-tracking');
            const data = await response.json();
            
            if (data.success) {
                // Map real dispatch data to frontend format
                const mappedOrders = data.data.map(dispatch => ({
                    id: dispatch.id,
                    customer: dispatch.customer,
                    product_name: dispatch.product_name,
                    quantity: dispatch.qty,
                    dimensions: `${dispatch.length || 0}x${dispatch.width || 0}x${dispatch.height || 0}`,
                    awb: dispatch.awb,
                    order_ref: dispatch.order_ref,
                    warehouse: dispatch.warehouse,
                    status: dispatch.status,
                    payment_mode: dispatch.payment_mode,
                    invoice_amount: dispatch.invoice_amount,
                    timestamp: dispatch.timestamp,
                    remark: dispatch.remarks || "",
                    damage_count: dispatch.damage_count || 0,
                    return_count: 0, // Not tracked in warehouse_dispatch
                    recovery_count: dispatch.recovery_count || 0,
                    // Additional dispatch-specific fields
                    barcode: dispatch.barcode,
                    variant: dispatch.variant,
                    logistics: dispatch.logistics,
                    parcel_type: dispatch.parcel_type,
                    actual_weight: dispatch.actual_weight,
                    processed_by: dispatch.processed_by,
                    current_stock: dispatch.current_stock || 0,
                    total_stock: dispatch.current_stock || 0, // Same as current for now
                    cost: dispatch.selling_price || dispatch.invoice_amount || 0
                }));
                setOrders(mappedOrders);
                
                // Initialize warehouse selection
                const uniqueWarehouses = [...new Set(mappedOrders.map(order => order.warehouse).filter(Boolean))];
                if (uniqueWarehouses.length > 0 && selectedWarehouses.length === 0) {
                    setSelectedWarehouses(uniqueWarehouses);
                }
            } else {
                setError('Failed to load dispatches');
            }
        } catch (err) {
            console.error('Error fetching dispatches:', err);
            setError('Failed to load dispatches');
        } finally {
            setLoading(false);
        }
    };

    // Timeline functions
    const openTimeline = async (order) => {
        setSelectedOrder(order);
        setShowTimeline(true);
        setTimelineLoading(true);
        
        try {
            const response = await fetch(`https://13-201-222-24.nip.io/api/order-tracking/${order.id}/timeline`);
            const data = await response.json();
            
            if (data.success) {
                setTimelineData(data.data?.timeline || []);
            } else {
                setTimelineData([]);
            }
        } catch (error) {
            console.error('Error loading timeline:', error);
            setTimelineData([]);
        } finally {
            setTimelineLoading(false);
        }
    };

    const closeTimeline = () => {
        setShowTimeline(false);
        setSelectedOrder(null);
        setTimelineData([]);
    };

    // Suggestions for search
    useEffect(() => {
        if (!input.trim()) {
            setSuggestions([]);
            setShowSuggest(false);
            return;
        }

        const t = setTimeout(() => {
            try {
                // Generate suggestions from existing orders
                const allSuggestions = orders.flatMap(order => [
                    order.customer,
                    order.product_name,
                    order.awb,
                    order.order_ref,
                    order.warehouse,
                    order.status
                ]).filter(Boolean);
                
                const filtered = [...new Set(allSuggestions)]
                    .filter(item => item.toLowerCase().includes(input.toLowerCase()))
                    .slice(0, 5);
                    
                setSuggestions(filtered);
                setShowSuggest(filtered.length > 0);
            } catch {
                setShowSuggest(false);
            }
        }, 250);

        return () => clearTimeout(t);
    }, [input, orders]);

    // Search functionality
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Token search
            const searchText = `${order.customer} ${order.product_name} ${order.awb} ${order.order_ref} ${order.warehouse} ${order.status}`.toLowerCase();
            const tokenMatch = tokens.length === 0 || tokens.every(token => searchText.includes(token.toLowerCase()));
            
            // Date filter
            if (!tokenMatch) return false;
            if (!order.timestamp) return true;
            
            const orderDate = new Date(order.timestamp);
            if (fromDate && orderDate < new Date(fromDate)) return false;
            if (toDate && orderDate > new Date(toDate)) return false;
            
            return true;
        });
    }, [orders, tokens, fromDate, toDate]);

    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredOrders.slice(start, start + PAGE_SIZE);
    }, [filteredOrders, page]);

    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

    // Add token
    const addToken = (value) => {
        const v = value.trim();
        if (!v) return;
        if (!tokens.includes(v)) setTokens([...tokens, v]);
        setInput("");
        setShowSuggest(false);
    };

    // Remove token
    const removeToken = (t) => {
        setTokens(tokens.filter((x) => x !== t));
    };

    // Remarks handling functions
    const handleRemarkEdit = (orderId, currentRemark) => {
        setEditingRemark(orderId);
        setRemarkValues(prev => ({
            ...prev,
            [orderId]: currentRemark || ""
        }));
    };

    const handleRemarkChange = (orderId, value) => {
        setRemarkValues(prev => ({
            ...prev,
            [orderId]: value
        }));
    };

    const saveRemark = async (orderId) => {
        const remarkText = remarkValues[orderId] || "";
        setSavingRemark(orderId);
        
        try {
            // Update local state immediately for better UX
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, remark: remarkText }
                    : order
            ));
            
            setSuccessMsg("Remark updated successfully");
            setTimeout(() => setSuccessMsg(""), 2000);
        } catch (error) {
            console.error("Failed to save remark:", error);
            setSuccessMsg("Failed to update remark");
            setTimeout(() => setSuccessMsg(""), 2000);
        } finally {
            setSavingRemark(null);
            setEditingRemark(null);
        }
    };

    const cancelRemarkEdit = () => {
        setEditingRemark(null);
        setRemarkValues({});
    };

    // Status update function
    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(orderId);
        setOpenStatusDropdown(null);
        
        try {
            // Update local state
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, status: newStatus }
                    : order
            ));
            
            setSuccessMsg(`Status updated to ${newStatus}`);
            setTimeout(() => setSuccessMsg(""), 2000);
        } catch (error) {
            console.error("Failed to update status:", error);
            setSuccessMsg("Failed to update status");
            setTimeout(() => setSuccessMsg(""), 2000);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusConfig = (status) => {
        return statusOptions.find(option => option.value === status) || statusOptions[0];
    };

    // Export functionality
    const getUniqueWarehouses = () => {
        return [...new Set(orders.map(order => order.warehouse).filter(Boolean))];
    };

    const handleWarehouseToggle = (warehouse) => {
        setSelectedWarehouses(prev => {
            if (prev.includes(warehouse)) {
                return prev.filter(w => w !== warehouse);
            } else {
                return [...prev, warehouse];
            }
        });
    };

    const selectAllWarehouses = () => {
        setSelectedWarehouses(getUniqueWarehouses());
    };

    const deselectAllWarehouses = () => {
        setSelectedWarehouses([]);
    };

    const exportToCSV = async () => {
        if (selectedWarehouses.length === 0) {
            alert("Please select at least one warehouse to export");
            return;
        }

        setExporting(true);
        try {
            const exportData = filteredOrders.filter(order => 
                selectedWarehouses.includes(order.warehouse)
            );

            if (exportData.length === 0) {
                alert("No orders found for selected warehouses and current filters");
                return;
            }

            const headers = [
                "Customer", "Product", "Quantity", "Dimensions", "AWB", "Order Ref", 
                "Warehouse", "Status", "Payment Mode", "Amount", "Date", "Remarks"
            ];
            
            const csvContent = [
                headers.join(","),
                ...exportData.map(order => [
                    `"${order.customer || ""}"`,
                    `"${order.product_name || ""}"`,
                    order.quantity || order.qty || 1,
                    `"${order.dimensions || 'N/A'}"`,
                    `"${order.awb || ""}"`,
                    `"${order.order_ref || ""}"`,
                    `"${order.warehouse || ""}"`,
                    `"${order.status || ""}"`,
                    `"${order.payment_mode || ""}"`,
                    order.invoice_amount || 0,
                    `"${order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: '2-digit'
                    }) : ""}"`,
                    `"${order.remark || ""}"`
                ].join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            
            const warehouseNames = selectedWarehouses.join("_");
            const fileName = selectedWarehouses.length === getUniqueWarehouses().length 
                ? `orders_all_warehouses_${new Date().toISOString().split('T')[0]}.csv`
                : `orders_${warehouseNames}_${new Date().toISOString().split('T')[0]}.csv`;
                
            link.setAttribute("download", fileName);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setShowExportDropdown(false);
            setSuccessMsg(`Exported ${exportData.length} orders successfully`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    // Delete dispatch function with stock restoration (WORKING LOGIC)
    const deleteDispatch = async (dispatchId) => {
        setDeletingId(dispatchId);
        setDeleting(true);
        
        try {
            const response = await fetch(`https://13-201-222-24.nip.io/api/order-tracking/${dispatchId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from local state
                setOrders(prev => prev.filter(order => order.id !== dispatchId));
                setSuccessMsg(`✅ Dispatch deleted successfully! Stock restored: ${data.restored_quantity || 0} units of ${data.restored_product || 'product'} to ${data.warehouse || 'warehouse'}`);
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                throw new Error(data.message || 'Failed to delete dispatch');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setSuccessMsg(`❌ Failed to delete dispatch: ${error.message}`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } finally {
            setDeleting(false);
            setDeletingId(null);
            setShowDeleteConfirm(null);
        }
    };

    const confirmDelete = (dispatch) => {
        setShowDeleteConfirm(dispatch);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openStatusDropdown && !event.target.closest(`.${styles.statusDropdownContainer}`)) {
                setOpenStatusDropdown(null);
            }
            if (showExportDropdown && !event.target.closest(`.${styles.exportDropdown}`)) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openStatusDropdown, showExportDropdown]);

    return (
        <div className={styles.container}>
            {deleting && (
                <div className={styles.centerLoader}>
                    <div className={styles.spinner} />
                </div>
            )}

            {successMsg && (
                <motion.div
                    className={styles.successToast}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                >
                    {successMsg}
                </motion.div>
            )}

            {/* Sticky Header */}
            <div className={styles.stickyHeader}>
                <header className={styles.header}>
                    <div className={styles.titleWrapper}>
                        <h1 className={styles.title}>Dispatch Orders</h1>
                        <div className={styles.stats}>
                            {filteredOrders.length} records <kbd className={styles.kbd}>/</kbd> Search
                        </div>
                    </div>
                    
                    <div className={styles.headerActions}>
                        {/* Refresh Button */}
                        <button
                            className={styles.refreshBtn}
                            onClick={fetchOrders}
                            disabled={loading}
                            title="Refresh Orders"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.65 2.35C12.2 0.9 10.2 0 8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z" fill="currentColor"/>
                            </svg>
                            Refresh
                        </button>
                        
                        {/* Download Button */}
                        <div className={styles.exportSection}>
                            <div className={styles.exportDropdown}>
                                <button
                                    className={styles.downloadBtn}
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    disabled={exporting}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 10L12 6H9V0H7V6H4L8 10ZM16 12V14C16 15.1 15.1 16 14 16H2C0.9 16 0 15.1 0 14V12C0 10.9 0.9 10 2 10H5.5L6.5 11H9.5L10.5 10H14C15.1 10 16 10.9 16 12Z" fill="currentColor"/>
                                    </svg>
                                    {exporting ? "Preparing..." : "Download"}
                                </button>
                                
                                {showExportDropdown && (
                                    <div className={styles.exportPanel}>
                                        <div className={styles.exportHeader}>
                                            <h4>Download Order Data</h4>
                                            <button
                                                className={styles.closeExport}
                                                onClick={() => setShowExportDropdown(false)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        
                                        <div className={styles.warehouseSelection}>
                                            <div className={styles.selectionActions}>
                                                <button
                                                    className={styles.selectAllBtn}
                                                    onClick={selectAllWarehouses}
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    className={styles.deselectAllBtn}
                                                    onClick={deselectAllWarehouses}
                                                >
                                                    Deselect All
                                                </button>
                                            </div>
                                            
                                            <div className={styles.warehouseList}>
                                                {getUniqueWarehouses().map((warehouse) => {
                                                    const warehouseCount = filteredOrders.filter(order => order.warehouse === warehouse).length;
                                                    return (
                                                        <label
                                                            key={warehouse}
                                                            className={styles.warehouseCheckbox}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedWarehouses.includes(warehouse)}
                                                                onChange={() => handleWarehouseToggle(warehouse)}
                                                            />
                                                            <span className={styles.checkboxLabel}>
                                                                {warehouse}
                                                                <span className={styles.warehouseCount}>({warehouseCount})</span>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        
                                        <div className={styles.exportActions}>
                                            <div className={styles.exportInfo}>
                                                {selectedWarehouses.length} warehouse(s) selected
                                            </div>
                                            <button
                                                className={styles.confirmDownloadBtn}
                                                onClick={exportToCSV}
                                                disabled={selectedWarehouses.length === 0 || exporting}
                                            >
                                                {exporting ? "Preparing..." : "Download CSV"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className={styles.statsCards}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📦</div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>{filteredOrders.length}</div>
                            <div className={styles.statLabel}>Total Orders</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🏢</div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>{getUniqueWarehouses().length}</div>
                            <div className={styles.statLabel}>Warehouses</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🚚</div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>
                                {filteredOrders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length}
                            </div>
                            <div className={styles.statLabel}>Dispatched</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>💰</div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>
                                ₹{filteredOrders.reduce((sum, o) => sum + (parseFloat(o.invoice_amount) || 0), 0).toLocaleString()}
                            </div>
                            <div className={styles.statLabel}>Total Value</div>
                        </div>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper} ref={searchRef}>
                        {tokens.map((t, i) => (
                            <span key={i} className={styles.chip} tabIndex={0}>
                                {t}
                                <button
                                    onClick={() => removeToken(t)}
                                    className={styles.chipClose}
                                    tabIndex={-1}
                                >
                                    ×
                                </button>
                            </span>
                        ))}

                        <input
                            className={styles.searchInput}
                            placeholder="Search orders (Press / to focus)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") addToken(input);
                            }}
                        />

                        {showSuggest && suggestions.length > 0 && (
                            <ul className={styles.suggestionList} role="listbox">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        role="option"
                                        onMouseDown={() => addToken(s)}
                                        className={styles.suggestionItem}
                                        tabIndex={0}
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className={styles.dateFilter}>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className={styles.dateInput}
                        />
                        <span className={styles.dateArrow}>→</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className={styles.dateInput}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={styles.scrollableContent}>
                <motion.div 
                    className={styles.tableContainer}
                    key={`${fromDate}-${toDate}-${tokens.join(',')}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading dispatches...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorState}>
                            <p>❌ {error}</p>
                            <button onClick={fetchOrders}>Retry</button>
                        </div>
                    ) : (
                        <div className={styles.tableCard}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th className={`${styles.th} ${styles.delCol}`}>
                                            Delete
                                        </th>
                                        <th className={`${styles.th} ${styles.customerCol}`}>
                                            Customer
                                        </th>
                                        <th className={styles.th}>
                                            Product
                                        </th>
                                        <th className={styles.th}>
                                            Qty
                                        </th>
                                        <th className={styles.th}>
                                            Dimensions
                                        </th>
                                        <th className={styles.th}>
                                            AWB
                                        </th>
                                        <th className={styles.th}>
                                            Order Ref
                                        </th>
                                        <th className={styles.th}>
                                            Warehouse
                                        </th>
                                        <th className={styles.th}>
                                            Status
                                        </th>
                                        <th className={styles.th}>
                                            Payment
                                        </th>
                                        <th className={styles.th}>
                                            Amount
                                        </th>
                                        <th className={styles.th}>
                                            Remarks
                                        </th>
                                        <th className={styles.th}>
                                            Date
                                        </th>
                                        <th className={styles.th}>
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <AnimatePresence mode="popLayout">
                                    {paginatedOrders.map((o, i) => (
                                        <motion.tr 
                                            key={o.id} 
                                            className={styles.tr}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: i * 0.05
                                            }}
                                        >
                                            <td className={`${styles.td} ${styles.delCol}`}>
                                                <button 
                                                    className={`${styles.deleteBtn} ${deletingId === o.id ? styles.deleting : ''}`}
                                                    onClick={() => confirmDelete(o)}
                                                    disabled={deletingId === o.id}
                                                    title={`Delete dispatch for ${o.customer}`}
                                                >
                                                    {deletingId === o.id ? (
                                                        <span className={styles.loadingSpinner}>✓</span>
                                                    ) : (
                                                        <span className={styles.deleteIcon}></span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className={`${styles.td} ${styles.customerCol}`}>
                                                <div className={styles.cellContent}>{o.customer}</div>
                                            </td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.product_name}</div></td>
                                            <td className={styles.td}>
                                                <div className={styles.qtyBadge}>{o.quantity || o.qty || 1}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.dimensionsBadge}>
                                                    {o.dimensions || 'N/A'}
                                                </div>
                                            </td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.awb}</div></td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.order_ref}</div></td>
                                            <td className={styles.td}>
                                                <span className={styles.warehouseTag}>{o.warehouse}</span>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.statusDropdownContainer}>
                                                    <button
                                                        className={styles.statusButton}
                                                        style={{
                                                            color: getStatusConfig(o.status).color,
                                                            backgroundColor: getStatusConfig(o.status).bg,
                                                            borderColor: getStatusConfig(o.status).color
                                                        }}
                                                        onClick={() => setOpenStatusDropdown(openStatusDropdown === o.id ? null : o.id)}
                                                        disabled={updatingStatus === o.id}
                                                        aria-expanded={openStatusDropdown === o.id}
                                                    >
                                                        <div className={styles.statusDot} style={{ backgroundColor: getStatusConfig(o.status).color }}></div>
                                                        {updatingStatus === o.id ? (
                                                            <span className={styles.statusLoader}>⏳</span>
                                                        ) : (
                                                            o.status
                                                        )}
                                                        <span className={styles.dropdownArrow}>▼</span>
                                                    </button>
                                                    
                                                    {openStatusDropdown === o.id && (
                                                        <div className={styles.statusDropdown}>
                                                            {statusOptions.map(option => (
                                                                <button
                                                                    key={option.value}
                                                                    className={`${styles.statusOption} ${o.status === option.value ? styles.statusOptionActive : ''}`}
                                                                    onClick={() => updateOrderStatus(o.id, option.value)}
                                                                >
                                                                    <div>
                                                                        <div className={styles.statusDot} style={{ backgroundColor: option.color }}></div>
                                                                        {option.label}
                                                                    </div>
                                                                    {o.status === option.value && (
                                                                        <span className={styles.checkIcon}>✓</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.td}><div className={styles.cellContent}>{o.payment_mode}</div></td>
                                            <td className={styles.td}>
                                                <div className={styles.amount}>₹{o.invoice_amount}</div>
                                            </td>
                                            <td className={`${styles.td} ${styles.remarkCell}`}>
                                                {editingRemark === o.id ? (
                                                    <div className={styles.remarkEditor}>
                                                        <textarea
                                                            className={styles.remarkInput}
                                                            value={remarkValues[o.id] || ''}
                                                            onChange={(e) => handleRemarkChange(o.id, e.target.value)}
                                                            placeholder="Add follow-up notes..."
                                                            rows={2}
                                                        />
                                                        <div className={styles.remarkActions}>
                                                            <button
                                                                className={styles.saveBtn}
                                                                onClick={() => saveRemark(o.id)}
                                                                disabled={savingRemark === o.id}
                                                            >
                                                                {savingRemark === o.id ? '⏳' : 'Save'}
                                                            </button>
                                                            <button
                                                                className={styles.cancelBtn}
                                                                onClick={cancelRemarkEdit}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className={styles.remarkDisplay}
                                                        onClick={() => handleRemarkEdit(o.id, o.remark)}
                                                    >
                                                        {o.remark ? (
                                                            <span className={styles.remarkText}>{o.remark}</span>
                                                        ) : (
                                                            <span className={styles.remarkPlaceholder}>Click to add notes...</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.date}>
                                                    {o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit'
                                                    }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.timelineBtn}
                                                        onClick={() => openTimeline(o)}
                                                        title="View Timeline"
                                                    >
                                                        📊 Timeline
                                                    </button>
                                                    {(o.damage_count > 0 || o.return_count > 0 || o.recovery_count > 0) && (
                                                        <div className={styles.trackingBadges}>
                                                            {o.damage_count > 0 && <span className={styles.damageBadge}>{o.damage_count}D</span>}
                                                            {o.return_count > 0 && <span className={styles.returnBadge}>{o.return_count}R</span>}
                                                            {o.recovery_count > 0 && <span className={styles.recoveryBadge}>{o.recovery_count}Rec</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div 
                    className={styles.pagination}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.button
                        className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ''}`}
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        whileHover={{ scale: page !== 1 ? 1.05 : 1 }}
                        whileTap={{ scale: page !== 1 ? 0.95 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        Prev
                    </motion.button>
                    <span className={styles.pageInfo}>{page} / {totalPages}</span>
                    <motion.button
                        className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ''}`}
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === totalPages}
                        whileHover={{ scale: page !== totalPages ? 1.05 : 1 }}
                        whileTap={{ scale: page !== totalPages ? 0.95 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        Next
                    </motion.button>
                </motion.div>
            </div>

            <ChatUI />

            {/* Individual Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <>
                    <div className={styles.modalOverlay} onClick={cancelDelete} />
                    <div className={styles.deleteModal}>
                        <div className={styles.deleteModalHeader}>
                            <h3>⚠️ Delete Dispatch</h3>
                            <button className={styles.closeBtn} onClick={cancelDelete}>✕</button>
                        </div>
                        <div className={styles.deleteModalContent}>
                            <p>Are you sure you want to delete this dispatch?</p>
                            <div className={styles.deleteDetails}>
                                <div><strong>Customer:</strong> {showDeleteConfirm.customer}</div>
                                <div><strong>Product:</strong> {showDeleteConfirm.product_name}</div>
                                <div><strong>AWB:</strong> {showDeleteConfirm.awb}</div>
                                <div><strong>Quantity:</strong> {showDeleteConfirm.quantity}</div>
                            </div>
                            <div className={styles.deleteWarning}>
                                <p>⚠️ This action will:</p>
                                <ul>
                                    <li>Permanently delete the dispatch record</li>
                                    <li>Restore {showDeleteConfirm.quantity} units to stock</li>
                                    <li>Add a reversal entry to the inventory ledger</li>
                                </ul>
                            </div>
                        </div>
                        <div className={styles.deleteModalActions}>
                            <button 
                                className={styles.cancelDeleteBtn}
                                onClick={cancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.confirmDeleteBtn}
                                onClick={() => deleteDispatch(showDeleteConfirm.id)}
                                disabled={deleting}
                            >
                                {deleting ? '⏳ Deleting...' : '🗑️ Delete & Restore Stock'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Dispatch Timeline Modal */}
            {showTimeline && (
                <>
                    <div className={styles.timelineOverlay} onClick={closeTimeline} />
                    <div className={styles.timelineModal}>
                        <div className={styles.timelineHeader}>
                            <h3>Dispatch Timeline — {selectedOrder?.awb} ({selectedOrder?.order_ref})</h3>
                            <button className={styles.closeBtn} onClick={closeTimeline}>
                                ✕
                            </button>
                        </div>
                        
                        <div className={styles.timelineContent}>
                            {/* Dispatch Summary */}
                            {selectedOrder && (
                                <div className={styles.orderSummary}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Customer:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.customer}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Product:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.product_name}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>AWB:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.awb}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Logistics:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.logistics || 'N/A'}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Quantity:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.quantity}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Status:</span>
                                        <span className={`${styles.summaryValue} ${styles.statusBadge}`}>{selectedOrder.status}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Current Stock:</span>
                                        <span className={styles.summaryValue}>{selectedOrder.current_stock || 0}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Amount:</span>
                                        <span className={styles.summaryValue}>₹{selectedOrder.invoice_amount}</span>
                                    </div>
                                </div>
                            )}

                            {timelineLoading ? (
                                <div className={styles.timelineLoading}>
                                    <div className={styles.spinner}></div>
                                    <p>Loading timeline...</p>
                                </div>
                            ) : timelineData.length === 0 ? (
                                <div className={styles.noTimelineData}>
                                    <div className={styles.emptyIcon}>📦</div>
                                    <p>No timeline data available</p>
                                </div>
                            ) : (
                                <div className={styles.timelineList}>
                                    {timelineData.map((entry, index) => (
                                        <div key={entry.id || index} className={styles.timelineItem}>
                                            <div className={styles.timelineIcon}>
                                                <div className={`${styles.timelineDot} ${styles[entry.type?.toLowerCase()]}`}></div>
                                                {index < timelineData.length - 1 && (
                                                    <div className={styles.timelineLine}></div>
                                                )}
                                            </div>
                                            <div className={styles.timelineDetails}>
                                                <div className={styles.timelineAction}>
                                                    {entry.description || entry.type || 'Dispatch Update'}
                                                </div>
                                                <div className={styles.timelineQuantity}>
                                                    Quantity: {entry.quantity || 0} ({entry.direction || 'N/A'})
                                                </div>
                                                <div className={styles.timelineMeta}>
                                                    <span>{entry.warehouse || 'Unknown Location'}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown date'}
                                                    </span>
                                                </div>
                                                {entry.reference && (
                                                    <div className={styles.timelineNotes}>
                                                        Reference: {entry.reference}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}