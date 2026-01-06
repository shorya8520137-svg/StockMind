"use client";

import DamageRecoveryModal from "../selftransfer/DamageRecoveryModal.jsx";
import { useRouter } from "next/navigation";

export default function DamagePage() {
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
        <DamageRecoveryModal onClose={handleClose} />
    );
}

