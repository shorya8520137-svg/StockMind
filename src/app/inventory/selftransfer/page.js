"use client";

import { useState } from "react";
import SelfTransfer from "./SelfTransfer";
import TransferFIFO from "./TransferFIFO";
import SemiDial from "./SemiDial";

export default function Page() {
    const [openFIFO, setOpenFIFO] = useState(false);

    function handleCommand(cmd) {
        console.log("COMMAND:", cmd);

        if (cmd === "TRANSFER_FIFO") {
            setOpenFIFO(true);
        }
    }

    return (
        <>
            {/* Command Dialer */}
            <SemiDial onCommand={handleCommand} />

            {/* Dashboard (always visible) */}
            <SelfTransfer />

            {/* Transfer Form (ONLY on command) */}
            {openFIFO && (
                <TransferFIFO onClose={() => setOpenFIFO(false)} />
            )}
        </>
    );
}
