import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const suppliersPath = path.join(process.cwd(), 'public', 'data', 'suppliers.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(suppliersPath, 'utf-8');
      const suppliers = JSON.parse(data);
      res.status(200).json(suppliers);
    } catch (error) {
      console.error('Error reading suppliers:', error);
      res.status(500).json({ error: 'Failed to load suppliers' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
