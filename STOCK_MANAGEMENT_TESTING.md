# Stock Management Testing Guide

## ✅ What Was Added

### 1. **Product Editor - Stock Management Section**
Located in the **Pricing Tab** of the product editor:

#### Fields Available:
- **Total Stock Available** (Required) - Total units for bulk purchase
- **Low Stock Threshold** - Alert level (default: 10)
- **Max Order Quantity** - Maximum units per order
- **Currently Available** - Remaining units after pledges

#### Visual Features:
- Real-time stock status indicator (IN STOCK / LOW STOCK / OUT OF STOCK)
- Color-coded progress bar (Cyan → Orange → Red)
- Live calculation of stock percentage

### 2. **Live Preview in Editor**
The right-side preview now shows:
- Stock Status card with color coding
- Available units display
- Max per order information
- Dynamic "Join Drop" button (grays out when stock = 0)

### 3. **Product Pages**
Customer-facing pages display:
- Prominent stock availability section
- Progress bar showing remaining stock
- Contextual alerts (urgency messaging for low/out of stock)
- Disabled "Add to Cart" when out of stock

---

## 🧪 How to Test

### Step 1: View Test Product
1. Navigate to: http://localhost:3001
2. Go to **Kingdom → Products** page
3. Find "Oture G2000 Stereo Gaming Headset" (Product ID: 1)

**✅ This product now has stock data:**
- Total Stock: 100 units
- Available: 58 units
- Low Stock Threshold: 20 units
- Max Per Order: 50 units

### Step 2: Test Product Page
1. Click "View →" on the headset product
2. Scroll down to see the **Stock Availability** section
3. You should see:
   - 🟠 Orange/yellow themed card (because 58 is above threshold)
   - "IN STOCK" badge
   - "Available Units: 58 / 100"
   - "Max Per Order: 50 units"
   - Progress bar showing ~58% filled

### Step 3: Test Product Editor
1. Go to **Kingdom → Products**
2. Click "Edit →" on the headset product
3. Go to the **Pricing** tab
4. Scroll to the **Stock Management** section
5. You should see all 4 stock fields pre-filled

**Try editing:**
- Change "Currently Available" to `5` → Stock Status becomes "LOW STOCK" (orange)
- Change "Currently Available" to `0` → Stock Status becomes "OUT OF STOCK" (red)
- Watch the live preview update in real-time on the right side!

### Step 4: Test Live Preview
1. While editing, look at the right panel (Live Preview)
2. Scroll down in the preview to find the stock card
3. As you type in the stock fields, the preview updates immediately:
   - Try setting stock to 0 → "Join Drop" button turns gray and says "Out of Stock"
   - Try setting stock to 5 → Orange "LOW STOCK" warning appears
   - Try setting stock to 100 → Green "IN STOCK" status

### Step 5: Test Save & Verify
1. Make stock changes in the editor
2. Click "Save Changes"
3. Close the editor
4. Click "View →" to see the product page
5. Verify your stock changes appear on the live page

---

## 🎨 Color Coding System

| Stock Level | Color | Status Badge | Button State |
|-------------|-------|--------------|--------------|
| 0 units | 🔴 Red | OUT OF STOCK | Disabled (gray) |
| 1-20 units* | 🟠 Orange | LOW STOCK | Enabled (urgent) |
| 21+ units | 🔵 Cyan | IN STOCK | Enabled (normal) |

*Based on lowStockThreshold (default: 10, this test uses 20)

---

## 📝 Adding Stock to Other Products

To add stock management to any product:

1. **Via Editor:**
   - Open product in editor
   - Go to Pricing tab
   - Fill in Stock Management section
   - Save changes

2. **Via JSON (Manual):**
   Edit `public/data/products.json` and add:
   ```json
   {
     "id": X,
     "name": "...",
     "stock": 100,
     "stockAvailable": 75,
     "lowStockThreshold": 10,
     "maxOrderQuantity": 50
   }
   ```

---

## 🚨 Expected Behavior

### When Stock = 0:
- ❌ "Add to Cart" button disabled
- ❌ Shows "Out of Stock" text
- 🔴 Red alerts and badges
- 📧 Message suggests joining waitlist

### When Stock ≤ Threshold:
- ⚠️ "LOW STOCK" warning
- 🟠 Orange alerts and badges
- ✅ Can still purchase
- ⏰ Urgency messaging ("Only X units remaining!")

### When Stock > Threshold:
- ✅ Normal "Add to Cart" enabled
- 🔵 Cyan/blue styling
- ✅ Standard messaging

---

## 🔧 Technical Notes

- Stock fields are **optional** - products without stock data won't show the section
- `stockAvailable` defaults to `stock` if not set
- Progress bar calculates: `(stockAvailable / stock) * 100%`
- All stock fields save to `products.json` via API
- Real-time sync between editor, preview, and live pages

---

## ✨ Next Steps

You can now:
1. ✅ Add stock data to all products via the editor
2. ✅ Set appropriate thresholds for each product type
3. ✅ Monitor stock levels in product management
4. ✅ Customers see real-time stock availability
5. ✅ Prevent overselling in bulk buys!
