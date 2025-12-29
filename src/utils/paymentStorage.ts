import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'payments');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// File-based storage helpers
async function readJsonFile(filename: string) {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeJsonFile(filename: string, data: any) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Database implementation
class DatabasePaymentStorage {
  // Payment Methods
  async addPaymentMethod(data: {
    userId: number;
    type: string;
    provider: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
    token: string;
  }) {
    return await db.addPaymentMethod(data);
  }

  async getUserPaymentMethods(userId: number) {
    return await db.getUserPaymentMethods(userId);
  }

  async getPaymentMethod(id: number) {
    return await db.getPaymentMethod(id);
  }

  async setDefaultPaymentMethod(id: number, userId: number) {
    return await db.setDefaultPaymentMethod(id, userId);
  }

  async deletePaymentMethod(id: number, userId: number) {
    return await db.deletePaymentMethod(id, userId);
  }

  // Transactions
  async createTransaction(data: {
    userId: number;
    type: string;
    amount: number;
    currency?: string;
    status?: string;
    paymentMethodId?: number;
    orderId?: number;
    description?: string;
    metadata?: any;
  }) {
    return await db.createTransaction(data);
  }

  async getTransaction(id: number) {
    return await db.getTransaction(id);
  }

  async getUserTransactions(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getUserTransactions(userId, limit, offset);
  }

  async updateTransactionStatus(id: number, status: string, metadata?: any) {
    return await db.updateTransactionStatus(id, status, metadata);
  }

  async getTransactionsByOrder(orderId: number) {
    return await db.getTransactionsByOrder(orderId);
  }

  // Subscriptions
  async createSubscription(data: {
    userId: number;
    planId: string;
    status?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    return await db.createSubscription(data);
  }

  async getUserSubscription(userId: number) {
    return await db.getUserSubscription(userId);
  }

  async updateSubscription(id: number, data: {
    status?: string;
    planId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    return await db.updateSubscription(id, data);
  }

  async cancelSubscription(id: number, cancelAtPeriodEnd: boolean = true) {
    return await db.cancelSubscription(id, cancelAtPeriodEnd);
  }

  // Invoices
  async createInvoice(data: {
    userId: number;
    subscriptionId?: number;
    orderId?: number;
    amount: number;
    currency?: string;
    status?: string;
    dueDate?: string;
    items: any[];
  }) {
    return await db.createInvoice(data);
  }

  async getInvoice(id: number) {
    return await db.getInvoice(id);
  }

  async getUserInvoices(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getUserInvoices(userId, limit, offset);
  }

  async updateInvoiceStatus(id: number, status: string, paidAt?: string) {
    return await db.updateInvoiceStatus(id, status, paidAt);
  }

  // Payouts
  async createPayout(data: {
    userId: number;
    amount: number;
    currency?: string;
    status?: string;
    method?: string;
    destination?: string;
  }) {
    return await db.createPayout(data);
  }

  async getPayout(id: number) {
    return await db.getPayout(id);
  }

  async getUserPayouts(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getUserPayouts(userId, limit, offset);
  }

  async updatePayoutStatus(id: number, status: string, processedAt?: string) {
    return await db.updatePayoutStatus(id, status, processedAt);
  }

  async getPendingPayouts(limit: number = 50) {
    return await db.getPendingPayouts(limit);
  }

  // Wallet
  async getWallet(userId: number) {
    return await db.getWallet(userId);
  }

  async updateWalletBalance(userId: number, amount: number, type: string, description?: string) {
    return await db.updateWalletBalance(userId, amount, type, description);
  }

  async getWalletTransactions(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getWalletTransactions(userId, limit, offset);
  }

  // Refunds
  async createRefund(data: {
    transactionId: number;
    amount: number;
    reason?: string;
    status?: string;
  }) {
    return await db.createRefund(data);
  }

  async getRefund(id: number) {
    return await db.getRefund(id);
  }

  async updateRefundStatus(id: number, status: string, processedAt?: string) {
    return await db.updateRefundStatus(id, status, processedAt);
  }

  async getTransactionRefunds(transactionId: number) {
    return await db.getTransactionRefunds(transactionId);
  }
}

// File-based storage implementation
class FilePaymentStorage {
  // Payment Methods
  async addPaymentMethod(data: {
    userId: number;
    type: string;
    provider: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
    token: string;
  }) {
    const methods = await readJsonFile('payment_methods.json');
    
    // If default, unset other defaults
    if (data.isDefault) {
      methods.forEach((m: any) => {
        if (m.userId === data.userId) m.isDefault = false;
      });
    }

    const newMethod = {
      id: methods.length + 1,
      userId: data.userId,
      type: data.type,
      provider: data.provider,
      last4: data.last4 || null,
      expiryMonth: data.expiryMonth || null,
      expiryYear: data.expiryYear || null,
      isDefault: data.isDefault || false,
      token: data.token,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    methods.push(newMethod);
    await writeJsonFile('payment_methods.json', methods);
    return newMethod;
  }

  async getUserPaymentMethods(userId: number) {
    const methods = await readJsonFile('payment_methods.json');
    return methods
      .filter((m: any) => m.userId === userId && m.isActive)
      .sort((a: any, b: any) => {
        if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getPaymentMethod(id: number) {
    const methods = await readJsonFile('payment_methods.json');
    return methods.find((m: any) => m.id === id) || null;
  }

  async setDefaultPaymentMethod(id: number, userId: number) {
    const methods = await readJsonFile('payment_methods.json');
    
    methods.forEach((m: any) => {
      if (m.userId === userId) m.isDefault = false;
      if (m.id === id) m.isDefault = true;
    });

    await writeJsonFile('payment_methods.json', methods);
    return methods.find((m: any) => m.id === id) || null;
  }

  async deletePaymentMethod(id: number, userId: number) {
    const methods = await readJsonFile('payment_methods.json');
    const method = methods.find((m: any) => m.id === id && m.userId === userId);
    if (method) {
      method.isActive = false;
      await writeJsonFile('payment_methods.json', methods);
    }
  }

  // Transactions
  async createTransaction(data: {
    userId: number;
    type: string;
    amount: number;
    currency?: string;
    status?: string;
    paymentMethodId?: number;
    orderId?: number;
    description?: string;
    metadata?: any;
  }) {
    const transactions = await readJsonFile('transactions.json');
    const newTransaction = {
      id: transactions.length + 1,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status || 'pending',
      paymentMethodId: data.paymentMethodId || null,
      orderId: data.orderId || null,
      description: data.description || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.push(newTransaction);
    await writeJsonFile('transactions.json', transactions);
    return newTransaction;
  }

  async getTransaction(id: number) {
    const transactions = await readJsonFile('transactions.json');
    return transactions.find((t: any) => t.id === id) || null;
  }

  async getUserTransactions(userId: number, limit: number = 50, offset: number = 0) {
    const transactions = await readJsonFile('transactions.json');
    return transactions
      .filter((t: any) => t.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async updateTransactionStatus(id: number, status: string, metadata?: any) {
    const transactions = await readJsonFile('transactions.json');
    const transaction = transactions.find((t: any) => t.id === id);
    
    if (transaction) {
      transaction.status = status;
      if (metadata) {
        transaction.metadata = { ...transaction.metadata, ...metadata };
      }
      transaction.updatedAt = new Date().toISOString();
      await writeJsonFile('transactions.json', transactions);
      return transaction;
    }
    
    return null;
  }

  async getTransactionsByOrder(orderId: number) {
    const transactions = await readJsonFile('transactions.json');
    return transactions
      .filter((t: any) => t.orderId === orderId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Subscriptions
  async createSubscription(data: {
    userId: number;
    planId: string;
    status?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    const subscriptions = await readJsonFile('subscriptions.json');
    const newSubscription = {
      id: subscriptions.length + 1,
      userId: data.userId,
      planId: data.planId,
      status: data.status || 'active',
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      canceledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    subscriptions.push(newSubscription);
    await writeJsonFile('subscriptions.json', subscriptions);
    return newSubscription;
  }

  async getUserSubscription(userId: number) {
    const subscriptions = await readJsonFile('subscriptions.json');
    const activeSubs = subscriptions
      .filter((s: any) => s.userId === userId && (s.status === 'active' || s.status === 'trialing'))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return activeSubs[0] || null;
  }

  async updateSubscription(id: number, data: {
    status?: string;
    planId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    const subscriptions = await readJsonFile('subscriptions.json');
    const subscription = subscriptions.find((s: any) => s.id === id);
    
    if (subscription) {
      if (data.status !== undefined) subscription.status = data.status;
      if (data.planId !== undefined) subscription.planId = data.planId;
      if (data.currentPeriodStart !== undefined) subscription.currentPeriodStart = data.currentPeriodStart;
      if (data.currentPeriodEnd !== undefined) subscription.currentPeriodEnd = data.currentPeriodEnd;
      if (data.cancelAtPeriodEnd !== undefined) subscription.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
      subscription.updatedAt = new Date().toISOString();
      
      await writeJsonFile('subscriptions.json', subscriptions);
      return subscription;
    }
    
    return null;
  }

  async cancelSubscription(id: number, cancelAtPeriodEnd: boolean = true) {
    const subscriptions = await readJsonFile('subscriptions.json');
    const subscription = subscriptions.find((s: any) => s.id === id);
    
    if (subscription) {
      subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
      if (!cancelAtPeriodEnd) {
        subscription.status = 'canceled';
      }
      subscription.canceledAt = new Date().toISOString();
      subscription.updatedAt = new Date().toISOString();
      
      await writeJsonFile('subscriptions.json', subscriptions);
      return subscription;
    }
    
    return null;
  }

  // Invoices
  async createInvoice(data: {
    userId: number;
    subscriptionId?: number;
    orderId?: number;
    amount: number;
    currency?: string;
    status?: string;
    dueDate?: string;
    items: any[];
  }) {
    const invoices = await readJsonFile('invoices.json');
    const newInvoice = {
      id: invoices.length + 1,
      userId: data.userId,
      subscriptionId: data.subscriptionId || null,
      orderId: data.orderId || null,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status || 'pending',
      dueDate: data.dueDate || null,
      items: data.items,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    invoices.push(newInvoice);
    await writeJsonFile('invoices.json', invoices);
    return newInvoice;
  }

  async getInvoice(id: number) {
    const invoices = await readJsonFile('invoices.json');
    return invoices.find((i: any) => i.id === id) || null;
  }

  async getUserInvoices(userId: number, limit: number = 50, offset: number = 0) {
    const invoices = await readJsonFile('invoices.json');
    return invoices
      .filter((i: any) => i.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async updateInvoiceStatus(id: number, status: string, paidAt?: string) {
    const invoices = await readJsonFile('invoices.json');
    const invoice = invoices.find((i: any) => i.id === id);
    
    if (invoice) {
      invoice.status = status;
      if (paidAt) invoice.paidAt = paidAt;
      invoice.updatedAt = new Date().toISOString();
      await writeJsonFile('invoices.json', invoices);
      return invoice;
    }
    
    return null;
  }

  // Payouts
  async createPayout(data: {
    userId: number;
    amount: number;
    currency?: string;
    status?: string;
    method?: string;
    destination?: string;
  }) {
    const payouts = await readJsonFile('payouts.json');
    const newPayout = {
      id: payouts.length + 1,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status || 'pending',
      method: data.method || 'bank_transfer',
      destination: data.destination || null,
      processedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    payouts.push(newPayout);
    await writeJsonFile('payouts.json', payouts);
    return newPayout;
  }

  async getPayout(id: number) {
    const payouts = await readJsonFile('payouts.json');
    return payouts.find((p: any) => p.id === id) || null;
  }

  async getUserPayouts(userId: number, limit: number = 50, offset: number = 0) {
    const payouts = await readJsonFile('payouts.json');
    return payouts
      .filter((p: any) => p.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async updatePayoutStatus(id: number, status: string, processedAt?: string) {
    const payouts = await readJsonFile('payouts.json');
    const payout = payouts.find((p: any) => p.id === id);
    
    if (payout) {
      payout.status = status;
      if (processedAt) payout.processedAt = processedAt;
      payout.updatedAt = new Date().toISOString();
      await writeJsonFile('payouts.json', payouts);
      return payout;
    }
    
    return null;
  }

  async getPendingPayouts(limit: number = 50) {
    const payouts = await readJsonFile('payouts.json');
    return payouts
      .filter((p: any) => p.status === 'pending')
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, limit);
  }

  // Wallet
  async getWallet(userId: number) {
    const wallets = await readJsonFile('wallets.json');
    let wallet = wallets.find((w: any) => w.userId === userId);
    
    if (!wallet) {
      wallet = {
        id: wallets.length + 1,
        userId,
        balance: 0,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      wallets.push(wallet);
      await writeJsonFile('wallets.json', wallets);
    }
    
    return wallet;
  }

  async updateWalletBalance(userId: number, amount: number, type: string, description?: string) {
    const wallets = await readJsonFile('wallets.json');
    const wallet = await this.getWallet(userId);
    const newBalance = parseFloat(wallet.balance) + amount;
    
    wallet.balance = newBalance;
    wallet.updatedAt = new Date().toISOString();
    
    const walletIndex = wallets.findIndex((w: any) => w.id === wallet.id);
    if (walletIndex !== -1) {
      wallets[walletIndex] = wallet;
    }
    await writeJsonFile('wallets.json', wallets);

    // Create transaction
    const transactions = await readJsonFile('wallet_transactions.json');
    transactions.push({
      id: transactions.length + 1,
      walletId: wallet.id,
      amount,
      type,
      balanceAfter: newBalance,
      description: description || null,
      createdAt: new Date().toISOString()
    });
    await writeJsonFile('wallet_transactions.json', transactions);

    return wallet;
  }

  async getWalletTransactions(userId: number, limit: number = 50, offset: number = 0) {
    const wallet = await this.getWallet(userId);
    const transactions = await readJsonFile('wallet_transactions.json');
    
    return transactions
      .filter((t: any) => t.walletId === wallet.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  // Refunds
  async createRefund(data: {
    transactionId: number;
    amount: number;
    reason?: string;
    status?: string;
  }) {
    const refunds = await readJsonFile('refunds.json');
    const newRefund = {
      id: refunds.length + 1,
      transactionId: data.transactionId,
      amount: data.amount,
      reason: data.reason || null,
      status: data.status || 'pending',
      processedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    refunds.push(newRefund);
    await writeJsonFile('refunds.json', refunds);
    return newRefund;
  }

  async getRefund(id: number) {
    const refunds = await readJsonFile('refunds.json');
    return refunds.find((r: any) => r.id === id) || null;
  }

  async updateRefundStatus(id: number, status: string, processedAt?: string) {
    const refunds = await readJsonFile('refunds.json');
    const refund = refunds.find((r: any) => r.id === id);
    
    if (refund) {
      refund.status = status;
      if (processedAt) refund.processedAt = processedAt;
      refund.updatedAt = new Date().toISOString();
      await writeJsonFile('refunds.json', refunds);
      return refund;
    }
    
    return null;
  }

  async getTransactionRefunds(transactionId: number) {
    const refunds = await readJsonFile('refunds.json');
    return refunds
      .filter((r: any) => r.transactionId === transactionId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Environment-based storage selector
const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
                    process.env.VERCEL_ENV === 'production' ||
                    process.env.NODE_ENV === 'production';

export const paymentStorage = useDatabase 
  ? new DatabasePaymentStorage() 
  : new FilePaymentStorage();
