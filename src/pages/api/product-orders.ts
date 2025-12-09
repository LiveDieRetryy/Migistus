import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const ordersFilePath = path.join(process.cwd(), 'public/data/product-orders.json');

interface ProductOrder {
  id: string;
  productId: number;
  userId: number;
  username: string;
  quantity: number;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add cache-busting headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Read orders file
    let orders: ProductOrder[] = [];
    if (fs.existsSync(ordersFilePath)) {
      const ordersData = fs.readFileSync(ordersFilePath, 'utf-8');
      orders = JSON.parse(ordersData);
    }

    if (req.method === 'GET') {
      const { productId, userId } = req.query;

      // Get specific user's order for a product
      if (productId && userId) {
        const order = orders.find(
          o => 
            o.productId === Number(productId) && 
            o.userId === Number(userId) &&
            o.status !== 'cancelled'
        );
        return res.status(200).json({ order: order || null });
      }

      // Get all orders for a product
      if (productId) {
        const productOrders = orders.filter(o => o.productId === Number(productId));
        return res.status(200).json({ orders: productOrders });
      }

      // Get all orders for a user
      if (userId) {
        const userOrders = orders.filter(o => o.userId === Number(userId));
        return res.status(200).json({ orders: userOrders });
      }

      // Return all orders
      return res.status(200).json({ orders });
    }

    if (req.method === 'POST') {
      const { productId, userId, username, quantity } = req.body;

      if (!productId || !userId || !username || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already has an order for this product
      const existingOrder = orders.find(
        o => 
          o.productId === Number(productId) && 
          o.userId === Number(userId) &&
          o.status !== 'cancelled'
      );

      if (existingOrder) {
        return res.status(400).json({ 
          error: 'You have already placed an order for this product',
          order: existingOrder
        });
      }

      // Create new order
      const newOrder: ProductOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: Number(productId),
        userId: Number(userId),
        username,
        quantity: Number(quantity),
        orderDate: new Date().toISOString(),
        status: 'pending'
      };

      orders.push(newOrder);

      // Save to file
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));

      return res.status(201).json({ order: newOrder });
    }

    if (req.method === 'PUT') {
      const { orderId, status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      orders[orderIndex].status = status;

      // Save to file
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));

      return res.status(200).json({ order: orders[orderIndex] });
    }

    if (req.method === 'DELETE') {
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID required' });
      }

      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Mark as cancelled instead of deleting
      orders[orderIndex].status = 'cancelled';

      // Save to file
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));

      return res.status(200).json({ message: 'Order cancelled', order: orders[orderIndex] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Product orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
