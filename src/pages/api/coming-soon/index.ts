import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const COMING_SOON_PATH = path.resolve('public/data/coming-soon.json');

function readComingSoonData() {
  try {
    if (!fs.existsSync(COMING_SOON_PATH)) {
      const initialData = { 
        items: [],
        stats: {
          totalItems: 0,
          subscribedUsers: 0,
          announcedToday: 0,
          upcomingThisWeek: 0
        }
      };
      fs.writeFileSync(COMING_SOON_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(COMING_SOON_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Ensure stats exist
    if (!data.stats) {
      data.stats = {
        totalItems: 0,
        subscribedUsers: 0,
        announcedToday: 0,
        upcomingThisWeek: 0
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error reading coming soon file:', error);
    return { 
      items: [],
      stats: {
        totalItems: 0,
        subscribedUsers: 0,
        announcedToday: 0,
        upcomingThisWeek: 0
      }
    };
  }
}

function writeComingSoonData(data: any) {
  try {
    const dir = path.dirname(COMING_SOON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COMING_SOON_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing coming soon file:', error);
  }
}

function calculateStats(items: any[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return {
    totalItems: items.length,
    subscribedUsers: items.reduce((sum, item) => sum + (item.subscribers || 0), 0),
    announcedToday: items.filter(item => 
      item.status === 'announced' && 
      new Date(item.announcedAt || item.createdAt) >= todayStart
    ).length,
    upcomingThisWeek: items.filter(item => 
      item.status === 'coming-soon' && 
      item.releaseDate &&
      new Date(item.releaseDate) <= weekEnd &&
      new Date(item.releaseDate) >= now
    ).length
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = readComingSoonData();

    if (req.method === 'GET') {
      // Calculate fresh stats
      const stats = calculateStats(data.items);
      data.stats = stats;
      writeComingSoonData(data);
      
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description, category, releaseDate, imageUrl } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newItem = {
        id: Date.now().toString(),
        title,
        description,
        category: category || 'general',
        status: 'coming-soon',
        releaseDate,
        imageUrl,
        subscribers: 0,
        createdAt: new Date().toISOString()
      };

      data.items.push(newItem);
      data.stats = calculateStats(data.items);
      writeComingSoonData(data);

      return res.status(201).json(newItem);
    }

    if (req.method === 'PUT') {
      const { id, status, releaseDate, title, description } = req.body;
      
      const itemIndex = data.items.findIndex((item: any) => item.id === id);
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Coming soon item not found' });
      }

      if (status) data.items[itemIndex].status = status;
      if (releaseDate) data.items[itemIndex].releaseDate = releaseDate;
      if (title) data.items[itemIndex].title = title;
      if (description) data.items[itemIndex].description = description;
      
      if (status === 'announced') {
        data.items[itemIndex].announcedAt = new Date().toISOString();
      }

      data.stats = calculateStats(data.items);
      writeComingSoonData(data);

      return res.status(200).json(data.items[itemIndex]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      data.items = data.items.filter((item: any) => item.id !== id);
      data.stats = calculateStats(data.items);
      writeComingSoonData(data);

      return res.status(200).json({ message: 'Coming soon item deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Coming soon API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
