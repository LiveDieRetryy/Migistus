import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const walletsFilePath = path.join(process.cwd(), 'public', 'data', 'wallets.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Ensure the file exists
    if (!fs.existsSync(walletsFilePath)) {
      const initialData = { wallets: [] };
      fs.writeFileSync(walletsFilePath, JSON.stringify(initialData, null, 2));
    }

    const fileContent = fs.readFileSync(walletsFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (req.method === 'GET') {
      // Find user's wallet
      const userWallet = data.wallets.find((w: any) => w.userId === userId);
      
      if (!userWallet) {
        return res.status(200).json({ transactions: [] });
      }

      // Get transactions and sort by date (newest first)
      const transactions = userWallet.transactions || [];
      const sortedTransactions = transactions.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.status(200).json({ 
        transactions: sortedTransactions,
        balance: userWallet.balance || 0
      });

    } else if (req.method === 'POST') {
      // Add new transaction
      const { type, amount, description, recipient, transactionId } = req.body;

      if (!type || !amount) {
        return res.status(400).json({ error: 'Type and amount are required' });
      }

      // Find or create user wallet
      let userWallet = data.wallets.find((w: any) => w.userId === userId);
      
      if (!userWallet) {
        userWallet = {
          userId,
          balance: 0,
          transactions: []
        };
        data.wallets.push(userWallet);
      }

      // Create transaction record
      const transaction = {
        id: transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type, // 'deposit', 'withdrawal', 'transfer_sent', 'transfer_received', 'pledge', 'refund'
        amount: parseFloat(amount),
        description,
        recipient,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };

      // Update balance based on transaction type
      if (type === 'deposit' || type === 'transfer_received' || type === 'refund') {
        userWallet.balance = (userWallet.balance || 0) + transaction.amount;
      } else if (type === 'withdrawal' || type === 'transfer_sent' || type === 'pledge') {
        userWallet.balance = (userWallet.balance || 0) - transaction.amount;
      }

      // Add transaction to history
      userWallet.transactions = userWallet.transactions || [];
      userWallet.transactions.push(transaction);

      // Save to file
      fs.writeFileSync(walletsFilePath, JSON.stringify(data, null, 2));

      res.status(201).json({ 
        transaction,
        newBalance: userWallet.balance
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
