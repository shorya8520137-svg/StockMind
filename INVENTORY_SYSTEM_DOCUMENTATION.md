# Complete Inventory Management System Documentation

## Overview
This is a comprehensive inventory management system that handles all aspects of warehouse operations including stock management, dispatches, returns, damage reporting, and recovery operations. The system maintains proper inventory tracking with automatic stock updates and audit trails.

## Database Schema

### Core Tables
1. **stock_batches** - Main inventory table with FIFO tracking
2. **inventory_ledger_base** - Complete audit trail of all inventory movements
3. **warehouse_dispatch** - Dispatch operations
4. **returns_main** - Return operations
5. **damage_recovery_log** - Damage and recovery tracking
6. **inventory_daily_snapshot** - Daily inventory snapshots

## API Endpoints

### 1. Inventory Management (`/api/inventory`)
- `GET /` - Get inventory with advanced filtering
- `GET /by-warehouse` - Get inventory by specific warehouse
- `GET /export` - Export inventory as CSV
- `POST /add-stock` - Add new stock (opening/purchase/transfer)

### 2. Dispatch Operations (`/api/dispatch`)
- `POST /` - Create new dispatch (automatically reduces stock)
- `GET /` - Get dispatches with filters
- `PUT /:id/status` - Update dispatch status
- `GET /suggestions/products` - Product auto-suggestions with stock info
- `GET /suggestions/warehouses` - Warehouse suggestions

### 3. Returns Management (`/api/returns`)
- `POST /` - Process return (automatically adds stock back if condition is good)
- `GET /` - Get returns with filters
- `GET /:id` - Get specific return details
- `POST /bulk` - Process multiple returns
- `GET /suggestions/products` - Product suggestions for returns

### 4. Damage & Recovery (`/api/damage-recovery`)
- `POST /damage` - Report damage (reduces stock)
- `POST /recover` - Recover stock (adds stock back)
- `GET /log` - Get damage/recovery log with filters
- `GET /summary` - Get summary by warehouse
- `GET /suggestions/products` - Product suggestions

## Key Features

### 1. Automatic Stock Management
- **FIFO (First In, First Out)** - Stock is consumed from oldest batches first
- **Real-time Updates** - All operations immediately update stock levels
- **Batch Tracking** - Each stock addition creates a batch for precise tracking
- **Status Management** - Batches automatically marked as 'exhausted' when empty

### 2. Complete Audit Trail
- Every inventory movement is logged in `inventory_ledger_base`
- Includes timestamps, quantities, directions (IN/OUT), and references
- Supports different movement types: OPENING, PURCHASE, DISPATCH, RETURN, DAMAGE, RECOVER

### 3. User-Friendly Features
- **Auto-suggestions** - Product names, barcodes, and warehouses
- **Advanced Filtering** - By warehouse, date range, stock status, search terms
- **Pagination** - Efficient handling of large datasets
- **Export Functionality** - CSV export with applied filters

### 4. Data Validation
- Stock availability checks before dispatch/damage operations
- Required field validation
- Quantity validation (must be positive)
- Transaction rollback on errors

## Usage Examples

### Creating a Dispatch
```javascript
import { dispatch } from './src/services/api';

const dispatchData = {
    warehouse: 'GGM_WH',
    product_name: 'Samsung Galaxy S24',
    qty: 2,
    barcode: 'SGS24001',
    awb: 'AWB123456789',
    customer: 'John Doe',
    order_ref: 'ORD-2025-001',
    logistics: 'BlueDart',
    payment_mode: 'COD',
    invoice_amount: 130000,
    processed_by: 'admin'
};

const result = await dispatch.createDispatch(dispatchData);
```

### Processing a Return
```javascript
import { returns } from './src/services/api';

const returnData = {
    order_ref: 'ORD-2025-001',
    awb: 'AWB123456789',
    product_type: 'Samsung Galaxy S24',
    warehouse: 'GGM_WH',
    quantity: 1,
    barcode: 'SGS24001',
    condition: 'good', // 'good', 'damaged', 'defective'
    return_reason: 'Customer changed mind'
};

const result = await returns.createReturn(returnData);
```

### Reporting Damage
```javascript
import { damageRecovery } from './src/services/api';

const damageData = {
    product_type: 'Samsung Galaxy S24',
    barcode: 'SGS24001',
    inventory_location: 'GGM_WH',
    quantity: 1,
    damage_reason: 'Dropped during handling',
    damage_type: 'physical',
    reported_by: 'warehouse_staff'
};

const result = await damageRecovery.reportDamage(damageData);
```

### Getting Product Suggestions
```javascript
import { dispatch } from './src/services/api';

// Get products available for dispatch in specific warehouse
const suggestions = await dispatch.getProductSuggestions('samsung', 'GGM_WH');
// Returns products with available stock information
```

## Frontend Integration

### Auto-suggestions Implementation
```javascript
const [suggestions, setSuggestions] = useState([]);

const handleProductSearch = async (searchTerm) => {
    if (searchTerm.length >= 2) {
        try {
            const result = await dispatch.getProductSuggestions(searchTerm, selectedWarehouse);
            setSuggestions(result.data);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    }
};
```

### Filtering Implementation
```javascript
const [filters, setFilters] = useState({
    warehouse: 'GGM_WH',
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
    search: '',
    page: 1,
    limit: 50
});

const loadData = async () => {
    try {
        const result = await dispatch.getDispatches(filters);
        setData(result.data);
        setPagination(result.pagination);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
};
```

## Error Handling

### Backend Error Responses
```javascript
{
    "success": false,
    "message": "Insufficient stock. Available: 5, Required: 10",
    "error": "Additional technical details"
}
```

### Frontend Error Handling
```javascript
try {
    const result = await dispatch.createDispatch(data);
    // Handle success
} catch (error) {
    // Display user-friendly error message
    setErrorMessage(error.message);
}
```

## Security Considerations

1. **Input Validation** - All inputs validated on both frontend and backend
2. **SQL Injection Prevention** - Parameterized queries used throughout
3. **Transaction Safety** - Database transactions ensure data consistency
4. **Error Handling** - Proper error messages without exposing sensitive data

## Performance Optimizations

1. **Pagination** - Large datasets handled efficiently
2. **Indexing** - Database indexes on frequently queried fields
3. **FIFO Optimization** - Efficient batch selection for stock operations
4. **Caching** - Suggestions and warehouse data can be cached

## Monitoring and Analytics

### Daily Snapshots
The system can generate daily inventory snapshots for:
- Opening stock
- Dispatch quantities
- Damage quantities
- Return quantities
- Recovery quantities
- Closing stock

### Audit Reports
- Complete movement history for any product
- Warehouse-wise damage/recovery summaries
- Dispatch performance metrics
- Return analysis

## Future Enhancements

1. **Barcode Scanning** - Mobile app integration
2. **Automated Reorder Points** - Low stock alerts
3. **Predictive Analytics** - Demand forecasting
4. **Multi-location Transfers** - Inter-warehouse transfers
5. **Quality Control** - Inspection workflows
6. **Integration APIs** - ERP/accounting system integration

## Troubleshooting

### Common Issues
1. **Insufficient Stock** - Check available quantities before operations
2. **Batch Exhaustion** - System automatically handles batch status updates
3. **Transaction Failures** - All operations are wrapped in database transactions
4. **Data Consistency** - Audit trail ensures complete traceability

### Debugging
- Enable detailed logging in controllers
- Check `inventory_ledger_base` for movement history
- Verify batch quantities in `stock_batches`
- Monitor transaction rollbacks in application logs