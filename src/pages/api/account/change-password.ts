import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/session';

const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');

function readUsers() {
  try {
    const fileContent = fs.readFileSync(usersPath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.users || [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    const data = { users };
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
    throw new Error('Failed to save user data');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Require authentication
  const session = requireAuth(req, res);
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
    const users = readUsers();
    const userIndex = users.findIndex((u: any) => u.id === session.userId);

    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const user = users[userIndex];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    users[userIndex] = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };

    // Save to file
    writeUsers(users);

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
