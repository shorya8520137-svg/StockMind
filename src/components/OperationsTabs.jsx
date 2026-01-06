"use client";

import React, { useState } from "react";
import { X, Package, Truck, RotateCcw, AlertTriangle, Upload, ArrowRightLeft } from "lucide-react";
import DispatchForm from "@/app/order/dispatch/DispatchForm";
import InventoryEntry from "@/app/inventory/selftransfer/InventoryEntry";
import DamageRecoveryModal from "@/app/inventory/selftransfer/DamageRecoveryModal";
import ReturnModal from "@/app/inventory/selftransfer/ReturnModal";
import TransferForm from "@/app/products/TransferForm";
import styles from "./OperationsTabs.module.css";

const OPERATIONS = [
    {
        id: "dispatch",
        label: "Dispatch",
        icon: Truck,
        color: "#3b82f6"
    },
    {
        id: "transfer",
        label: "Self Transfer",
        icon: ArrowRightLeft,
        color: "#8b5cf6"
    },
    {
        id: "damage",
        label: "Damage",
        icon: AlertTriangle,
        color: "#ef4444"
    },
    {
        id: "return",
        label: "Return",
        icon: RotateCcw,
        color: "#10b981"
    },
    {
        id: "recover",
        label: "Recover",
        icon: Package,
        color: "#059669"
    },
    {
        id: "bulk",
        label: "Bulk Upload",
        icon: Upload,
        color: "#f59e0b"
    }
];

export default function OperationsTabs({ isOpen, onClose, initialTab = "dispatch" }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case "dispatch":
                return <DispatchForm />;
            case "transfer":
                return <TransferForm onClose={() => {}} />;
            case "damage":
                return <DamageRecoveryModal onClose={() => {}} />;
            case "return":
                return <ReturnModal onClose={() => {}} />;
            case "recover":
                return <div className={styles.comingSoon}>Recovery operations coming soon</div>;
            case "bulk":
                return <InventoryEntry onClose={() => {}} />;
            default:
                return <DispatchForm />;
        }
    };

    return (
        <div className={styles.tabContainer}>
            {/* Tab Header */}
            <div className={styles.tabHeader}>
                <div className={styles.tabs}>
                    {OPERATIONS.map((operation) => {
                        const Icon = operation.icon;
                        return (
                            <button
                                key={operation.id}
                                className={`${styles.tab} ${activeTab === operation.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(operation.id)}
                                style={{
                                    '--tab-color': operation.color
                                }}
                            >
                                <Icon size={16} />
                                <span>{operation.label}</span>
                            </button>
                        );
                    })}
                </div>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {renderContent()}
            </div>
        </div>
    );
}