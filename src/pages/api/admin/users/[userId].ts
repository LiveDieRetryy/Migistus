import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    try {
      if (userId) {
        // Get specific user
        const user = await db.getUserById(parseInt(userId as string));
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
      } else {
        // Get all users
        const users = await db.getAllUsers();
        res.status(200).json({ users });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'PUT' && userId) {
    try {
      // Update specific user
      const user = await db.getUserById(parseInt(userId as string));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await db.updateUser(parseInt(userId as string), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE' && userId) {
    try {
      // Delete specific user
      const user = await db.getUserById(parseInt(userId as string));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await db.deleteUser(parseInt(userId as string));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else if (req.method === 'POST') {
    try {
      // Create new user
      const newUser = await db.createUser({
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      res.status(201).json({ success: true, user: newUser });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
