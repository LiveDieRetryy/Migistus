import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getSessionToken, getSession } from '@/lib/session';

const votesPath = path.join(process.cwd(), 'public', 'data', 'votes.json');
const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');

interface Vote {
  id: number;
  productId: number;
  userId: number;
  userName?: string;
  tier?: string;
  value: number;
  timestamp: string;
}

interface Product {
  id: number;
  votes?: number;
  [key: string]: any;
}

const ensureFile = (filePath: string, defaultContent: any) => {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
};

const getVotes = (): Vote[] => {
  try {
    ensureFile(votesPath, { votes: [] });
    const data = JSON.parse(fs.readFileSync(votesPath, 'utf8'));
    return Array.isArray(data) ? data : (data.votes || []);
  } catch (error) {
    console.error('Error reading votes:', error);
    return [];
  }
};

const saveVotes = (votes: Vote[]) => {
  fs.writeFileSync(votesPath, JSON.stringify({ votes }, null, 2));
};

const getProducts = (): Product[] => {
  try {
    const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading products:', error);
    return [];
  }
};

const saveProducts = (products: Product[]) => {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
};

const getUserFromSession = async (req: NextApiRequest): Promise<{ userId: number; userName: string } | null> => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) return null;
    
    const session = await getSession(sessionToken);
    if (!session) return null;
    
    return {
      userId: session.userId,
      userName: session.username
    };
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

const updateUserVoteCount = (userId: number) => {
  try {
    if (!fs.existsSync(usersPath)) return;
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      const allVotes = getVotes();
      const userVoteCount = allVotes.filter(v => v.userId === userId).length;
      users[userIndex].votesCount = userVoteCount;
      users[userIndex].totalVotes = userVoteCount; // Compatibility
      
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }
  } catch (error) {
    console.error('Error updating user vote count:', error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Get all votes or check if user has voted for a specific product
  if (req.method === 'GET') {
    try {
      const { productId, userId } = req.query;
      const votes = getVotes();
      
      // If no parameters, return all votes
      if (!productId && !userId) {
        return res.status(200).json(votes);
      }
      
      // If both productId and userId provided, check specific vote
      if (productId && userId) {
        const userVote = votes.find(
          v => v.productId === parseInt(productId as string) && v.userId === parseInt(userId as string)
        );

        return res.status(200).json({
          hasVoted: !!userVote,
          vote: userVote || null
        });
      }

      // If only one parameter provided
      return res.status(400).json({ error: 'Both productId and userId are required to check specific vote' });
    } catch (error) {
      console.error('Error checking vote:', error);
      return res.status(500).json({ error: 'Failed to check vote status' });
    }
  }

  // POST - Submit a vote
  if (req.method === 'POST') {
    try {
      const userSession = await getUserFromSession(req);

      if (!userSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { productId, tier, value } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const votes = getVotes();
      
      // Check if user already voted for this product
      const existingVote = votes.find(
        v => v.productId === productId && v.userId === userSession.userId
      );

      if (existingVote) {
        return res.status(400).json({ 
          error: 'You have already voted for this product',
          hasVoted: true
        });
      }

      // Create new vote
      const newVote: Vote = {
        id: votes.length > 0 ? Math.max(...votes.map(v => v.id)) + 1 : 1,
        productId,
        userId: userSession.userId,
        userName: userSession.userName,
        tier: tier || 'Initiate',
        value: value || 1,
        timestamp: new Date().toISOString()
      };

      votes.push(newVote);
      saveVotes(votes);

      // Update product vote count
      const products = getProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        const productVotes = votes.filter(v => v.productId === productId);
        products[productIndex].votes = productVotes.length;
        saveProducts(products);
      }

      // Update user's total vote count in their profile
      updateUserVoteCount(userSession.userId);

      return res.status(201).json({
        success: true,
        vote: newVote,
        productVotes: votes.filter(v => v.productId === productId).length
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      return res.status(500).json({ error: 'Failed to submit vote' });
    }
  }

  // DELETE - Remove a vote (optional feature)
  if (req.method === 'DELETE') {
    try {
      const userSession = await getUserFromSession(req);

      if (!userSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const votes = getVotes();
      const voteIndex = votes.findIndex(
        v => v.productId === productId && v.userId === userSession.userId
      );

      if (voteIndex === -1) {
        return res.status(404).json({ error: 'Vote not found' });
      }

      votes.splice(voteIndex, 1);
      saveVotes(votes);

      // Update product vote count
      const products = getProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        const productVotes = votes.filter(v => v.productId === productId);
        products[productIndex].votes = productVotes.length;
        saveProducts(products);
      }

      // Update user's total vote count
      updateUserVoteCount(userSession.userId);

      return res.status(200).json({
        success: true,
        message: 'Vote removed successfully',
        productVotes: votes.filter(v => v.productId === productId).length
      });
    } catch (error) {
      console.error('Error removing vote:', error);
      return res.status(500).json({ error: 'Failed to remove vote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
