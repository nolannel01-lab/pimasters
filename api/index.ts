import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Serve static assets with cache headers
  if (req.url?.startsWith('/assets/')) {
    const filePath = path.join(process.cwd(), 'dist', 'client', req.url);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Type', getContentType(filePath));
        res.status(200).send(content);
        return;
      }
    } catch (error) {
      console.error('Error serving static file:', error);
    }
  }

  // Serve index.html for all other routes (SPA routing)
  try {
    const indexPath = path.join(process.cwd(), 'dist', 'client', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.status(200).send(html);
    } else {
      res.status(404).json({ error: 'index.html not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  return types[ext] || 'application/octet-stream';
}

