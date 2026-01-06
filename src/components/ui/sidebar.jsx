"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Package,
    Package2,
    Truck,
    ChevronDown,
    LayoutDashboard,
    MapPin,
    Menu,
    ChevronLeft,
    ChevronRight,
    Settings,
    Box,
    LogOut,
    Plus,
    Shield,
    User
} from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, PERMISSIONS } from "@/contexts/PermissionsContext";

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
    const [collapsed, setCollapsed] = React.useState(false);

    const toggleCollapse = () => setCollapsed((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ isMobile, openMobile, setOpenMobile, collapsed, toggleCollapse }}>
            <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
                {children}
            </div>
        </SidebarContext.Provider>
    );
};

/* ================= SIDEBAR ================= */

const Sidebar = ({ children }) => {
    const { isMobile, openMobile, setOpenMobile, collapsed, toggleCollapse } = useSidebar();

    if (isMobile) {
        return (
            <>
                <div className="fixed top-4 left-4 z-40 md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
                <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                    <SheetContent side="left" className="w-64 p-0 bg-white border-r border-slate-200">
                        {children}
                    </SheetContent>
                </Sheet>
            </>
        );
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 256 }}
            className="hidden md:flex flex-col border-r border-slate-200 bg-white relative shrink-0 z-30 shadow-sm"
        >
             {/* Collapse Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 text-slate-500 z-50"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            
            {children}
        </motion.aside>
    );
};

/* ================= BASIC BLOCKS ================= */

const SidebarContent = ({ children }) => (
    <div className="flex flex-1 flex-col overflow-y-auto py-4">{children}</div>
);

const SidebarMenu = ({ children }) => (
    <ul className="flex flex-col gap-1 px-3">{children}</ul>
);

const SidebarMenuItem = ({ children }) => <li>{children}</li>;

const sidebarMenuButtonVariants = cva(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
    {
        variants: {
            active: {
                true: "bg-slate-100 text-slate-900 shadow-sm",
                false: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
            },
            collapsed: {
                true: "justify-center px-2",
                false: "",
            }
        },
        defaultVariants: {
            active: false,
            collapsed: false
        }
    }
);

const SidebarMenuButton = ({ asChild, className, active, collapsed, icon: Icon, children, ...props }) => {
    const Comp = asChild ? Slot : "button";
    
    return (
        <Comp
            className={cn(sidebarMenuButtonVariants({ active, collapsed }), className)}
            {...props}
        >
             {/* If we are using asChild (Link), the immediate child is the Link. 
                But for styling, we usually put the Icon inside the Link.
                Here we assume children contains the icon + text if expanded.
             */}
             {children}
        </Comp>
    );
};

/* ================= MENU ================= */

const InventoryMenu = ({ onOpenOperation }) => {
    const pathname = usePathname();
    const { collapsed } = useSidebar();
    const { logout } = useAuth();
    const { hasPermission, userRole } = usePermissions();

    const isInventoryRoute = pathname.startsWith("/inventory");
    const isOrdersRoute = pathname.startsWith("/order");
    const isTrackingRoute = pathname.startsWith("/tracking");
    const isPermissionsRoute = pathname.startsWith("/permissions");
    const isProfileRoute = pathname.startsWith("/profile");

    // Local state for expanded submenus (only relevant when sidebar is NOT collapsed)
    const [inventoryOpen, setInventoryOpen] = React.useState(true); // Default open for visibility
    const [ordersOpen, setOrdersOpen] = React.useState(true);
    const [operationsExpanded, setOperationsExpanded] = React.useState(false);

    // Auto-expand if active (but don't auto-close if user opened it)
    React.useEffect(() => {
        if (isInventoryRoute) setInventoryOpen(true);
        if (isOrdersRoute) setOrdersOpen(true);
    }, [isInventoryRoute, isOrdersRoute]);

    // Helper for rendering Logo
    const Logo = () => (
        <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-slate-100", collapsed && "justify-center px-2")}>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900 shadow-md">
                <Box size={20} />
            </div>
            {!collapsed && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <div className="text-sm font-bold text-slate-900">Acme Inc</div>
                    <div className="text-xs text-slate-500">Enterprise</div>
                </motion.div>
            )}
        </div>
    );

    // Helper for Menu Item with Submenu
    const MenuItemWithSub = ({ 
        icon: Icon, 
        label, 
        isActive, 
        isOpen, 
        onToggle, 
        basePath, 
        children 
    }) => {
        if (collapsed) {
            // When collapsed, just show the main icon as a link to the base path
             return (
                <SidebarMenuItem>
                    <div className="relative group">
                         <Link 
                            href={basePath} 
                            className={cn(sidebarMenuButtonVariants({ active: isActive, collapsed: true }))}
                        >
                            <Icon size={20} />
                        </Link>
                        {/* Tooltip-like popup for collapsed state could go here */}
                    </div>
                </SidebarMenuItem>
            );
        }

        return (
            <SidebarMenuItem>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                        <Link 
                            href={basePath} 
                            className={cn(
                                "flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </Link>
                        <button
                            onClick={onToggle}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100"
                        >
                            <ChevronDown
                                size={16}
                                className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                            />
                        </button>
                    </div>
                    
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden ml-4 pl-3 border-l border-slate-200 space-y-1"
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SidebarMenuItem>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <Logo />

            <SidebarContent>
                <SidebarMenu>
                    
                    {/* DASHBOARD */}
                    {hasPermission(PERMISSIONS.DASHBOARD_VIEW) && (
                        <SidebarMenuItem>
                             <Link 
                                href="/dashboard" 
                                className={cn(sidebarMenuButtonVariants({ active: pathname === "/dashboard", collapsed }))}
                            >
                                <LayoutDashboard size={collapsed ? 20 : 18} />
                                {!collapsed && <span>Dashboard</span>}
                            </Link>
                        </SidebarMenuItem>
                    )}

                    {/* TRACKING */}
                    {hasPermission(PERMISSIONS.TRACKING_VIEW) && (
                        <SidebarMenuItem>
                            <Link 
                                href="/tracking" 
                                className={cn(sidebarMenuButtonVariants({ active: isTrackingRoute, collapsed }))}
                            >
                                <MapPin size={collapsed ? 20 : 18} />
                                {!collapsed && <span>Tracking</span>}
                            </Link>
                        </SidebarMenuItem>
                    )}

                    {/* PRODUCTS */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <Link 
                                href="/products" 
                                className={cn(sidebarMenuButtonVariants({ active: pathname === "/products", collapsed }))}
                            >
                                <Package2 size={collapsed ? 20 : 18} />
                                {!collapsed && <span>Products</span>}
                            </Link>
                        </SidebarMenuItem>
                    )}

                    {/* INVENTORY */}
                    {hasPermission(PERMISSIONS.INVENTORY_VIEW) && (
                        <MenuItemWithSub
                            icon={Package}
                            label="Inventory"
                            isActive={isInventoryRoute}
                            isOpen={inventoryOpen}
                            onToggle={() => setInventoryOpen(!inventoryOpen)}
                            basePath="/inventory"
                        >
                             <Link 
                                href="/inventory/store"
                                className={cn(
                                    "block rounded-md px-3 py-2 text-sm transition-colors",
                                    pathname === "/inventory/store" ? "text-slate-900 font-medium bg-slate-50" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Store Inventory
                            </Link>
                            {hasPermission(PERMISSIONS.INVENTORY_TRANSFER) && (
                                <Link 
                                    href="/inventory/selftransfer"
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors",
                                        pathname === "/inventory/selftransfer" ? "text-slate-900 font-medium bg-slate-50" : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    Self Transfer
                                </Link>
                            )}
                        </MenuItemWithSub>
                    )}

                    {/* ORDERS */}
                    {hasPermission(PERMISSIONS.ORDERS_VIEW) && (
                        <MenuItemWithSub
                            icon={Truck}
                            label="Orders"
                            isActive={isOrdersRoute}
                            isOpen={ordersOpen}
                            onToggle={() => setOrdersOpen(!ordersOpen)}
                            basePath="/order"
                        >
                            {hasPermission(PERMISSIONS.OPERATIONS_DISPATCH) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("dispatch");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    Dispatch
                                </button>
                            )}
                            <Link 
                                href="/order/websiteorder"
                                className={cn(
                                    "block rounded-md px-3 py-2 text-sm transition-colors",
                                    pathname === "/order/websiteorder" ? "text-slate-900 font-medium bg-slate-50" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Website Orders
                            </Link>
                             <Link 
                                href="/order/store"
                                className={cn(
                                    "block rounded-md px-3 py-2 text-sm transition-colors",
                                    pathname === "/order/store" ? "text-slate-900 font-medium bg-slate-50" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Store
                            </Link>
                        </MenuItemWithSub>
                    )}

                    {/* OPERATIONS */}
                    {(hasPermission(PERMISSIONS.OPERATIONS_DISPATCH) || 
                      hasPermission(PERMISSIONS.OPERATIONS_DAMAGE) || 
                      hasPermission(PERMISSIONS.OPERATIONS_RETURN) || 
                      hasPermission(PERMISSIONS.OPERATIONS_RECOVER) || 
                      hasPermission(PERMISSIONS.OPERATIONS_BULK)) && (
                        <MenuItemWithSub
                            icon={Plus}
                            label="Operations"
                            isActive={false}
                            isOpen={operationsExpanded}
                            onToggle={() => setOperationsExpanded(!operationsExpanded)}
                            basePath="#"
                        >
                            {hasPermission(PERMISSIONS.OPERATIONS_DISPATCH) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("dispatch");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    📦 Dispatch
                                </button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_DAMAGE) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("damage");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    ⚠️ Damage
                                </button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_RETURN) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("return");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    🔄 Return
                                </button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_RECOVER) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("recover");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    🔧 Recover
                                </button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_BULK) && (
                                <button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("bulk");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors w-full text-left",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    📤 Bulk Upload
                                </button>
                            )}
                        </MenuItemWithSub>
                    )}



                    {/* PERMISSIONS MANAGEMENT */}
                    {hasPermission(PERMISSIONS.SYSTEM_PERMISSIONS) && (
                        <SidebarMenuItem>
                            <Link 
                                href="/permissions" 
                                className={cn(sidebarMenuButtonVariants({ active: isPermissionsRoute, collapsed }))}
                            >
                                <Shield size={collapsed ? 20 : 18} />
                                {!collapsed && <span>Access Control</span>}
                            </Link>
                        </SidebarMenuItem>
                    )}

                    {/* PROFILE */}
                    <SidebarMenuItem>
                        <Link 
                            href="/profile" 
                            className={cn(sidebarMenuButtonVariants({ active: isProfileRoute, collapsed }))}
                        >
                            <User size={collapsed ? 20 : 18} />
                            {!collapsed && <span>My Profile</span>}
                        </Link>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarContent>

            {/* FOOTER */}
            <div className={cn("p-4 border-t border-slate-100", collapsed && "flex flex-col gap-2 items-center")}>
                {!collapsed ? (
                    <div className="space-y-2">
                        {/* User Role Display */}
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                            <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: userRole?.color || '#64748b' }}
                            >
                                {userRole?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                    {userRole?.name || 'User'}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {userRole?.permissions?.length || 0} permissions
                                </div>
                            </div>
                        </div>
                        
                        {hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <Settings size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Settings</div>
                                    <div className="text-xs text-slate-500">v1.0.0</div>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={logout}
                            className="flex items-center gap-3 w-full p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <LogOut size={16} />
                            </div>
                            <div className="text-sm font-medium">Logout</div>
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Collapsed Role Indicator */}
                        <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: userRole?.color || '#64748b' }}
                            title={`${userRole?.name || 'User'} - ${userRole?.permissions?.length || 0} permissions`}
                        >
                            {userRole?.name?.charAt(0) || 'U'}
                        </div>
                        
                        {hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                                <Settings size={16} />
                            </div>
                        )}
                        
                        <button 
                            onClick={logout}
                            className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/* ================= EXPORTS ================= */

export {
    Sidebar,
    SidebarProvider,
    SidebarContent,
    InventoryMenu 
};
