"use client";

import Dashboard from "./dashbord";
import ProtectedRoute from "@/components/ProtectedRoute";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    );
}
