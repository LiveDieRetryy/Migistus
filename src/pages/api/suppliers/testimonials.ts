import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const testimonialsFilePath = path.join(process.cwd(), 'public', 'data', 'supplier-testimonials.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure the file exists
    if (!fs.existsSync(testimonialsFilePath)) {
      const initialData = { testimonials: [] };
      fs.writeFileSync(testimonialsFilePath, JSON.stringify(initialData, null, 2));
    }

    const fileContent = fs.readFileSync(testimonialsFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (req.method === 'GET') {
      res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Add new testimonial
      const newTestimonial = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      
      data.testimonials.push(newTestimonial);
      fs.writeFileSync(testimonialsFilePath, JSON.stringify(data, null, 2));
      
      res.status(201).json(newTestimonial);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;
      data.testimonials = data.testimonials.filter((t: any) => t.id !== id);
      fs.writeFileSync(testimonialsFilePath, JSON.stringify(data, null, 2));
      
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling testimonials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
