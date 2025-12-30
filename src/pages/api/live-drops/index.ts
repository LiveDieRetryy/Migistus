import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, isProduction } from '@/lib/db';

const LIVE_DROPS_PATH = path.resolve('public/data/live-drops.json');

function readLiveDropsData() {
  try {
    if (!fs.existsSync(LIVE_DROPS_PATH)) {
      const initialData = { 
        liveDrops: [],
        stats: {
          active: 0,
          scheduled: 0,
          totalParticipants: 0,
          completedToday: 0
        }
      };
      fs.writeFileSync(LIVE_DROPS_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(LIVE_DROPS_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Ensure stats exist
    if (!data.stats) {
      data.stats = {
        active: 0,
        scheduled: 0,
        totalParticipants: 0,
        completedToday: 0
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error reading live drops file:', error);
    return { 
      liveDrops: [],
      stats: {
        active: 0,
        scheduled: 0,
        totalParticipants: 0,
        completedToday: 0
      }
    };
  }
}

function writeLiveDropsData(data: any) {
  try {
    const dir = path.dirname(LIVE_DROPS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LIVE_DROPS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing live drops file:', error);
  }
}

function calculateStats(liveDrops: any[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    active: liveDrops.filter(drop => drop.status === 'active').length,
    scheduled: liveDrops.filter(drop => drop.status === 'scheduled').length,
    totalParticipants: liveDrops.reduce((sum, drop) => sum + (drop.participants || 0), 0),
    completedToday: liveDrops.filter(drop => 
      drop.status === 'ended' && 
      new Date(drop.endTime || drop.createdAt) >= todayStart
    ).length
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  try {
    if (req.method === 'GET') {
      if (useProduction) {
        // Use database in production
        const liveDrops = await db.getAllLiveDrops();
        const stats = await db.getLiveDropStats();
        
        return res.status(200).json({
          liveDrops,
          stats
        });
      } else {
        // Use file system in development
        const data = readLiveDropsData();
        const stats = calculateStats(data.liveDrops);
        data.stats = stats;
        writeLiveDropsData(data);
        
        return res.status(200).json(data);
      }
    }

    if (req.method === 'POST') {
      const { productId, productName, pledgeGoal, startTime, duration } = req.body;
      
      if (!productId || !productName || !pledgeGoal || !startTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (useProduction) {
        // Use database in production
        const newLiveDrop = await db.createLiveDrop({
          productId: parseInt(productId),
          productName,
          pledgeGoal: parseFloat(pledgeGoal),
          startTime,
          durationHours: parseInt(duration || '24')
        });
        
        return res.status(201).json(newLiveDrop);
      } else {
        // Use file system in development
        const data = readLiveDropsData();
        
        const newLiveDrop = {
          id: Date.now().toString(),
          productId,
          productName,
          status: 'scheduled',
          startTime,
          endTime: new Date(Date.now() + (parseInt(duration || '24') * 60 * 60 * 1000)).toISOString(),
          participants: 0,
          pledgeGoal: parseInt(pledgeGoal),
          currentPledges: 0,
          createdAt: new Date().toISOString()
        };

        data.liveDrops.push(newLiveDrop);
        data.stats = calculateStats(data.liveDrops);
        writeLiveDropsData(data);

        return res.status(201).json(newLiveDrop);
      }
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      
      if (useProduction) {
        // Use database in production
        const updates: any = { status };
        
        if (status === 'ended') {
          updates.endTime = new Date().toISOString();
        }
        
        const updatedDrop = await db.updateLiveDrop(parseInt(id), updates);
        
        if (!updatedDrop) {
          return res.status(404).json({ error: 'Live drop not found' });
        }
        
        return res.status(200).json(updatedDrop);
      } else {
        // Use file system in development
        const data = readLiveDropsData();
        const dropIndex = data.liveDrops.findIndex((drop: any) => drop.id === id);
        
        if (dropIndex === -1) {
          return res.status(404).json({ error: 'Live drop not found' });
        }

        data.liveDrops[dropIndex].status = status;
        if (status === 'active') {
          data.liveDrops[dropIndex].startTime = new Date().toISOString();
        }
        if (status === 'ended') {
          data.liveDrops[dropIndex].endTime = new Date().toISOString();
        }

        data.stats = calculateStats(data.liveDrops);
        writeLiveDropsData(data);

        return res.status(200).json(data.liveDrops[dropIndex]);
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (useProduction) {
        // Use database in production
        await db.deleteLiveDrop(parseInt(id as string));
        return res.status(200).json({ message: 'Live drop deleted successfully' });
      } else {
        // Use file system in development
        const data = readLiveDropsData();
        data.liveDrops = data.liveDrops.filter((drop: any) => drop.id !== id);
        data.stats = calculateStats(data.liveDrops);
        writeLiveDropsData(data);

        return res.status(200).json({ message: 'Live drop deleted successfully' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in live-drops API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
