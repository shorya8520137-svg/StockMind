"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Download, Package, MapPin, BarChart3, Eye, RefreshCw, Calendar, TrendingUp, X, ChevronDown } from "lucide-react";
import styles from "./inventory.module.css";
import { getMockInventoryResponse } from "../../utils/mockInventoryData";
import ProductTracker from "./ProductTracker";

const PAGE_SIZE = 50;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.hunyhuny.org/api';

const WAREHOUSES = [
    { code: "GGM_WH", name: "Gurgaon Warehouse", city: "Gurgaon" },
    { code: "BLR_WH", name: "Bangalore Warehouse", city: "Bangalore" },
    { code: "MUM_WH", name: "Mumbai Warehouse", city: "Mumbai" },
    { code: "AMD_WH", name: "Ahmedabad Warehouse", city: "Ahmedabad" },
    { code: "HYD_WH", name: "Hyderabad Warehouse", city: "Hyderabad" },
];

export default function InventorySheet() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Filter states
    const [selectedWarehouse, setSelectedWarehouse] = useState("GGM_WH"); // Single warehouse selection
    const [stockFilter, setStockFilter] = useState("all");
    const [sortBy, setSortBy] = useState("product_name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("2025-01-01"); // Default start of year
    const [dateTo, setDateTo] = useState("2025-12-31"); // Default end of year
    const [useMockData, setUseMockData] = useState(false); // Toggle for mock data
    
    // Timeline states - restored for modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        lowStockItems: 0,
        outOfStockItems: 0
    });

    /* ================= LOAD INVENTORY WITH FILTERS ================= */
    const loadInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: PAGE_SIZE.toString(),
            });

            // Add warehouse filter - use selected warehouse
            if (selectedWarehouse) {
                params.append('warehouse', selectedWarehouse);
            }

            // Add optional parameters only if they have values
            if (searchQuery.trim()) {
                params.append('search', searchQuery);
            }
            if (stockFilter !== 'all') {
                params.append('stockFilter', stockFilter);
            }
            if (sortBy !== 'product_name') {
                params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'asc') {
                params.append('sortOrder', sortOrder);
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            console.log('API URL:', `${API_BASE}/inventory?${params}`);
            console.log('🔍 Inventory Filter Parameters:', {
                warehouse: selectedWarehouse,
                dateFrom,
                dateTo,
                search: searchQuery || 'none',
                stockFilter,
                sortBy,
                sortOrder,
                page,
                limit: PAGE_SIZE
            });
            console.log('🏢 CRITICAL: Warehouse filter should be:', selectedWarehouse);

            const response = await fetch(`${API_BASE}/inventory?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            // Handle different response formats more robustly
            let inventoryItems = [];
            let totalCount = 0;
            let statsData = {
                totalProducts: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0
            };

            // Try different response structures
            if (data.success && data.data) {
                // Standard success response
                inventoryItems = Array.isArray(data.data) ? data.data : data.data.items || data.data.inventory || [];
                totalCount = data.total || data.data.total || inventoryItems.length;
                statsData = data.stats || data.data.stats || {};
            } else if (Array.isArray(data)) {
                // Direct array response
                inventoryItems = data;
                totalCount = data.length;
            } else if (data.inventory && Array.isArray(data.inventory)) {
                // Inventory key response
                inventoryItems = data.inventory;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else if (data.items && Array.isArray(data.items)) {
                // Items key response
                inventoryItems = data.items;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else {
                console.warn('Unexpected API response format:', data);
                inventoryItems = [];
            }

            // Calculate stats if not provided by API
            if (!statsData.totalProducts && inventoryItems.length > 0) {
                statsData = {
                    totalProducts: totalCount || inventoryItems.length,
                    totalStock: inventoryItems.reduce((sum, item) => sum + (parseInt(item.stock || item.quantity || 0)), 0),
                    lowStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock > 0 && stock <= 10;
                    }).length,
                    outOfStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock === 0;
                    }).length
                };
            }

            console.log('Processed inventory data:', {
                itemsCount: inventoryItems.length,
                totalCount,
                stats: statsData,
                sampleItem: inventoryItems[0] || 'No items',
                warehouses: inventoryItems.map(item => item.warehouse || item.warehouse_name || item.Warehouse_name || 'Unknown').slice(0, 5),
                expectedWarehouse: selectedWarehouse,
                actualWarehouses: [...new Set(inventoryItems.map(item => item.warehouse || item.warehouse_name || item.Warehouse_name))]
            });

            setItems(inventoryItems);
            setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
            setStats({
                totalProducts: statsData.totalProducts || totalCount || inventoryItems.length,
                totalStock: statsData.totalStock || 0,
                lowStockItems: statsData.lowStockItems || 0,
                outOfStockItems: statsData.outOfStockItems || 0
            });
        } catch (error) {
            console.error('Error loading inventory:', error);
            
            // Try to load mock data as fallback
            console.log('API failed, loading mock data as fallback...');
            
            try {
                const mockResponse = await getMockInventoryResponse({
                    warehouse: selectedWarehouse,
                    dateFrom,
                    dateTo,
                    search: searchQuery,
                    stockFilter,
                    sortBy,
                    sortOrder,
                    page,
                    limit: PAGE_SIZE
                });
                
                console.log('Mock data loaded:', mockResponse);
                
                setItems(mockResponse.data || []);
                setTotalPages(mockResponse.pagination?.pages || 1);
                setStats(mockResponse.stats || {
                    totalProducts: 0,
                    totalStock: 0,
                    lowStockItems: 0,
                    outOfStockItems: 0
                });
                
            } catch (mockError) {
                console.error('Mock data also failed:', mockError);
                setItems([]);
                setTotalPages(1);
                setStats({
                    totalProducts: 0,
                    totalStock: 0,
                    lowStockItems: 0,
                    outOfStockItems: 0
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debug: Check if component mounted
        console.log('InventorySheet mounted, loading with filters:', {
            page,
            selectedWarehouse,
            stockFilter,
            sortBy,
            sortOrder,
            dateFrom,
            dateTo,
            searchQuery,
            useMockData
        });
        
        // Use the warehouse-specific loader to ensure proper filtering
        if (selectedWarehouse) {
            loadInventoryWithWarehouse(selectedWarehouse);
        } else {
            loadInventory();
        }
    }, [page, selectedWarehouse, stockFilter, sortBy, sortOrder, dateFrom, dateTo, useMockData]);

    // Separate effect for search with debounce
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            console.log('Search query changed, reloading...', searchQuery);
            if (page !== 1) setPage(1);
            else {
                // Use warehouse-specific loader for search
                if (selectedWarehouse) {
                    loadInventoryWithWarehouse(selectedWarehouse);
                } else {
                    loadInventory();
                }
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [searchQuery]);

    /* ================= SEARCH WITH BACKEND SUGGESTIONS ================= */
    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (query.length >= 2) {
            try {
                const response = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}&limit=5`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setSuggestions(data.data.products || data.data || []);
                        setShowSuggestions(true);
                    } else if (Array.isArray(data)) {
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }
    };

    const selectSuggestion = (suggestion) => {
        setSearchQuery(suggestion.product_name);
        setShowSuggestions(false);
        setPage(1);
    };

    /* ================= WAREHOUSE FILTER ================= */
    const handleWarehouseChange = (warehouseCode) => {
        console.log('🏢 Warehouse changed to:', warehouseCode);
        console.log('🏢 Previous warehouse was:', selectedWarehouse);
        
        // Clear existing data immediately to prevent showing wrong data
        setItems([]);
        setStats({
            totalProducts: 0,
            totalStock: 0,
            lowStockItems: 0,
            outOfStockItems: 0
        });
        
        setSelectedWarehouse(warehouseCode);
        setPage(1);
        
        // Force immediate reload with the new warehouse
        loadInventoryWithWarehouse(warehouseCode);
    };

    /* ================= LOAD INVENTORY WITH SPECIFIC WAREHOUSE ================= */
    const loadInventoryWithWarehouse = async (warehouseCode) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: PAGE_SIZE.toString(),
            });

            // Use the passed warehouse parameter directly
            if (warehouseCode) {
                params.append('warehouse', warehouseCode);
            }

            // Add other current filter parameters
            if (searchQuery.trim()) {
                params.append('search', searchQuery);
            }
            if (stockFilter !== 'all') {
                params.append('stockFilter', stockFilter);
            }
            if (sortBy !== 'product_name') {
                params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'asc') {
                params.append('sortOrder', sortOrder);
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            console.log('🔍 Loading inventory for warehouse:', warehouseCode);
            console.log('API URL:', `${API_BASE}/inventory?${params}`);

            const response = await fetch(`${API_BASE}/inventory?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response for', warehouseCode, ':', data);
            
            // Handle different response formats more robustly
            let inventoryItems = [];
            let totalCount = 0;
            let statsData = {
                totalProducts: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0
            };

            // Try different response structures
            if (data.success && data.data) {
                // Standard success response
                inventoryItems = Array.isArray(data.data) ? data.data : data.data.items || data.data.inventory || [];
                totalCount = data.total || data.data.total || inventoryItems.length;
                statsData = data.stats || data.data.stats || {};
            } else if (Array.isArray(data)) {
                // Direct array response
                inventoryItems = data;
                totalCount = data.length;
            } else if (data.inventory && Array.isArray(data.inventory)) {
                // Inventory key response
                inventoryItems = data.inventory;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else if (data.items && Array.isArray(data.items)) {
                // Items key response
                inventoryItems = data.items;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else {
                console.warn('Unexpected API response format:', data);
                inventoryItems = [];
            }

            // Verify warehouse filtering worked correctly
            const actualWarehouses = [...new Set(inventoryItems.map(item => item.warehouse || item.warehouse_name || item.Warehouse_name))];
            console.log('🏢 Expected warehouse:', warehouseCode);
            console.log('🏢 Actual warehouses in response:', actualWarehouses);
            
            if (warehouseCode && actualWarehouses.length > 0 && !actualWarehouses.includes(warehouseCode)) {
                console.error('❌ WAREHOUSE FILTER FAILED! Expected:', warehouseCode, 'Got:', actualWarehouses);
                console.error('❌ This indicates a backend filtering bug or data corruption');
                // Clear data if wrong warehouse data is returned
                inventoryItems = [];
                totalCount = 0;
                statsData = {
                    totalProducts: 0,
                    totalStock: 0,
                    lowStockItems: 0,
                    outOfStockItems: 0
                };
            } else if (warehouseCode && actualWarehouses.length === 0) {
                console.log('✅ Warehouse filter working correctly - no data for', warehouseCode);
            } else if (warehouseCode && actualWarehouses.includes(warehouseCode)) {
                console.log('✅ Warehouse filter working correctly - data matches', warehouseCode);
            }

            // Calculate stats if not provided by API
            if (!statsData.totalProducts && inventoryItems.length > 0) {
                statsData = {
                    totalProducts: totalCount || inventoryItems.length,
                    totalStock: inventoryItems.reduce((sum, item) => sum + (parseInt(item.stock || item.quantity || 0)), 0),
                    lowStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock > 0 && stock <= 10;
                    }).length,
                    outOfStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock === 0;
                    }).length
                };
            }

            console.log('✅ Final processed data for', warehouseCode, ':', {
                itemsCount: inventoryItems.length,
                totalCount,
                stats: statsData,
                sampleItem: inventoryItems[0] || 'No items'
            });

            setItems(inventoryItems);
            setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
            setStats({
                totalProducts: statsData.totalProducts || totalCount || inventoryItems.length,
                totalStock: statsData.totalStock || 0,
                lowStockItems: statsData.lowStockItems || 0,
                outOfStockItems: statsData.outOfStockItems || 0
            });
        } catch (error) {
            console.error('❌ Error loading inventory for', warehouseCode, ':', error);
            
            // Don't fall back to mock data for warehouse-specific requests
            // Just show empty state
            setItems([]);
            setTotalPages(1);
            setStats({
                totalProducts: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0
            });
        } finally {
            setLoading(false);
        }
    };

    /* ================= EXPORT ================= */
    const exportToCSV = async (warehouseOption = 'current') => {
        try {
            const params = new URLSearchParams({
                export: 'true'
            });

            // Determine which warehouse to export
            let exportWarehouse = selectedWarehouse;
            if (warehouseOption === 'all') {
                // Don't add warehouse parameter for all warehouses
            } else if (warehouseOption === 'current') {
                exportWarehouse = selectedWarehouse;
            } else {
                exportWarehouse = warehouseOption;
            }

            if (exportWarehouse && warehouseOption !== 'all') {
                params.append('warehouse', exportWarehouse);
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery);
            }
            if (stockFilter !== 'all') {
                params.append('stockFilter', stockFilter);
            }
            if (sortBy !== 'product_name') {
                params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'asc') {
                params.append('sortOrder', sortOrder);
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            console.log('🔽 Exporting with params:', params.toString());
            console.log('🏢 Export warehouse:', exportWarehouse || 'All Warehouses');

            const response = await fetch(`${API_BASE}/inventory/export?${params}`, {
                method: 'GET'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                const warehouseName = warehouseOption === 'all' ? 'All-Warehouses' : 
                                    warehouseOption === 'current' ? selectedWarehouse : 
                                    warehouseOption;
                                    
                a.download = `inventory-${warehouseName}-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                console.log('✅ Export completed for:', warehouseName);
            } else {
                console.error('❌ Export failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Export error:', error);
        }
    };

    /* ================= TIMELINE FUNCTIONS ================= */
    const openTimeline = async (item) => {
        setSelectedItem(item);
        setShowTimeline(true);
    };

    const closeTimeline = () => {
        setShowTimeline(false);
        setSelectedItem(null);
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <h1 className={styles.title}>
                        <Package size={20} />
                        Inventory Management
                        {useMockData && <span style={{fontSize: '12px', color: '#f59e0b', marginLeft: '8px'}}>(Mock Data)</span>}
                    </h1>
                </div>
                
                <div className={styles.topActions}>
                    <button
                        className={styles.refreshBtn}
                        onClick={() => {
                            console.log('🔄 Manual refresh triggered');
                            if (selectedWarehouse) {
                                loadInventoryWithWarehouse(selectedWarehouse);
                            } else {
                                loadInventory();
                            }
                        }}
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        className={styles.exportBtn}
                        onClick={() => {
                            console.log('🧪 Testing API connection...');
                            console.log('Current filters:', {
                                warehouse: selectedWarehouse,
                                dateFrom,
                                dateTo,
                                stockFilter,
                                searchQuery
                            });
                            
                            // Test multiple warehouses
                            const testWarehouses = ['BLR_WH', 'MUM_WH', 'GGM_WH'];
                            
                            testWarehouses.forEach(wh => {
                                fetch(`${API_BASE}/inventory?warehouse=${wh}&limit=5`)
                                    .then(res => {
                                        console.log(`${wh} API Status:`, res.status);
                                        return res.json();
                                    })
                                    .then(data => {
                                        console.log(`${wh} Response:`, {
                                            success: data.success,
                                            dataCount: data.data?.length || 0,
                                            sampleData: data.data?.[0] || 'No data'
                                        });
                                    })
                                    .catch(err => {
                                        console.error(`${wh} Error:`, err);
                                    });
                            });
                        }}
                        title="Test API"
                    >
                        🧪 Test All
                    </button>
                    
                    {/* Export Dropdown */}
                    <div className={styles.exportDropdown}>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    exportToCSV(e.target.value);
                                    e.target.value = ''; // Reset selection
                                }
                            }}
                            className={styles.exportSelect}
                            defaultValue=""
                        >
                            <option value="" disabled>📥 Export Data</option>
                            <option value="current">Current Warehouse ({selectedWarehouse})</option>
                            <option value="GGM_WH">Gurgaon Warehouse</option>
                            <option value="BLR_WH">Bangalore Warehouse</option>
                            <option value="MUM_WH">Mumbai Warehouse</option>
                            <option value="AMD_WH">Ahmedabad Warehouse</option>
                            <option value="HYD_WH">Hyderabad Warehouse</option>
                            <option value="all">All Warehouses</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.totalProducts}</span>
                    <span className={styles.statLabel}>Products</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.totalStock}</span>
                    <span className={styles.statLabel}>Total Stock</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.lowStockItems}</span>
                    <span className={styles.statLabel}>Low Stock</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.outOfStockItems}</span>
                    <span className={styles.statLabel}>Out of Stock</span>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className={styles.searchBar}>
                <div className={styles.searchGroup}>
                    <Search className={styles.searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="Search products by name, barcode, or variant..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    
                    {/* Search Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className={styles.suggestions}>
                            {suggestions.map(suggestion => (
                                <div
                                    key={suggestion.p_id}
                                    className={styles.suggestionItem}
                                    onClick={() => selectSuggestion(suggestion)}
                                >
                                    <Package size={14} />
                                    <div>
                                        <div className={styles.suggestionName}>{suggestion.product_name}</div>
                                        <div className={styles.suggestionBarcode}>{suggestion.barcode}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <button
                    className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={16} />
                    Filters
                </button>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Filter Sidebar */}
                {showFilters && (
                    <>
                        <div className={styles.filterOverlay} onClick={() => setShowFilters(false)} />
                        <div className={styles.filterSidebar}>
                            <div className={styles.filterHeader}>
                                <h3>Filters</h3>
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => setShowFilters(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className={styles.filterContent}>
                                {/* Quick Actions */}
                                <div className={styles.filterSection}>
                                    <h4>Quick Actions</h4>
                                    <button
                                        className={styles.filterAction}
                                        onClick={() => {
                                            setSelectedWarehouse("GGM_WH");
                                            setDateFrom("2025-01-01");
                                            setDateTo("2025-12-31");
                                            setStockFilter("all");
                                            setSortBy("product_name");
                                            setSortOrder("asc");
                                            setSearchQuery("");
                                            setPage(1);
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>

                                {/* Date Range Filter */}
                                <div className={styles.filterSection}>
                                    <h4>Date Range</h4>
                                    <div className={styles.dateInputs}>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => {
                                                console.log('Date from changed to:', e.target.value);
                                                setDateFrom(e.target.value);
                                                setPage(1);
                                            }}
                                            className={styles.dateInput}
                                            placeholder="From"
                                        />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => {
                                                console.log('Date to changed to:', e.target.value);
                                                setDateTo(e.target.value);
                                                setPage(1);
                                            }}
                                            className={styles.dateInput}
                                            placeholder="To"
                                        />
                                    </div>
                                </div>

                                {/* Stock Status Filter */}
                                <div className={styles.filterSection}>
                                    <h4>Stock Status</h4>
                                    <select
                                        value={stockFilter}
                                        onChange={(e) => {
                                            console.log('Stock filter changed to:', e.target.value);
                                            setStockFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className={styles.filterSelect}
                                    >
                                        <option value="all">All Items</option>
                                        <option value="in-stock">In Stock</option>
                                        <option value="low-stock">Low Stock</option>
                                        <option value="out-of-stock">Out of Stock</option>
                                    </select>
                                </div>

                                {/* Sort Options */}
                                <div className={styles.filterSection}>
                                    <h4>Sort By</h4>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            console.log('Sort by changed to:', e.target.value);
                                            setSortBy(e.target.value);
                                            setPage(1);
                                        }}
                                        className={styles.filterSelect}
                                    >
                                        <option value="product_name">Product Name</option>
                                        <option value="stock">Stock Quantity</option>
                                        <option value="warehouse">Warehouse</option>
                                        <option value="updated_at">Last Updated</option>
                                    </select>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => {
                                            console.log('Sort order changed to:', e.target.value);
                                            setSortOrder(e.target.value);
                                            setPage(1);
                                        }}
                                        className={styles.filterSelect}
                                    >
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>

                                {/* Warehouse Filter */}
                                <div className={styles.filterSection}>
                                    <h4>Warehouse</h4>
                                    <select
                                        value={selectedWarehouse}
                                        onChange={(e) => {
                                            console.log('🏢 Warehouse dropdown changed from', selectedWarehouse, 'to', e.target.value);
                                            console.log('🏢 Available options:', WAREHOUSES.map(w => `${w.code}: ${w.name}`));
                                            handleWarehouseChange(e.target.value);
                                        }}
                                        className={styles.filterSelect}
                                    >
                                        {WAREHOUSES.map(warehouse => (
                                            <option key={warehouse.code} value={warehouse.code}>
                                                {warehouse.name} ({warehouse.code})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                                        Selected: {selectedWarehouse}
                                        <br />
                                        Items shown: {items.length}
                                        <br />
                                        Warehouses in data: {items.length > 0 ? [...new Set(items.map(item => item.warehouse))].join(', ') : 'None'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Inventory Table */}
                <div className={styles.tableContainer} key={`inventory-${selectedWarehouse}`}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading inventory...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.noData}>
                            <Package size={48} />
                            <h3>No inventory data found</h3>
                            <p>Try adjusting your filters or check if inventory data exists in the database.</p>
                            <button 
                                className={styles.refreshBtn}
                                onClick={() => {
                                    if (selectedWarehouse) {
                                        loadInventoryWithWarehouse(selectedWarehouse);
                                    } else {
                                        loadInventory();
                                    }
                                }}
                            >
                                <RefreshCw size={16} />
                                Refresh Data
                            </button>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Barcode</th>
                                    <th>Stock</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id || index}>
                                        <td>
                                            <div className={styles.productCell}>
                                                <div className={styles.productName}>
                                                    {item.product || item.product_name || item.name || 'N/A'}
                                                </div>
                                                {(item.variant || item.product_variant) && (
                                                    <div className={styles.productVariant}>
                                                        {item.variant || item.product_variant}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <code className={styles.barcode}>
                                                {item.code || item.barcode || 'N/A'}
                                            </code>
                                        </td>
                                        <td>
                                            <div 
                                                className={styles.stockCell}
                                                onClick={() => openTimeline(item)}
                                                title="Click to view stock timeline"
                                            >
                                                <span className={styles.stockNumber}>
                                                    {item.stock || item.quantity || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.locationCell}>
                                                <MapPin size={12} />
                                                <span>
                                                    {item.warehouse || item.warehouse_name || item.Warehouse_name || item.location || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${
                                                (item.stock || item.quantity || 0) === 0 ? styles.outOfStock :
                                                (item.stock || item.quantity || 0) < 10 ? styles.lowStock :
                                                styles.inStock
                                            }`}>
                                                {(item.stock || item.quantity || 0) === 0 ? 'Out of Stock' :
                                                 (item.stock || item.quantity || 0) < 10 ? 'Low Stock' :
                                                 'In Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.dateText}>
                                                <Calendar size={12} />
                                                {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 
                                                 item.last_updated ? new Date(item.last_updated).toLocaleDateString() :
                                                 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.actionBtn}
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={`${styles.paginationBtn} ${page === 1 ? styles.disabled : ''}`}
                    >
                        Previous
                    </button>
                    
                    <div className={styles.paginationNumbers}>
                        {/* Show page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`${styles.paginationNumber} ${page === pageNum ? styles.active : ''}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className={`${styles.paginationBtn} ${page === totalPages ? styles.disabled : ''}`}
                    >
                        Next
                    </button>
                    
                    <span className={styles.paginationInfo}>
                        Page {page} of {totalPages} ({items.length} items)
                    </span>
                </div>
            )}

            {/* Use ProductTracker Component */}
            {showTimeline && selectedItem && (
                <ProductTracker
                    barcodeOverride={selectedItem.code || selectedItem.barcode}
                    warehouseFilter={selectedWarehouse}
                    onClose={closeTimeline}
                />
            )}
        </div>
    );
}
