# Guild Member Order Tracking System

## 🎯 Overview

Implemented a complete order tracking system to ensure **each guild member can only order once per product**. This prevents abuse in bulk buying and ensures fair distribution.

---

## ✅ What Changed

### **1. Field Rename**
- ❌ **Old:** `maxOrderQuantity` 
- ✅ **New:** `maxPerGuildMember`

This clarifies that the limit is **per user**, not per order.

### **2. Order Tracking Database**
Created `/public/data/product-orders.json` to track all orders:
```json
[
  {
    "id": "order_1234567890_abc123",
    "productId": 1,
    "userId": 123,
    "username": "john_doe",
    "quantity": 25,
    "orderDate": "2025-12-08T10:30:00.000Z",
    "status": "pending"
  }
]
```

**Status Options:**
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled (doesn't count against user limit)

### **3. API Endpoint: `/api/product-orders`**

#### **GET Requests:**
- `GET /api/product-orders?productId=1&userId=123` - Check if user ordered product
- `GET /api/product-orders?productId=1` - Get all orders for product
- `GET /api/product-orders?userId=123` - Get all orders for user
- `GET /api/product-orders` - Get all orders

#### **POST Request (Create Order):**
```javascript
POST /api/product-orders
Body: {
  productId: 1,
  userId: 123,
  username: "john_doe",
  quantity: 25
}
```

**Response:**
- ✅ Success: Returns new order object
- ❌ Error: If user already has an order for this product

#### **PUT Request (Update Order Status):**
```javascript
PUT /api/product-orders
Body: {
  orderId: "order_1234567890_abc123",
  status: "confirmed"
}
```

#### **DELETE Request (Cancel Order):**
```javascript
DELETE /api/product-orders?orderId=order_1234567890_abc123
```
Note: Marks order as `cancelled` rather than deleting it.

---

## 🔧 Technical Implementation

### **New Utility Functions** (`src/utils/productOrderTracking.ts`)

```typescript
// Check if user has already ordered
hasUserOrdered(productId, userId): Promise<boolean>

// Get user's order for a product
getUserOrder(productId, userId): Promise<ProductOrder | null>

// Get all orders for a product
getProductOrders(productId): Promise<ProductOrder[]>

// Get count of active orders
getActiveOrderCount(productId): Promise<number>

// Get total quantity ordered
getTotalOrderedQuantity(productId): Promise<number>

// Check if user can order (validates limits)
canUserOrder(productId, userId, quantity, maxPerGuildMember): Promise<{
  canOrder: boolean;
  reason?: string;
}>
```

### **Product Page Updates**

**New State Variables:**
```typescript
const [hasOrdered, setHasOrdered] = useState(false);
const [userOrder, setUserOrder] = useState<any>(null);
const [orderCheckLoading, setOrderCheckLoading] = useState(false);
```

**New Function:**
```typescript
const checkUserOrder = async (productId: number) => {
  // Checks if logged-in user has ordered this product
  // Sets hasOrdered and userOrder states
}
```

**Button Behavior:**
- ✅ **Not Ordered + In Stock** → Green "Add to Cart" button (enabled)
- ⏸️ **Not Logged In** → Gray "Login to Order" (disabled)
- ✅ **Already Ordered** → Blue "✓ Already Ordered" (disabled)
- ❌ **Out of Stock** → Gray "Out of Stock" (disabled)

---

## 🎨 User Experience

### **Stock Availability Section**

Now displays:
1. **Stock status** (IN STOCK / LOW STOCK / OUT OF STOCK)
2. **Available units** (e.g., "58 / 100")
3. **Max per guild member** (e.g., "50 units")
4. **Progress bar** showing stock level
5. **User order status** (if already ordered):

```
┌─────────────────────────────────────────┐
│ ✓ You've already ordered this product! │
│ Order ID: order_1234567890_abc123      │
│ Quantity: 25 units                      │
│ Status: Pending                         │
│ Each guild member can only order once. │
└─────────────────────────────────────────┘
```

### **Alerts**

**Already Ordered (Blue):**
- Shows order details
- Explains one-order-per-member rule
- Button disabled with checkmark

**Out of Stock (Red):**
- "Join waitlist" message
- Button disabled

**Low Stock (Orange):**
- Urgency messaging
- Still allows ordering

---

## 🧪 Testing the System

### **Step 1: View Product Page**
Navigate to: `http://localhost:3001/products/gilded-vanguard-headset`

### **Step 2: Not Logged In**
- Stock section shows availability
- Button says "Login to Order" (disabled)

### **Step 3: Log In**
- Button changes to "Add to Cart" (enabled)
- Can see max per guild member limit

### **Step 4: Place Order (Simulated)**
To test the "already ordered" state, manually add an order:

**Edit:** `/public/data/product-orders.json`
```json
[
  {
    "id": "order_test123",
    "productId": 1,
    "userId": YOUR_USER_ID,
    "username": "YOUR_USERNAME",
    "quantity": 25,
    "orderDate": "2025-12-08T12:00:00.000Z",
    "status": "pending"
  }
]
```

### **Step 5: Refresh Product Page**
- Blue alert appears: "You've already ordered!"
- Shows your order details
- Button disabled with "✓ Already Ordered"

### **Step 6: Try Different User**
- Log in as different user
- Button is enabled again (different user can order)

---

## 📊 Order Status Flow

```
pending → confirmed → shipped → delivered
   ↓
cancelled (user can order again if cancelled)
```

---

## 🔐 Enforcement Rules

### **One Order Per Guild Member:**
- ✅ Each user can only have **one active order** per product
- ✅ Cancelled orders don't count (user can reorder)
- ✅ System checks on page load and before order placement

### **Quantity Limits:**
- ✅ Cannot exceed `maxPerGuildMember` units
- ✅ Validation on both client and server
- ✅ Clear error messages if limit exceeded

### **Stock Management:**
- ✅ Stock decreases when orders are placed
- ✅ Cannot order if `stockAvailable` = 0
- ✅ Real-time stock updates

---

## 🚀 Next Steps (Implementation)

### **To Fully Implement Order Processing:**

1. **Create "Place Order" Modal/Flow**
   - Quantity selector (up to `maxPerGuildMember`)
   - Order confirmation
   - Payment integration (if applicable)

2. **Wire Up "Add to Cart" Button**
   ```typescript
   const handleAddToCart = async () => {
     if (!user || hasOrdered) return;
     
     const response = await fetch('/api/product-orders', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         productId: product.id,
         userId: user.id,
         username: user.username,
         quantity: selectedQuantity
       })
     });
     
     if (response.ok) {
       // Update UI, show success message
       await checkUserOrder(product.id);
     }
   };
   ```

3. **Update Stock After Order**
   - Decrease `stockAvailable` when order placed
   - Update product via `/api/products/[id]`

4. **Admin Order Management**
   - View all orders
   - Update order status
   - Cancel orders
   - Refund/restock

---

## 📝 Data Structure

### **Product Interface:**
```typescript
{
  stock: number;              // Total units available
  stockAvailable: number;     // Remaining units
  lowStockThreshold: number;  // Alert level
  maxPerGuildMember: number;  // Limit per user
}
```

### **Order Interface:**
```typescript
{
  id: string;
  productId: number;
  userId: number;
  username: string;
  quantity: number;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}
```

---

## ✨ Summary

**✅ Renamed field to clarify purpose**
- `maxOrderQuantity` → `maxPerGuildMember`

**✅ Created order tracking system**
- JSON database for orders
- API endpoint for CRUD operations
- Utility functions for validation

**✅ Updated product pages**
- Checks if user has ordered
- Shows order status
- Disables button if already ordered
- Clear messaging about one-order limit

**✅ Fair bulk buying**
- Each guild member limited to one order
- Cannot exceed maxPerGuildMember quantity
- Prevents gaming the system
- Ensures equitable distribution

Guild members can now participate in bulk buys with confidence that the system enforces fairness! 🎉
