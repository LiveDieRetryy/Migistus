import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

function getWalletsFromStorage(): Record<number, any> {
  const filePath = path.resolve("public/data/wallets.json");
  if (!fs.existsSync(filePath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

declare global {
  // eslint-disable-next-line no-var
  var balanceUpdates: any[] | undefined;
  // eslint-disable-next-line no-var
  var walletsStore: Record<number, any> | undefined;
}

type WalletBalance = {
  userId: number;
  guildTokens: number;
  migistusCoins: number;
  lastUpdated: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { userId } = req.query;

  if (method === 'GET') {
    try {
      const balance = getWalletBalance(Number(userId));
      res.status(200).json(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  } else if (method === 'POST') {
    try {
      const { guildTokens, migistusCoins, operation } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const updatedBalance = updateWalletBalance(
        Number(userId), 
        guildTokens || 0, 
        migistusCoins || 0, 
        operation || 'add'
      );

      // Broadcast update to all connected clients
      broadcastBalanceUpdate(Number(userId), updatedBalance);

      res.status(200).json(updatedBalance);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      res.status(500).json({ error: 'Failed to update wallet balance' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function getWalletBalance(userId: number): WalletBalance {
  const wallets = getWalletsFromStorage();
  
  return wallets[userId] || {
    userId,
    guildTokens: 0,
    migistusCoins: 0,
    lastUpdated: new Date().toISOString()
  };
}

function updateWalletBalance(
  userId: number,
  amount: number,
  migistusCoins: number,
  operation: 'add' | 'subtract' | 'set' = 'add'
): WalletBalance {
  const wallets = getWalletsFromStorage();
  const currentBalance = wallets[userId] || {
    userId,
    balance: 0,
    migistusCoins: 0,
  };

  let newBalance = { ...currentBalance };

  if (operation === "add") {
    newBalance.balance += amount;
    newBalance.migistusCoins += migistusCoins;
  } else if (operation === "subtract") {
    newBalance.balance = Math.max(0, newBalance.balance - amount);
    newBalance.migistusCoins = Math.max(0, newBalance.migistusCoins - migistusCoins);
  } else if (operation === "set") {
    newBalance.balance = amount;
    newBalance.migistusCoins = migistusCoins;
  }

  wallets[userId] = newBalance;
  setWalletsToStorage(wallets);

  return newBalance; // <-- Ensure you always return a WalletBalance
}

function broadcastBalanceUpdate(userId: number, balance: WalletBalance) {
  // Store the update in a global broadcast queue
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.balanceUpdates) {
      globalThis.balanceUpdates = [];
    }
    globalThis.balanceUpdates.push({
      userId,
      balance,
      timestamp: Date.now()
    });

    // Keep only recent updates (last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (typeof global !== 'undefined') {
      if (!global.balanceUpdates) {
        global.balanceUpdates = [];
      }
      // Now it's safe to use .filter
      global.balanceUpdates = global.balanceUpdates.filter(
        (update: any) => update.timestamp > fiveMinutesAgo
      );
    }
  }
}

function setWalletsToStorage(wallets: Record<number, WalletBalance>): void {
  if (typeof global !== 'undefined') {
    (global as any).walletsStore = wallets;
  }
  // ...existing code for persisting to file if needed...
}
