"use client";

import { useState } from "react";
import SelfTransfer from "./SelfTransfer.jsx";
import TransferForm from "../../products/TransferForm.jsx";
import SemiDial from "./SemiDial.jsx";

export default function Page() {
    const [openTransfer, setOpenTransfer] = useState(false);

    function handleCommand(cmd) {
        console.log("COMMAND:", cmd);

        if (cmd === "TRANSFER_FIFO") {
            setOpenTransfer(true);
        }
    }

    return (
        <>
            {/* Command Dialer */}
            <SemiDial onCommand={handleCommand} />

            {/* Dashboard (always visible) */}
            <SelfTransfer />

            {/* Transfer Form (ONLY on command) */}
            {openTransfer && (
                <TransferForm onClose={() => setOpenTransfer(false)} />
            )}
        </>
    );
}