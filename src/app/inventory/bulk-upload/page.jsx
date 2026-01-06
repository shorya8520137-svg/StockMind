"use client";

import InventoryEntry from "../selftransfer/InventoryEntry.jsx";
import { useRouter } from "next/navigation";

export default function BulkUploadPage() {
    const router = useRouter();

    const handleClose = () => {
        // Navigate back to previous page or inventory
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/inventory");
        }
    };

    return (
        <InventoryEntry onClose={handleClose} />
    );
}

