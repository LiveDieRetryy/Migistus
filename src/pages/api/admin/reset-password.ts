import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/session';

const usersFilePath = path.join(process.cwd(), 'public', 'data', 'users.json');

// Helper to read users from file
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users.json:', error);
    return { users: [] };
  }
};

// Helper to write users to file
const writeUsers = (usersData: any) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users.json:', error);
    throw error;
  }
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require authentication
  const session = requireAuth(req, res);
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
    const usersData = readUsers();
    const userIndex = usersData.users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    usersData.users[userIndex].password = hashedPassword;
    usersData.users[userIndex].updatedAt = new Date().toISOString();

    // Save to file
    writeUsers(usersData);

    console.log(`✅ Admin reset password for user ${userId} (${usersData.users[userIndex].username})`);

    return res.status(200).json({ 
      success: true,
      message: 'Password reset successfully',
      username: usersData.users[userIndex].username
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

export default handler;
