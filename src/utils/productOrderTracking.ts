/**
 * Product Order Tracking System
 * Tracks which guild members have ordered which products
 * Ensures one order per guild member per product
 */

export interface ProductOrder {
  id: string;
  productId: number;
  userId: number;
  username: string;
  quantity: number;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

const ORDERS_FILE = '/data/product-orders.json';

/**
 * Check if a user has already ordered a specific product
 */
export async function hasUserOrdered(productId: number, userId: number): Promise<boolean> {
  try {
    const response = await fetch(ORDERS_FILE);
    if (!response.ok) {
      console.error('Failed to fetch orders');
      return false;
    }
    
    const orders: ProductOrder[] = await response.json();
    
    // Check if user has an active order for this product
    const existingOrder = orders.find(
      order => 
        order.productId === productId && 
        order.userId === userId &&
        order.status !== 'cancelled'
    );
    
    return !!existingOrder;
  } catch (error) {
    console.error('Error checking user order status:', error);
    return false;
  }
}

/**
 * Get user's order for a specific product
 */
export async function getUserOrder(productId: number, userId: number): Promise<ProductOrder | null> {
  try {
    const response = await fetch(ORDERS_FILE);
    if (!response.ok) {
      return null;
    }
    
    const orders: ProductOrder[] = await response.json();
    
    const order = orders.find(
      order => 
        order.productId === productId && 
        order.userId === userId &&
        order.status !== 'cancelled'
    );
    
    return order || null;
  } catch (error) {
    console.error('Error fetching user order:', error);
    return null;
  }
}

/**
 * Get all orders for a product
 */
export async function getProductOrders(productId: number): Promise<ProductOrder[]> {
  try {
    const response = await fetch(ORDERS_FILE);
    if (!response.ok) {
      return [];
    }
    
    const orders: ProductOrder[] = await response.json();
    return orders.filter(order => order.productId === productId);
  } catch (error) {
    console.error('Error fetching product orders:', error);
    return [];
  }
}

/**
 * Get count of active orders for a product
 */
export async function getActiveOrderCount(productId: number): Promise<number> {
  const orders = await getProductOrders(productId);
  return orders.filter(order => order.status !== 'cancelled').length;
}

/**
 * Get total quantity ordered for a product
 */
export async function getTotalOrderedQuantity(productId: number): Promise<number> {
  const orders = await getProductOrders(productId);
  return orders
    .filter(order => order.status !== 'cancelled')
    .reduce((total, order) => total + order.quantity, 0);
}

/**
 * Create a new order (called via API)
 */
export function createOrder(orderData: Omit<ProductOrder, 'id' | 'orderDate'>): ProductOrder {
  return {
    ...orderData,
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderDate: new Date().toISOString()
  };
}

/**
 * Check if user can order (hasn't ordered yet and quantity is valid)
 */
export async function canUserOrder(
  productId: number, 
  userId: number, 
  quantity: number, 
  maxPerGuildMember: number
): Promise<{ canOrder: boolean; reason?: string }> {
  // Check if user already has an order
  const hasOrdered = await hasUserOrdered(productId, userId);
  if (hasOrdered) {
    return {
      canOrder: false,
      reason: 'You have already placed an order for this product. Each guild member can only order once.'
    };
  }
  
  // Check quantity limit
  if (quantity > maxPerGuildMember) {
    return {
      canOrder: false,
      reason: `Maximum ${maxPerGuildMember} units per guild member. Please reduce your quantity.`
    };
  }
  
  if (quantity < 1) {
    return {
      canOrder: false,
      reason: 'Quantity must be at least 1.'
    };
  }
  
  return { canOrder: true };
}
