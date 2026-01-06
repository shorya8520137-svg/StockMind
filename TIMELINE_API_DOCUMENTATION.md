# Timeline API Documentation

## Overview
The Timeline API provides comprehensive tracking of all inventory movements for products across different operations (dispatch, damage, recovery, bulk upload, etc.).

## Endpoints

### 1. Get Product Timeline
**GET** `/api/timeline/:productCode`

Get complete timeline for a specific product showing all inventory movements.

**Parameters:**
- `productCode` (path) - Product barcode/code (e.g., XYZ789)
- `warehouse` (query, optional) - Filter by warehouse (e.g., BLR_WH)
- `dateFrom` (query, optional) - Start date (YYYY-MM-DD)
- `dateTo` (query, optional) - End date (YYYY-MM-DD)
- `limit` (query, optional) - Max results (default: 50)

**Example:**
```
GET /api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_code": "XYZ789",
    "timeline": [
      {
        "id": 568,
        "timestamp": "2026-01-04T18:44:26.000Z",
        "type": "DISPATCH",
        "product_name": "Another Product",
        "barcode": "XYZ789",
        "warehouse": "BLR_WH",
        "quantity": 1,
        "direction": "OUT",
        "reference": "DISPATCH_17_123456",
        "source": "ledger",
        "description": "Dispatched 1 units"
      },
      {
        "id": 8,
        "timestamp": "2026-01-05T05:04:47.000Z",
        "type": "DAMAGE",
        "product_name": "Another Product",
        "barcode": "XYZ789",
        "warehouse": "BLR_WH",
        "quantity": 1,
        "direction": "OUT",
        "reference": "damage#8",
        "source": "damage_recovery",
        "description": "Reported 1 units as damaged"
      }
    ],
    "current_stock": [
      {
        "barcode": "XYZ789",
        "product_name": "Another Product",
        "warehouse": "BLR_WH",
        "current_stock": 3,
        "batch_count": 1
      }
    ],
    "summary": {
      "total_entries": 2,
      "total_in": 5,
      "total_out": 2,
      "net_movement": 3
    }
  }
}
```

### 2. Get Timeline Summary
**GET** `/api/timeline`

Get timeline summary grouped by product or warehouse.

**Parameters:**
- `warehouse` (query, optional) - Filter by warehouse
- `dateFrom` (query, optional) - Start date (YYYY-MM-DD)
- `dateTo` (query, optional) - End date (YYYY-MM-DD)
- `groupBy` (query, optional) - Group by 'product' or 'warehouse' (default: 'product')

**Example:**
```
GET /api/timeline?warehouse=BLR_WH&groupBy=product&dateFrom=2025-01-01
```

### 3. Legacy Endpoint (Backward Compatibility)
**GET** `/api/inventory/timeline/:productCode`

Same as `/api/timeline/:productCode` - redirects to timeline controller.

## Data Sources

The timeline combines data from multiple tables:

1. **inventory_ledger_base** - Main inventory movements
   - Bulk uploads, dispatches, returns, opening stock
   
2. **damage_recovery_log** - Damage and recovery operations
   - Damage reports, stock recovery

## Movement Types

- **BULK_UPLOAD** - Stock added via bulk upload
- **DISPATCH** - Stock dispatched/sold
- **DAMAGE** - Stock reported as damaged
- **RECOVER** - Stock recovered from damage
- **RETURN** - Stock returned to inventory
- **OPENING** - Opening stock balance
- **PURCHASE** - Stock purchased/received

## Frontend Integration

The frontend calls this API from:
- `src/app/inventory/InventorySheet.jsx` - Timeline modal
- `src/services/api/inventory.js` - API service

**Frontend API Call:**
```javascript
const response = await fetch(`https://13-201-222-24.nip.io/api/timeline/${productCode}`);
const data = await response.json();
```

## Testing

Test the API endpoints:

1. **Get timeline for XYZ789:**
   ```
   curl "https://13-201-222-24.nip.io/api/timeline/XYZ789"
   ```

2. **Get timeline with filters:**
   ```
   curl "https://13-201-222-24.nip.io/api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01"
   ```

3. **Get timeline summary:**
   ```
   curl "https://13-201-222-24.nip.io/api/timeline?warehouse=BLR_WH"
   ```