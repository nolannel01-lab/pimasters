import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // For all requests, serve the index.html to enable SPA routing
    const indexPath = path.join(process.cwd(), 'dist', 'client', 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      res.status(404).json({ error: 'index.html not found' });
      return;
    }

    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Set appropriate cache headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.status(200).send(html);
  } catch (error) {
    console.error('Error serving application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

