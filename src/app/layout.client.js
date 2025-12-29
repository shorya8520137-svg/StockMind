"use client";

import { useState } from "react";
import "react-chat-elements/dist/main.css";

import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    InventoryMenu,
} from "@/components/ui/sidebar";

import SemiDial from "@/app/inventory/selftransfer/SemiDial";
import TransferFIFO from "@/app/inventory/selftransfer/TransferFIFO";
import InventoryEntry from "@/app/inventory/selftransfer/InventoryEntry";
import DamageRecoveryModal from "@/app/inventory/selftransfer/DamageRecoveryModal";
import ReturnModal from "@/app/inventory/selftransfer/ReturnModal"; // ✅ RETURN MODAL

export default function ClientLayout({ children }) {
    const [openFIFO, setOpenFIFO] = useState(false);
    const [openInventoryEntry, setOpenInventoryEntry] = useState(false);
    const [openDamageRecovery, setOpenDamageRecovery] = useState(false);
    const [openReturn, setOpenReturn] = useState(false); // ✅ RETURN STATE

    function handleCommand(cmd) {
        console.log("GLOBAL COMMAND RECEIVED:", cmd);

        if (cmd === "TRANSFER_SELF") {
            setOpenFIFO(true);
        }

        if (cmd === "INVENTORY_ENTRY") {
            setOpenInventoryEntry(true);
        }

        if (cmd === "DAMAGE_RECOVERY") {
            setOpenDamageRecovery(true);
        }

        // ✅ RETURN COMMAND
        if (cmd === "RETURN_ENTRY") {
            setOpenReturn(true);
        }
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                {/* SIDEBAR */}
                <Sidebar className="shrink-0">
                    <SidebarContent>
                        <InventoryMenu />
                    </SidebarContent>
                </Sidebar>

                {/* MAIN */}
                <main className="flex-1 h-full bg-[#020617] relative">
                    {children}
                </main>

                {/* PET COMMAND */}
                <SemiDial onCommand={handleCommand} />

                {/* MODALS */}
                {openFIFO && (
                    <TransferFIFO onClose={() => setOpenFIFO(false)} />
                )}

                {openInventoryEntry && (
                    <InventoryEntry
                        onClose={() => setOpenInventoryEntry(false)}
                    />
                )}

                {openDamageRecovery && (
                    <DamageRecoveryModal
                        onClose={() => setOpenDamageRecovery(false)}
                    />
                )}

                {openReturn && (
                    <ReturnModal onClose={() => setOpenReturn(false)} />
                )}
            </div>
        </SidebarProvider>
    );
}
