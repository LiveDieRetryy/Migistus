import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const invoiceId = parseInt(id as string);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    if (req.method === 'GET') {
      // Get invoice details
      const invoice = await paymentStorage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Verify ownership
      if (invoice.userId !== session.userId && session.tier !== 'master') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.status(200).json({ invoice });

    } else if (req.method === 'POST') {
      // Pay invoice
      const { paymentMethodId } = req.body;

      const invoice = await paymentStorage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Verify ownership
      if (invoice.userId !== session.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Check if already paid
      if (invoice.status === 'paid') {
        return res.status(400).json({ error: 'Invoice already paid' });
      }

      // Create payment transaction
      const transaction = await paymentStorage.createTransaction({
        userId: session.userId,
        type: 'payment',
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
        status: 'completed',
        paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
        description: `Payment for invoice #${invoiceId}`
      });

      // Update invoice status
      await paymentStorage.updateInvoiceStatus(
        invoiceId,
        'paid',
        new Date().toISOString()
      );

      return res.status(200).json({ 
        success: true, 
        transaction,
        invoice: await paymentStorage.getInvoice(invoiceId)
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Invoice detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
