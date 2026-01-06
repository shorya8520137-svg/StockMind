"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, AlertCircle, CheckCircle, X, Warehouse, Clock } from "lucide-react";
import { bulkUploadAPI } from '@/services/api';
import styles from "./inventoryEntry.module.css";

export default function InventoryEntry({ onClose }) {
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState("");
    const [dragActive, setDragActive] = useState(false);
    
    // Progress tracking states
    const [uploadProgress, setUploadProgress] = useState(null);
    const [currentItem, setCurrentItem] = useState(null);

    // Load warehouses on component mount
    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            const response = await bulkUploadAPI.getWarehouses();
            
            if (response.success) {
                setWarehouses(response.warehouses);
            } else {
                setError('Failed to load warehouses');
            }
        } catch (err) {
            console.error('Error loading warehouses:', err);
            setError('Failed to load warehouses');
        }
    };

    const downloadTemplate = () => {
        const csvContent = bulkUploadAPI.getCSVTemplate();
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "bulk-inventory-template.csv";
        a.click();

        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async () => {
        if (!selectedWarehouse) {
            setError("Please select a warehouse");
            return;
        }

        if (!file) {
            setError("Please select a file");
            return;
        }

        setLoading(true);
        setError("");
        setUploadResult(null);
        setUploadProgress(null);
        setCurrentItem(null);

        try {
            const text = await file.text();
            console.log('CSV file content preview:', text.substring(0, 500));
            console.log('CSV file total length:', text.length);
            console.log('CSV file line count:', text.split('\n').length);
            
            const rows = bulkUploadAPI.parseCSV(text, selectedWarehouse);
            console.log('Parsed rows:', rows.length);
            console.log('Sample parsed row:', rows[0]);
            
            // Debug specific rows around 1349
            if (rows.length >= 1349) {
                console.log('=== DEBUGGING ROWS AROUND 1349 ===');
                for (let i = 1346; i <= 1351 && i < rows.length; i++) {
                    console.log(`Row ${i + 1}:`, {
                        barcode: rows[i].barcode,
                        product_name: rows[i].product_name,
                        variant: rows[i].variant,
                        qty: rows[i].qty,
                        qty_type: typeof rows[i].qty
                    });
                }
                console.log('=== END DEBUG ===');
            }

            // Validate rows before upload
            const invalidRows = [];
            rows.forEach((row, index) => {
                const validation = bulkUploadAPI.validateRow(row);
                if (!validation.isValid) {
                    invalidRows.push({
                        row: index + 1,
                        errors: validation.errors,
                        data: row
                    });
                }
            });

            console.log('Validation results:', {
                totalRows: rows.length,
                invalidRows: invalidRows.length,
                sampleInvalidRow: invalidRows[0]
            });

            // Log specific problematic rows for debugging
            if (invalidRows.length > 0) {
                console.log('First 3 invalid rows details:');
                invalidRows.slice(0, 3).forEach(invalidRow => {
                    console.log(`Row ${invalidRow.row}:`, {
                        data: invalidRow.data,
                        errors: invalidRow.errors
                    });
                });
            }

            if (invalidRows.length > 0) {
                // Show detailed error information with actual data
                const errorMessage = `Found ${invalidRows.length} invalid rows. First few errors:\n` +
                    invalidRows.slice(0, 5).map(row => {
                        const dataStr = `barcode: "${row.data.barcode}", product_name: "${row.data.product_name}", variant: "${row.data.variant}", qty: ${row.data.qty} (${typeof row.data.qty})`;
                        return `Row ${row.row}: ${row.errors.join(', ')}\nData: ${dataStr}`;
                    }).join('\n\n');
                
                console.error('Validation errors:', errorMessage);
                setError(errorMessage);
                setLoading(false);
                return;
            }

            // Use the new progress-enabled upload
            const result = await bulkUploadAPI.uploadWithProgress(rows, (progressData) => {
                console.log('Progress update:', progressData);
                
                switch (progressData.type) {
                    case 'start':
                        setUploadProgress({
                            total: progressData.total,
                            current: 0,
                            percentage: 0,
                            message: progressData.message
                        });
                        break;
                        
                    case 'progress':
                        setUploadProgress({
                            total: progressData.total,
                            current: progressData.current,
                            percentage: progressData.percentage,
                            message: progressData.message
                        });
                        setCurrentItem({
                            barcode: progressData.barcode,
                            product_name: progressData.product_name
                        });
                        break;
                        
                    case 'success':
                        // Individual success - could show in a log if needed
                        break;
                        
                    case 'error':
                        if (progressData.row) {
                            // Individual row error - could show in a log if needed
                            console.warn(`Row ${progressData.row} error:`, progressData.message);
                        }
                        break;
                        
                    case 'complete':
                        setUploadProgress(null);
                        setCurrentItem(null);
                        break;
                }
            });

            if (result.success) {
                setUploadResult(result);
                setFile(null);
            } else {
                setError(result.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
            setUploadProgress(null);
            setCurrentItem(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
                setError("");
            } else {
                setError("Please upload a CSV file only");
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
                setError("");
            } else {
                setError("Please upload a CSV file only");
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && !loading) onClose();
                }}
            >
                <motion.div 
                    className={styles.panel}
                    initial={{ scale: 0.92, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 10, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {!loading && (
                        <button className={styles.close} onClick={onClose}>
                            <X size={20} />
                        </button>
                    )}

                    <div className={styles.header}>
                        <Upload size={24} />
                        Bulk Inventory Upload
                    </div>
                    <div className={styles.subHeader}>
                        Upload inventory data in bulk using CSV files
                    </div>

                    {/* Progress Display */}
                    {uploadProgress && (
                        <motion.div 
                            className={styles.progressSection}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.progressHeader}>
                                <Clock size={20} />
                                <span>Upload in Progress</span>
                            </div>
                            
                            {/* Circular Progress Counter */}
                            <div className={styles.circularProgress}>
                                <svg className={styles.progressRing} width="120" height="120">
                                    <circle
                                        className={styles.progressRingBackground}
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                        fill="transparent"
                                        r="52"
                                        cx="60"
                                        cy="60"
                                    />
                                    <circle
                                        className={styles.progressRingForeground}
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        fill="transparent"
                                        r="52"
                                        cx="60"
                                        cy="60"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - uploadProgress.percentage / 100)}`}
                                        transform="rotate(-90 60 60)"
                                    />
                                </svg>
                                <div className={styles.progressContent}>
                                    <div className={styles.progressNumber}>
                                        {uploadProgress.current}
                                    </div>
                                    <div className={styles.progressTotal}>
                                        of {uploadProgress.total}
                                    </div>
                                    <div className={styles.progressPercentage}>
                                        {uploadProgress.percentage}%
                                    </div>
                                </div>
                            </div>

                            {/* Current Item */}
                            {currentItem && (
                                <motion.div 
                                    className={styles.currentItem}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={currentItem.barcode}
                                >
                                    <div className={styles.currentItemLabel}>Processing:</div>
                                    <div className={styles.currentItemName}>{currentItem.product_name}</div>
                                    <div className={styles.currentItemBarcode}>{currentItem.barcode}</div>
                                </motion.div>
                            )}

                            <div className={styles.progressMessage}>
                                {uploadProgress.message}
                            </div>
                        </motion.div>
                    )}

                    {/* Only show form when not uploading */}
                    {!uploadProgress && (
                        <>
                            {/* Template Download */}
                            <div className={styles.templateSection}>
                                <button className={styles.templateBtn} onClick={downloadTemplate}>
                                    <Download size={16} />
                                    Download CSV Template
                                </button>
                                <p className={styles.templateNote}>
                                    Download the template to see the required format: barcode, product_name, variant, qty, unit_cost
                                </p>
                            </div>

                            {/* Warehouse Selection */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    <Warehouse size={16} />
                                    Select Warehouse *
                                </label>
                                <select
                                    className={styles.select}
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                >
                                    <option value="">Choose warehouse...</option>
                                    {warehouses.map(warehouse => (
                                        <option key={warehouse.warehouse_code} value={warehouse.warehouse_code}>
                                            {warehouse.Warehouse_name} ({warehouse.warehouse_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Upload */}
                            <div className={styles.field}>
                                <label className={styles.label}>Upload CSV File *</label>
                                <div 
                                    className={`${styles.fileDropZone} ${dragActive ? styles.dragActive : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        className={styles.fileInput}
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className={styles.fileLabel}>
                                        {file ? (
                                            <div className={styles.fileSelected}>
                                                <CheckCircle size={20} />
                                                <span>{file.name}</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFile(null);
                                                    }}
                                                    className={styles.removeFile}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.filePrompt}>
                                                <Upload size={32} />
                                                <p>Drop your CSV file here or click to browse</p>
                                                <span>Only CSV files are supported</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* Upload Result */}
                            {uploadResult && (
                                <div className={styles.resultSection}>
                                    <div className={styles.resultHeader}>
                                        <CheckCircle size={20} />
                                        Upload Complete
                                    </div>
                                    <div className={styles.resultStats}>
                                        <div className={styles.stat}>
                                            <span className={styles.statNumber}>{uploadResult.inserted}</span>
                                            <span className={styles.statLabel}>Successful</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statNumber}>{uploadResult.failed}</span>
                                            <span className={styles.statLabel}>Failed</span>
                                        </div>
                                    </div>
                                    
                                    {uploadResult.failedRows && uploadResult.failedRows.length > 0 && (
                                        <div className={styles.failedRows}>
                                            <h4>Failed Rows:</h4>
                                            {uploadResult.failedRows.map((row, index) => (
                                                <div key={index} className={styles.failedRow}>
                                                    Row {row.row}: {row.reason}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className={styles.footer}>
                                <button
                                    className={styles.submitBtn}
                                    onClick={handleFileUpload}
                                    disabled={loading || !selectedWarehouse || !file}
                                >
                                    {loading ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Upload Inventory
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
