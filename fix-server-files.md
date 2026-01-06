# Fix Server Files Issue

## Problem
Server is trying to load old files that don't exist in our workspace:
- `/home/ubuntu/inventory-backendtest/controllers/DamageController.js` (syntax error)
- `/home/ubuntu/inventory-backendtest/routes/DamageRouter.js`

## Solution Options

### Option 1: Delete Old Files (Recommended)
```bash
cd /home/ubuntu/inventory-backendtest
rm -f controllers/DamageController.js
rm -f routes/DamageRouter.js
```

### Option 2: Check What Files Exist on Server
```bash
cd /home/ubuntu/inventory-backendtest
ls -la controllers/
ls -la routes/
```

### Option 3: Fix Syntax Error in DamageController.js
```bash
cd /home/ubuntu/inventory-backendtest
tail -10 controllers/DamageController.js
# Look for missing closing braces } or parentheses )
```

## Current Working Files
- ✅ `controllers/damageRecoveryController.js` (fixed)
- ✅ `routes/damageRecoveryRoutes.js` (working)
- ✅ `server.js` (routes mounted correctly)

## After Fixing
Restart server:
```bash
node server.js
```