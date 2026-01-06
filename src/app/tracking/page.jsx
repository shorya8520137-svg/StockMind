"use client";

import dynamicImport from "next/dynamic";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const Dashboard = dynamicImport(
    () => import("./Dashboard"),
    { ssr: false }
);

export default function Page() {
    return <Dashboard />;
}