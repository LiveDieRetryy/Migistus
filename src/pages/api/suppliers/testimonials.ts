import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { supplierId } = req.query;
      const testimonials = await db.getSupplierTestimonials(
        supplierId ? parseInt(supplierId as string) : undefined,
        true // only approved
      );
      
      return res.status(200).json({ testimonials });

    } else if (req.method === 'POST') {
      const { supplierId, customerName, customerCompany, rating, testimonialText, isFeatured, isApproved } = req.body;

      if (!supplierId || !customerName || !rating || !testimonialText) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newTestimonial = await db.createSupplierTestimonial({
        supplierId: parseInt(supplierId),
        customerName,
        customerCompany,
        rating: parseInt(rating),
        testimonialText,
        isFeatured: isFeatured || false,
        isApproved: isApproved !== undefined ? isApproved : true
      });
      
      return res.status(201).json(newTestimonial);

    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Testimonial ID is required' });
      }

      await db.deleteSupplierTestimonial(parseInt(id));
      return res.status(200).json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling testimonials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
