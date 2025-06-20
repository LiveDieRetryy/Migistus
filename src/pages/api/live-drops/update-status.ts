import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const LIVE_DROPS_PATH = path.resolve('public/data/live-drops.json');

function readLiveDropsData() {
  try {
    if (!fs.existsSync(LIVE_DROPS_PATH)) {
      const initialData = { liveDrops: [] };
      fs.writeFileSync(LIVE_DROPS_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(LIVE_DROPS_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading live drops file:', error);
    return { liveDrops: [] };
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
    throw new Error('Failed to save live drops data');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dropId, status } = req.body;
    
    if (!dropId || !status) {
      return res.status(400).json({ error: 'Missing dropId or status' });
    }

    const liveDropsData = readLiveDropsData();
    const dropIndex = liveDropsData.liveDrops.findIndex((drop: any) => drop.id === dropId);
    
    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    liveDropsData.liveDrops[dropIndex].status = status;
    liveDropsData.liveDrops[dropIndex].updatedAt = new Date().toISOString();
    
    if (status === 'ended') {
      liveDropsData.liveDrops[dropIndex].endTime = new Date().toISOString();
    }
    
    writeLiveDropsData(liveDropsData);
    
    res.status(200).json({ success: true, drop: liveDropsData.liveDrops[dropIndex] });
  } catch (error) {
    console.error('Error updating drop status:', error);
    res.status(500).json({ error: 'Failed to update drop status' });
  }
}
