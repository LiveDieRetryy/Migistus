import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { db, isProduction } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get wallet balance and info
      if (isProduction()) {
        const balance = await db.getUserWalletBalance(session.userId);
        return res.status(200).json({ 
          wallet: { 
            balance, 
            userId: session.userId 
          } 
        });
      } else {
        const paymentStorage = (await import('@/utils/paymentStorage')).paymentStorage;
        const wallet = await paymentStorage.getWallet(session.userId);
        return res.status(200).json({ wallet });
      }

    } else if (req.method === 'POST') {
      // Transfer funds to another user
      const { recipientId, amount, description } = req.body;

      // Validation
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const transferAmount = parseFloat(amount);

      if (transferAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      if (!recipientId) {
        return res.status(400).json({ error: 'Recipient user ID required' });
      }

      if (recipientId === session.userId) {
        return res.status(400).json({ error: 'Cannot transfer to yourself' });
      }

      if (isProduction()) {
        try {
          await db.transferFunds(
            session.userId,
            parseInt(recipientId),
            transferAmount,
            description || 'Wallet transfer'
          );

          const newBalance = await db.getUserWalletBalance(session.userId);

          return res.status(200).json({ 
            success: true, 
            balance: newBalance,
            message: 'Transfer completed successfully'
          });
        } catch (error) {
          if (error instanceof Error && error.message === 'Insufficient funds') {
            return res.status(400).json({ error: 'Insufficient funds' });
          }
          throw error;
        }
      } else {
        // Development mode
        const UserStorage = (await import('@/utils/userStorage')).UserStorage3;
        
        // Check balance
        const senderBalance = UserStorage.getUserWalletBalance(session.userId);
        if (senderBalance < transferAmount) {
          return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Transfer
        UserStorage.decrementUserWallet(session.userId, transferAmount);
        UserStorage.incrementUserWallet(parseInt(recipientId), transferAmount);

        const newBalance = UserStorage.getUserWalletBalance(session.userId);

        return res.status(200).json({ 
          success: true, 
          balance: newBalance,
          message: 'Transfer completed successfully'
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Wallet API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
