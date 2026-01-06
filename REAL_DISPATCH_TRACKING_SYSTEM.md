# Real Dispatch Tracking System

## Overview
Complete dispatch tracking system using your actual database tables (`warehouse_dispatch`, `warehouse_dispatch_items`, `damage_recovery_log`) with real-time timeline, damage reporting, and recovery tracking.

## ✅ Database Structure (Your Actual Tables)

### 1. warehouse_dispatch (Main Dispatch Table)
```sql
- id (Primary Key)
- status (Pending, Dispatched, Delivered, etc.)
- warehouse (BLR_WH, GGM_WH, etc.)
- order_ref (Order reference)
- customer (Customer name)
- product_name (Product name)
- qty (Quantity)
- variant (Product variant)
- barcode (Product barcode)
- awb (AWB number)
- logistics (Blue Dart, etc.)
- parcel_type (Forward, etc.)
- dimensions (length, width, height)
- actual_weight
- payment_mode (COD, etc.)
- invoice_amount
- processed_by (Staff name)
- remarks
- timestamp
- notification_status
```

### 2. warehouse_dispatch_items (Dispatch Items)
```sql
- id (Primary Key)
- dispatch_id (Foreign Key to warehouse_dispatch)
- product_name
- variant
- barcode
- qty
- selling_price
```

### 3. damage_recovery_log (Existing)
```sql
- id (Primary Key)
- product_type
- barcode
- inventory_location
- action_type (damage/recover)
- quantity
- timestamp
```

## ✅ Backend Implementation

### Updated Controller (`controllers/orderTrackingController.js`)
- **getAllDispatches**: Get all dispatches with damage/recovery counts
- **getDispatchTimeline**: Complete timeline for specific dispatch
- **reportDispatchDamage**: Report damage for dispatched items
- **getDispatchStats**: Statistics by warehouse

### API Endpoints
- `GET /api/order-tracking` - All dispatches with tracking info
- `GET /api/order-tracking/stats` - Dispatch statistics
- `GET /api/order-tracking/:dispatchId/timeline` - Dispatch timeline
- `POST /api/order-tracking/:dispatchId/damage` - Report damage

## ✅ Frontend Implementation

### Real Data Integration
- Fetches actual dispatches from `warehouse_dispatch` table
- Shows real customer names, AWB numbers, logistics partners
- Displays actual invoice amounts and processing staff
- Real-time damage and recovery counts

### Enhanced Timeline Modal
- **Dispatch Summary**: Customer, AWB, logistics, amount, current stock
- **Complete Timeline**: Dispatch events, damage reports, recovery operations
- **Real References**: Actual AWB numbers and dispatch IDs

## 📊 API Examples

### Get All Dispatches
```bash
GET /api/order-tracking
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 17,
      "status": "Pending",
      "warehouse": "BLR_WH",
      "order_ref": "34567",
      "customer": "EWRTY",
      "product_name": "Another Product",
      "qty": 1,
      "barcode": "XYZ789",
      "awb": "123456",
      "logistics": "Blue Dart",
      "payment_mode": "COD",
      "invoice_amount": 3245.00,
      "processed_by": "Anurag Singh",
      "timestamp": "2026-01-04T18:44:26.000Z",
      "damage_count": 1,
      "recovery_count": 0,
      "current_stock": 3
    }
  ]
}
```

### Get Dispatch Timeline
```bash
GET /api/order-tracking/17/timeline
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dispatch": {
      "id": 17,
      "customer": "EWRTY",
      "product_name": "Another Product",
      "awb": "123456",
      "logistics": "Blue Dart",
      "status": "Pending",
      "invoice_amount": 3245.00
    },
    "timeline": [
      {
        "source": "dispatch",
        "type": "DISPATCH",
        "description": "Dispatched 1 units via Blue Dart",
        "quantity": 1,
        "direction": "OUT",
        "warehouse": "BLR_WH",
        "reference": "DISPATCH_17_123456",
        "timestamp": "2026-01-04T18:44:26.000Z"
      },
      {
        "source": "damage_recovery",
        "type": "DAMAGE",
        "description": "Reported 1 units as damaged",
        "quantity": 1,
        "direction": "OUT",
        "warehouse": "BLR_WH",
        "reference": "damage#8",
        "timestamp": "2026-01-05T05:04:47.000Z"
      }
    ],
    "summary": {
      "total_movements": 2,
      "dispatched": 1,
      "damaged": 1,
      "recovered": 0,
      "current_stock": 3
    }
  }
}
```

### Report Dispatch Damage
```bash
POST /api/order-tracking/17/damage
Content-Type: application/json

{
  "product_name": "Another Product",
  "barcode": "XYZ789",
  "warehouse": "BLR_WH",
  "quantity": 1,
  "reason": "Damaged during shipping",
  "notes": "Customer reported damage on delivery"
}
```

## 🎨 Frontend Features

### Dispatch Table (OrderSheet.jsx)
- **Real Data**: Shows actual dispatches from your database
- **Complete Info**: Customer, AWB, logistics, amount, processing staff
- **Tracking Badges**: Visual indicators for damage/recovery counts
- **Timeline Button**: Opens detailed timeline for each dispatch

### Timeline Modal
- **Dispatch Summary**: 8 key fields including AWB, logistics, amount, current stock
- **Complete Timeline**: All dispatch-related activities
- **Real References**: Actual AWB numbers and dispatch IDs
- **Color-coded Events**: Different colors for dispatch, damage, recovery

## 🧪 Testing with Your Real Data

### Current Data in Your Database
```sql
-- Your actual dispatches
ID: 17 - Customer: EWRTY - AWB: 123456 - Product: Another Product (XYZ789)
ID: 18 - Customer: jhon deo - AWB: 328958y39 - Product: Another Product (XYZ789)

-- Your damage records
Barcode: XYZ789 - 1 unit damaged - 2026-01-05 05:04:47
```

### Test Steps
1. **Restart Server**: `node server.js`
2. **Open Orders Page**: You'll see your real dispatches (ID 17, 18)
3. **Click Timeline**: View complete tracking for each dispatch
4. **Check Damage Badges**: Should show "1D" for XYZ789 dispatches

### Expected Timeline for Dispatch ID 17
```
📦 Dispatch Summary:
Customer: EWRTY | AWB: 123456 | Logistics: Blue Dart
Amount: ₹3,245.00 | Current Stock: 3

🔵 Dispatched 1 units via Blue Dart
   Quantity: 1 (OUT) | BLR_WH | 1/4/2026, 6:44:26 PM
   Reference: DISPATCH_17_123456

🟡 Reported 1 units as damaged  
   Quantity: 1 (OUT) | BLR_WH | 1/5/2026, 5:04:47 AM
   Reference: damage#8
```

## 📈 Key Benefits

### Real Data Integration
- ✅ Uses your actual `warehouse_dispatch` table
- ✅ Shows real customer names and AWB numbers
- ✅ Displays actual logistics partners and amounts
- ✅ Real-time damage and recovery tracking

### Complete Visibility
- ✅ Full dispatch lifecycle tracking
- ✅ Damage reporting with stock updates
- ✅ Recovery operations tracking
- ✅ Current stock levels for each product

### Professional Interface
- ✅ Clean timeline with dispatch details
- ✅ Color-coded event types
- ✅ Real references and timestamps
- ✅ Comprehensive dispatch summary

The system now provides complete visibility into your actual dispatch operations with proper tracking of damage and recovery events using your real database structure.