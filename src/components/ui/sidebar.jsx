"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Package,
    Truck,
    ChevronDown,
    LayoutDashboard,
    MapPin,   // ✅ NEW ICON
} from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/* ================= CONTEXT ================= */

const SidebarContext = React.createContext(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }
    return context;
}

/* ================= PROVIDER ================= */

const SidebarProvider = ({ children }) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    return (
        <SidebarContext.Provider value={{ isMobile, openMobile, setOpenMobile }}>
            <div className="flex min-h-screen w-full bg-[#020617] text-slate-200">
                {children}
            </div>
        </SidebarContext.Provider>
    );
};

/* ================= SIDEBAR ================= */

const Sidebar = ({ children }) => {
    const { isMobile, openMobile, setOpenMobile } = useSidebar();

    if (isMobile) {
        return (
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetContent className="w-64 p-0 bg-[#020617]">
                    {children}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#020617] flex flex-col">
            {children}
        </aside>
    );
};

/* ================= BASIC BLOCKS ================= */

const SidebarContent = ({ children }) => (
    <div className="flex flex-1 flex-col">{children}</div>
);

const SidebarMenu = ({ children }) => (
    <ul className="flex flex-col gap-1 px-2">{children}</ul>
);

const SidebarMenuItem = ({ children }) => <li>{children}</li>;

const sidebarMenuButtonVariants = cva(
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-800 transition-colors",
    {
        variants: {
            active: {
                true: "bg-slate-800 font-medium",
            },
        },
    }
);

const SidebarMenuButton = ({ asChild, className, active, ...props }) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(sidebarMenuButtonVariants({ active }), className)}
            {...props}
        />
    );
};

/* ================= MENU ================= */

const InventoryMenu = () => {
    const pathname = usePathname();

    const isInventoryRoute = pathname.startsWith("/inventory");
    const isOrdersRoute = pathname.startsWith("/order");
    const isTrackingRoute = pathname.startsWith("/tracking"); // ✅ NEW

    const [inventoryOpen, setInventoryOpen] = React.useState(isInventoryRoute);
    const [ordersOpen, setOrdersOpen] = React.useState(isOrdersRoute);

    React.useEffect(() => {
        if (isInventoryRoute) setInventoryOpen(true);
    }, [isInventoryRoute]);

    React.useEffect(() => {
        if (isOrdersRoute) setOrdersOpen(true);
    }, [isOrdersRoute]);

    return (
        <div className="flex flex-col h-full">

            {/* HEADER */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                    A
                </div>
                <div>
                    <div className="text-sm font-semibold">Acme Inc</div>
                    <div className="text-xs text-slate-400">Enterprise</div>
                </div>
            </div>

            {/* MENU */}
            <SidebarContent>
                <SidebarMenu>

                    {/* DASHBOARD */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            active={pathname === "/dashboard"}
                        >
                            <Link href="/dashboard">
                                <LayoutDashboard size={16} />
                                Dashboard
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* ✅ TRACKING (NEW TAB) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            active={isTrackingRoute}
                        >
                            <Link href="/tracking">
                                <MapPin size={16} />
                                Tracking
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* INVENTORY */}
                    <SidebarMenuItem>
                        <div className="flex items-center">
                            <SidebarMenuButton
                                asChild
                                className="flex-1"
                                active={isInventoryRoute}
                            >
                                <Link href="/inventory">
                                    <Package size={16} />
                                    Inventory
                                </Link>
                            </SidebarMenuButton>

                            <button
                                onClick={() => setInventoryOpen(!inventoryOpen)}
                                className="px-2 text-slate-400 hover:text-white"
                            >
                                <ChevronDown
                                    size={16}
                                    className={cn(
                                        "transition-transform",
                                        inventoryOpen && "rotate-180"
                                    )}
                                />
                            </button>
                        </div>
                    </SidebarMenuItem>

                    {inventoryOpen && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="ml-6"
                                    active={pathname === "/inventory/store"}
                                >
                                    <Link href="/inventory/store">Store Inventory</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="ml-6"
                                    active={pathname === "/inventory/selftransfer"}
                                >
                                    <Link href="/inventory/selftransfer">Self Transfer</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}

                    {/* ORDERS */}
                    <SidebarMenuItem>
                        <div className="flex items-center">
                            <SidebarMenuButton
                                asChild
                                className="flex-1"
                                active={isOrdersRoute}
                            >
                                <Link href="/order">
                                    <Truck size={16} />
                                    Orders
                                </Link>
                            </SidebarMenuButton>

                            <button
                                onClick={() => setOrdersOpen(!ordersOpen)}
                                className="px-2 text-slate-400 hover:text-white"
                            >
                                <ChevronDown
                                    size={16}
                                    className={cn(
                                        "transition-transform",
                                        ordersOpen && "rotate-180"
                                    )}
                                />
                            </button>
                        </div>
                    </SidebarMenuItem>

                    {ordersOpen && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="ml-6"
                                    active={pathname === "/order/dispatch"}
                                >
                                    <Link href="/order/dispatch">Dispatch</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="ml-6"
                                    active={pathname === "/order/websiteorder"}
                                >
                                    <Link href="/order/websiteorder">Website Orders</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="ml-6"
                                    active={pathname === "/order/store"}
                                >
                                    <Link href="/order/store">Store</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}

                </SidebarMenu>
            </SidebarContent>

            {/* FOOTER */}
            <div className="px-4 py-3 border-t border-slate-800">
                <div className="text-sm">shadcn</div>
                <div className="text-xs text-slate-400">m@example.com</div>
            </div>

        </div>
    );
};

/* ================= EXPORTS ================= */

export {
    Sidebar,
    SidebarProvider,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    InventoryMenu,
    useSidebar,
};
