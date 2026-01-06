# Order Tracking System

## Overview
Complete order tracking system with real-time timeline, damage reporting, recovery tracking, and returns management.

## ✅ Backend Implementation

### 1. Order Tracking Controller (`controllers/orderTrackingController.js`)
- **getOrderTimeline**: Get complete timeline for specific order
- **reportOrderDamage**: Report damage for order items with stock updates
- **processOrderReturn**: Process returns with inventory updates
- **getOrdersSummary**: Get orders with tracking statistics

### 2. Order Tracking Routes (`routes/orderTrackingRoutes.js`)
- `GET /api/order-tracking` - Orders summary with tracking info
- `GET /api/order-tracking/:orderId/timeline` - Order timeline
- `POST /api/order-tracking/:orderId/damage` - Report damage
- `POST /api/order-tracking/:orderId/return` - Process return

### 3. Database Tables (`order-tracking-tables.sql`)
- **orders** - Main orders table
- **dispatch_log** - Dispatch tracking
- **returns_log** - Returns tracking
- **damage_recovery_log** - Damage and recovery tracking (existing)

## ✅ Frontend Implementation

### 1. OrderSheet.jsx Updates
- **Real Data Integration**: Fetches orders from API instead of dummy data
- **Timeline Modal**: Complete timeline view for each order
- **Action Buttons**: Timeline button with tracking badges
- **Tracking Badges**: Shows damage (D), return (R), recovery (Rec) counts

### 2. Timeline Features
- **Order Summary**: Customer, product, quantity, status
- **Movement Timeline**: All order-related activities
- **Color-coded Events**: Different colors for different event types
- **Real-time Data**: Fetches live data from database

## 📊 API Endpoints

### Get Orders Summary
```bash
GET /api/order-tracking
# Optional parameters: warehouse, status, dateFrom, dateTo, page, limit
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_name": "John Smith",
      "product_name": "Wireless Headphones",
      "barcode": "ABC123",
      "quantity": 2,
      "warehouse": "GGM_WH",
      "status": "pending",
      "damage_count": 0,
      "return_count": 1,
      "recovery_count": 0
    }
  ]
}
```

### Get Order Timeline
```bash
GET /api/order-tracking/1/timeline
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "customer_name": "John Smith",
      "product_name": "Wireless Headphones",
      "status": "pending"
    },
    "timeline": [
      {
        "id": 1,
        "timestamp": "2026-01-05T10:30:00.000Z",
        "type": "DISPATCH",
        "description": "Order dispatched",
        "quantity": 2,
        "direction": "OUT",
        "warehouse": "GGM_WH",
        "reference": "ORDER_1"
      }
    ],
    "summary": {
      "total_movements": 3,
      "dispatched": 2,
      "damaged": 0,
      "recovered": 0,
      "returned": 1,
      "current_stock": 5
    }
  }
}
```

### Report Order Damage
```bash
POST /api/order-tracking/1/damage
Content-Type: application/json

{
  "product_name": "Wireless Headphones",
  "barcode": "ABC123",
  "warehouse": "GGM_WH",
  "quantity": 1,
  "reason": "Damaged during shipping",
  "notes": "Customer reported damage"
}
```

### Process Order Return
```bash
POST /api/order-tracking/1/return
Content-Type: application/json

{
  "product_name": "Wireless Headphones",
  "barcode": "ABC123",
  "warehouse": "GGM_WH",
  "quantity": 1,
  "reason": "Customer not satisfied",
  "condition": "good"
}
```

## 🎨 Frontend Features

### Order Table Enhancements
- **Actions Column**: Timeline button for each order
- **Tracking Badges**: Visual indicators for damage/return/recovery counts
- **Real Data**: Fetches actual orders from database
- **Loading States**: Proper loading and error handling

### Timeline Modal
- **Order Summary**: Key order information at the top
- **Timeline View**: Chronological list of all order activities
- **Color-coded Dots**: Different colors for different event types:
  - 🔴 **Dispatch** - Red
  - 🟡 **Damage** - Orange
  - 🟢 **Recovery** - Green
  - 🟣 **Return** - Purple
- **Detailed Information**: Quantity, direction, warehouse, timestamps, references

## 🗄️ Database Setup

Run the SQL script to create required tables:

```bash
mysql -u admin -p inventory < order-tracking-tables.sql
```

This creates:
- `orders` table with sample data
- `dispatch_log` table for dispatch tracking
- `returns_log` table for returns tracking
- Sample data for testing

## 🧪 Testing

### 1. Setup Database
```bash
# Run the SQL script
mysql -u admin -p inventory < order-tracking-tables.sql
```

### 2. Restart Server
```bash
cd /home/ubuntu/inventory-backendtest
node server.js
```

### 3. Test Frontend
1. Open Orders page
2. Click "📊 Timeline" button on any order
3. View complete order timeline
4. Check tracking badges (D/R/Rec counts)

### 4. Test API Endpoints
```bash
# Get orders
curl "https://13-201-222-24.nip.io/api/order-tracking"

# Get order timeline
curl "https://13-201-222-24.nip.io/api/order-tracking/1/timeline"

# Report damage
curl -X POST "https://13-201-222-24.nip.io/api/order-tracking/1/damage" \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Test Product","barcode":"ABC123","warehouse":"GGM_WH","quantity":1}'
```

## 📈 Expected Results

### Order Table
- Shows real orders from database
- Timeline buttons for each order
- Tracking badges showing damage/return counts
- Proper loading states

### Timeline Modal
- Complete order information
- Chronological timeline of all activities
- Color-coded event types
- Real-time data from multiple sources

### Data Integration
- Orders from `orders` table
- Dispatch events from `dispatch_log`
- Damage/recovery from `damage_recovery_log`
- Returns from `returns_log`
- Current stock from `stock_batches`

The system now provides complete visibility into order lifecycle with proper tracking of damage, recovery, and returns operations.