import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { db, isProduction } from '@/lib/db';

const testimonialsFilePath = path.join(process.cwd(), 'public', 'data', 'supplier-testimonials.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  try {
    if (req.method === 'GET') {
      if (useProduction) {
        // ============================================
        // PRODUCTION: Use database
        // ============================================
        const { supplierId } = req.query;
        const testimonials = await db.getSupplierTestimonials(
          supplierId ? parseInt(supplierId as string) : undefined,
          true // only approved
        );
        
        return res.status(200).json({ testimonials });

      } else {
        // ============================================
        // DEVELOPMENT: Use file system (legacy)
        // ============================================
        // Ensure the file exists
        if (!fs.existsSync(testimonialsFilePath)) {
          const initialData = { testimonials: [] };
          fs.writeFileSync(testimonialsFilePath, JSON.stringify(initialData, null, 2));
        }

        const fileContent = fs.readFileSync(testimonialsFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        return res.status(200).json(data);
      }

    } else if (req.method === 'POST') {
      const { supplierId, customerName, customerCompany, rating, testimonialText, isFeatured, isApproved } = req.body;

      if (!supplierId || !customerName || !rating || !testimonialText) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (useProduction) {
        // ============================================
        // PRODUCTION: Use database
        // ============================================
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

      } else {
        // ============================================
        // DEVELOPMENT: Use file system (legacy)
        // ============================================
        if (!fs.existsSync(testimonialsFilePath)) {
          const initialData = { testimonials: [] };
          fs.writeFileSync(testimonialsFilePath, JSON.stringify(initialData, null, 2));
        }

        const fileContent = fs.readFileSync(testimonialsFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Add new testimonial
        const newTestimonial = {
          id: Date.now(),
          ...req.body,
          createdAt: new Date().toISOString(),
        };
        
        data.testimonials.push(newTestimonial);
        fs.writeFileSync(testimonialsFilePath, JSON.stringify(data, null, 2));
        
        return res.status(201).json(newTestimonial);
      }

    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Testimonial ID is required' });
      }

      if (useProduction) {
        // ============================================
        // PRODUCTION: Use database
        // ============================================
        await db.deleteSupplierTestimonial(parseInt(id));
        return res.status(200).json({ success: true });

      } else {
        // ============================================
        // DEVELOPMENT: Use file system (legacy)
        // ============================================
        if (!fs.existsSync(testimonialsFilePath)) {
          return res.status(404).json({ error: 'Testimonials file not found' });
        }

        const fileContent = fs.readFileSync(testimonialsFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        data.testimonials = data.testimonials.filter((t: any) => t.id !== id);
        fs.writeFileSync(testimonialsFilePath, JSON.stringify(data, null, 2));
        
        return res.status(200).json({ success: true });
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling testimonials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
