"use client";

import ReturnModal from "../selftransfer/ReturnModal.jsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReturnPage() {
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
        <ReturnModal onClose={handleClose} />
    );
}

