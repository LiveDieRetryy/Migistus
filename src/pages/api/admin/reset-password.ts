import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }
  
  // Only allow admin (user ID 1) to reset passwords
  if (session.userId !== 1) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }

  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db.updateUser(userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Admin reset password for user ${userId} (${user.username})`);

    return res.status(200).json({ 
      success: true,
      message: 'Password reset successfully',
      username: user.username
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

export default handler;
