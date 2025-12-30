import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionFromRequest } from '@/lib/session';
import { db, isProduction } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    if (method === 'GET') {
      if (isProduction()) {
        const balance = await db.getUserWalletBalance(session.userId);
        return res.status(200).json({ 
          balance, 
          userId: session.userId 
        });
      } else {
        // Development mode - use file storage
        const UserStorage = (await import('@/utils/userStorage')).UserStorage3;
        const balance = UserStorage.getUserWalletBalance(session.userId);
        return res.status(200).json({ 
          balance, 
          userId: session.userId 
        });
      }
    } 
    
    else if (method === 'POST') {
      const { amount, type, description } = req.body;
      
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      if (!['deposit', 'withdrawal'].includes(type)) {
        return res.status(400).json({ error: 'Type must be deposit or withdrawal' });
      }

      if (isProduction()) {
        // For withdrawals, verify sufficient balance
        if (type === 'withdrawal') {
          const currentBalance = await db.getUserWalletBalance(session.userId);
          if (Number(currentBalance) < Math.abs(amount)) {
            return res.status(400).json({ error: 'Insufficient funds' });
          }
        }

        const transaction = await db.addWalletTransaction({
          userId: session.userId,
          amount: type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount),
          type: type as 'deposit' | 'withdrawal',
          description: description || `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} via wallet page`
        });

        return res.status(200).json({ 
          success: true,
          balance: transaction.balance_after,
          transaction
        });
      } else {
        // Development mode
        const UserStorage = (await import('@/utils/userStorage')).UserStorage3;
        if (type === 'deposit') {
          UserStorage.incrementUserWallet(session.userId, Math.abs(amount));
        } else {
          UserStorage.decrementUserWallet(session.userId, Math.abs(amount));
        }
        const newBalance = UserStorage.getUserWalletBalance(session.userId);
        return res.status(200).json({ 
          success: true,
          balance: newBalance
        });
      }
    }
    
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

  } catch (error) {
    console.error('Wallet balance API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
