import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const USERS_PATH = path.resolve('public/data/users.json');

function ensureUsersFile() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      const dir = path.dirname(USERS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(USERS_PATH, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring users file:', error);
  }
}

function readUsers() {
  try {
    ensureUsersFile();
    const fileContent = fs.readFileSync(USERS_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (Array.isArray(data)) return data;
    if (data.users && Array.isArray(data.users)) return data.users;
    return [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    ensureUsersFile();
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    if (userId) {
      // Get specific user
      const users = readUsers();
      const user = users.find((u: any) => u.id === parseInt(userId as string));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json(user);
    } else {
      // Get all users
      const users = readUsers();
      res.status(200).json({ users });
    }
  } else if (req.method === 'PUT' && userId) {
    // Update specific user
    const users = readUsers();
    const userIndex = users.findIndex((u: any) => u.id === parseInt(userId as string));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = { ...users[userIndex], ...req.body, updatedAt: new Date().toISOString() };
    users[userIndex] = updatedUser;
    
    if (writeUsers(users)) {
      res.status(200).json({ success: true, user: updatedUser });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE' && userId) {
    // Delete specific user
    const users = readUsers();
    const userIndex = users.findIndex((u: any) => u.id === parseInt(userId as string));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    
    if (writeUsers(users)) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else if (req.method === 'POST') {
    // Create new user
    const users = readUsers();
    const newUser = {
      ...req.body,
      id: Math.max(0, ...users.map((u: any) => u.id || 0)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    if (writeUsers(users)) {
      res.status(201).json({ success: true, user: newUser });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
