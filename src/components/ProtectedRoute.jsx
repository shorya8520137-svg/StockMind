"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, requiredPermission = null }) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (!loading && user && requiredPermission && !hasPermission(requiredPermission)) {
            router.push("/dashboard");
        }
    }, [user, loading, requiredPermission, hasPermission, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-slate-900 text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-slate-900 text-lg">Access Denied</div>
            </div>
        );
    }

    return <>{children}</>;
}


