"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "react-chat-elements/dist/main.css";

import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    InventoryMenu,
} from "@/components/ui/sidebar";

import TopNavBar from "@/components/TopNavBar";
import { useAuth } from "@/contexts/AuthContext";
import SemiDial from "@/app/inventory/selftransfer/SemiDial";
import TransferForm from "@/app/products/TransferForm";
import DispatchForm from "@/app/order/dispatch/DispatchForm";
import DamageRecoveryModal from "@/app/inventory/selftransfer/DamageRecoveryModal";
import ReturnModal from "@/app/inventory/selftransfer/ReturnModal";
import InventoryEntry from "@/app/inventory/selftransfer/InventoryEntry";

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Don't show sidebar on login page
    const isLoginPage = pathname === "/login";

    // Redirect to login if not authenticated (except on login page)
    if (!loading && !user && !isLoginPage) {
        router.push("/login");
        return null;
    }

    // If on login page and already logged in, redirect to dashboard
    if (!loading && user && isLoginPage) {
        router.push("/dashboard");
        return null;
    }

    // Show login page without sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }
    const [openFIFO, setOpenFIFO] = useState(false);
    const [operationsOpen, setOperationsOpen] = useState(false);
    const [operationTab, setOperationTab] = useState("dispatch");

    function handleCommand(cmd) {
        if (cmd === "TRANSFER_SELF") setOpenFIFO(true);
        if (cmd === "INVENTORY_ENTRY") {
            setOperationTab("bulk");
            setOperationsOpen(true);
        }
        if (cmd === "DAMAGE_RECOVERY") {
            setOperationTab("damage");
            setOperationsOpen(true);
        }
        if (cmd === "RETURN_ENTRY") {
            setOperationTab("return");
            setOperationsOpen(true);
        }
    }

    return (
        <SidebarProvider>
            {/* 🔑 ROOT LAYOUT */}
            <div className="flex h-screen w-screen bg-slate-50">

                {/* SIDEBAR */}
                <Sidebar className="shrink-0">
                    <SidebarContent>
                        <InventoryMenu 
                            onOpenOperation={(tab) => {
                                setOperationTab(tab);
                                setOperationsOpen(true);
                            }}
                        />
                    </SidebarContent>
                </Sidebar>

                {/* 🔑 MAIN CONTENT — THIS FIXES SCROLLING */}
                <div className="flex-1 min-w-0 h-full flex flex-col">
                    {/* TOP NAVIGATION BAR */}
                    <TopNavBar />
                    
                    {/* MAIN CONTENT */}
                    <main
                        className="flex-1 min-w-0 overflow-x-auto overflow-y-auto relative"
                        style={{ backgroundColor: 'hsl(var(--background))' }}
                    >
                        {children}
                    </main>
                </div>

                {/* COMMAND UI */}
                <SemiDial onCommand={handleCommand} />

                {/* MODALS */}
                {openFIFO && <TransferForm onClose={() => setOpenFIFO(false)} />}
                
                {/* Individual Operation Modals */}
                {operationsOpen && operationTab === "dispatch" && (
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOperationsOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b bg-white">
                                <h2 className="text-lg font-semibold">Dispatch</h2>
                                <button 
                                    onClick={() => setOperationsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                                <DispatchForm />
                            </div>
                        </div>
                    </div>
                )}

                {operationsOpen && operationTab === "damage" && (
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOperationsOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b bg-white">
                                <h2 className="text-lg font-semibold">Damage / Recovery</h2>
                                <button 
                                    onClick={() => setOperationsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                                <DamageRecoveryModal onClose={() => setOperationsOpen(false)} />
                            </div>
                        </div>
                    </div>
                )}

                {operationsOpen && operationTab === "return" && (
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOperationsOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b bg-white">
                                <h2 className="text-lg font-semibold">Return</h2>
                                <button 
                                    onClick={() => setOperationsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                                <ReturnModal onClose={() => setOperationsOpen(false)} />
                            </div>
                        </div>
                    </div>
                )}

                {operationsOpen && operationTab === "recover" && (
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOperationsOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b bg-white">
                                <h2 className="text-lg font-semibold">Recover</h2>
                                <button 
                                    onClick={() => setOperationsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-8">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-4">🔧</div>
                                    <h3 className="text-lg font-medium mb-2">Recovery Operations</h3>
                                    <p>Recovery functionality coming soon...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {operationsOpen && operationTab === "bulk" && (
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOperationsOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b bg-white">
                                <h2 className="text-lg font-semibold">Bulk Upload</h2>
                                <button 
                                    onClick={() => setOperationsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                                <InventoryEntry onClose={() => setOperationsOpen(false)} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </SidebarProvider>
    );
}
