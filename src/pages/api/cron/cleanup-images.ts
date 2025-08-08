import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check (you might want to implement proper auth)
  const { authKey } = req.body;
  if (authKey !== process.env.CLEANUP_AUTH_KEY && authKey !== 'admin-cleanup-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Starting automated image cleanup...');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'image-cleanup-service.js');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
    
    // Parse the output to extract meaningful data
    const lines = stdout.split('\n');
    const reportStart = lines.findIndex(line => line.includes('IMAGE STORAGE REPORT'));
    const reportEnd = lines.findIndex((line, index) => index > reportStart && line.includes('==='));
    
    let stats: Record<string, string> = {};
    if (reportStart !== -1 && reportEnd !== -1) {
      const reportLines = lines.slice(reportStart + 2, reportEnd);
      reportLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          stats[key] = value;
        }
      });
    }

    // Log results
    console.log('✅ Automated cleanup completed');
    console.log('Cleanup output:', stdout);
    
    if (stderr) {
      console.warn('Cleanup warnings:', stderr);
    }

    res.status(200).json({
      success: true,
      message: 'Image cleanup completed successfully',
      stats,
      output: stdout,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during automated cleanup:', error);
    
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
