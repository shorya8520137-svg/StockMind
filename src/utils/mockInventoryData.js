// Mock inventory data for testing when API is not available

export const MOCK_INVENTORY_DATA = [
    {
        id: 1,
        product_name: "Samsung Galaxy S24",
        barcode: "SGS24001",
        stock: 45,
        warehouse: "GGM_WH",
        variant: "128GB Black",
        updated_at: "2025-01-03T10:30:00Z",
        unit_cost: 65000
    },
    {
        id: 2,
        product_name: "iPhone 15 Pro",
        barcode: "IP15P001",
        stock: 8,
        warehouse: "GGM_WH", 
        variant: "256GB Blue",
        updated_at: "2025-01-02T15:45:00Z",
        unit_cost: 120000
    },
    {
        id: 3,
        product_name: "MacBook Air M3",
        barcode: "MBA3001",
        stock: 0,
        warehouse: "GGM_WH",
        variant: "13-inch Silver",
        updated_at: "2025-01-01T09:15:00Z",
        unit_cost: 115000
    },
    {
        id: 4,
        product_name: "Dell XPS 13",
        barcode: "DXP13001",
        stock: 22,
        warehouse: "BLR_WH",
        variant: "i7 16GB",
        updated_at: "2025-01-03T14:20:00Z",
        unit_cost: 95000
    },
    {
        id: 5,
        product_name: "Sony WH-1000XM5",
        barcode: "SWH5001",
        stock: 3,
        warehouse: "MUM_WH",
        variant: "Black",
        updated_at: "2025-01-02T11:30:00Z",
        unit_cost: 30000
    },
    {
        id: 6,
        product_name: "iPad Pro 12.9",
        barcode: "IPP129001",
        stock: 15,
        warehouse: "AMD_WH",
        variant: "512GB Space Gray",
        updated_at: "2025-01-03T16:45:00Z",
        unit_cost: 110000
    },
    {
        id: 7,
        product_name: "Nintendo Switch OLED",
        barcode: "NSW001",
        stock: 0,
        warehouse: "HYD_WH",
        variant: "White",
        updated_at: "2025-01-01T12:00:00Z",
        unit_cost: 35000
    },
    {
        id: 8,
        product_name: "AirPods Pro 2",
        barcode: "APP2001",
        stock: 67,
        warehouse: "GGM_WH",
        variant: "USB-C",
        updated_at: "2025-01-03T08:30:00Z",
        unit_cost: 25000
    }
];

// Filter mock data based on provided filters
export function filterMockInventory(filters = {}) {
    let filteredData = [...MOCK_INVENTORY_DATA];
    
    // Filter by warehouse
    if (filters.warehouse) {
        filteredData = filteredData.filter(item => item.warehouse === filters.warehouse);
    }
    
    // Filter by search query
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(item => 
            item.product_name.toLowerCase().includes(searchLower) ||
            item.barcode.toLowerCase().includes(searchLower) ||
            (item.variant && item.variant.toLowerCase().includes(searchLower))
        );
    }
    
    // Filter by stock status
    if (filters.stockFilter && filters.stockFilter !== 'all') {
        switch (filters.stockFilter) {
            case 'in-stock':
                filteredData = filteredData.filter(item => item.stock > 10);
                break;
            case 'low-stock':
                filteredData = filteredData.filter(item => item.stock > 0 && item.stock <= 10);
                break;
            case 'out-of-stock':
                filteredData = filteredData.filter(item => item.stock === 0);
                break;
        }
    }
    
    // Sort data
    if (filters.sortBy) {
        filteredData.sort((a, b) => {
            let aVal, bVal;
            
            switch (filters.sortBy) {
                case 'product_name':
                    aVal = a.product_name.toLowerCase();
                    bVal = b.product_name.toLowerCase();
                    break;
                case 'stock':
                    aVal = a.stock;
                    bVal = b.stock;
                    break;
                case 'warehouse':
                    aVal = a.warehouse;
                    bVal = b.warehouse;
                    break;
                case 'updated_at':
                    aVal = new Date(a.updated_at);
                    bVal = new Date(b.updated_at);
                    break;
                default:
                    aVal = a.product_name.toLowerCase();
                    bVal = b.product_name.toLowerCase();
            }
            
            if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
            if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
            return 0;
        });
    }
    
    // Calculate stats
    const stats = {
        totalProducts: filteredData.length,
        totalStock: filteredData.reduce((sum, item) => sum + item.stock, 0),
        lowStockItems: filteredData.filter(item => item.stock > 0 && item.stock <= 10).length,
        outOfStockItems: filteredData.filter(item => item.stock === 0).length
    };
    
    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    return {
        success: true,
        data: paginatedData,
        total: filteredData.length,
        stats,
        pagination: {
            page,
            limit,
            pages: Math.ceil(filteredData.length / limit),
            hasNext: endIndex < filteredData.length,
            hasPrev: page > 1
        }
    };
}

// Test function to simulate API response
export function getMockInventoryResponse(filters = {}) {
    console.log('🧪 Using mock inventory data with filters:', filters);
    
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(filterMockInventory(filters));
        }, 500);
    });
}