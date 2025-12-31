import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false,
      error: 'Current password and new password are required' 
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false,
      error: 'New password must be at least 8 characters long' 
    });
  }

  try {
    const user = await db.getUserById(session.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.updateUser(session.userId, { passwordHash: hashedPassword });

    console.log(`✅ Password changed successfully for user ${session.userId}`);

    return res.status(200).json({ 
      success: true,
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to change password. Please try again.' 
    });
  }
}
