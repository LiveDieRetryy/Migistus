import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const PRODUCTS_PATH = path.resolve('public/data/products.json');
const STAFF_PICKS_PATH = path.resolve('public/data/staff-picks.json');

function readJsonFile(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const productsData = readJsonFile(PRODUCTS_PATH);
    const staffPicksData = readJsonFile(STAFF_PICKS_PATH);
    
    const products = productsData?.products || [];
    const staffPicks = staffPicksData?.staffPicks || [];
    
    const stats = {
      total: products.length,
      comingSoon: products.filter((product: any) => product.status === 'coming-soon' || product.status === 'upcoming').length,
      live: products.filter((product: any) => product.status === 'live' || product.status === 'active').length,
      completed: products.filter((product: any) => product.status === 'completed' || product.status === 'ended').length,
      staffPicks: staffPicks.length,
      byCategory: products.reduce((acc: any, product: any) => {
        const category = product.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      totalPledges: products.reduce((sum: number, product: any) => sum + (product.pledgeCount || 0), 0),
      totalValue: products.reduce((sum: number, product: any) => sum + (product.totalPledged || 0), 0)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating product stats:', error);
    res.status(500).json({ error: 'Failed to generate product statistics' });
  }
}
