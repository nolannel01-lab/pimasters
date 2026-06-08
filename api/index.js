import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Handle static assets
  if (pathname.startsWith('/assets/')) {
    const filePath = path.join(process.cwd(), 'dist/client', pathname);
    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      const mimeTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };

      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.status(200).send(data);
      return;
    } catch (err) {
      res.status(404).send('Not Found');
      return;
    }
  }

  // Handle favicon
  if (pathname === '/favicon.ico') {
    const filePath = path.join(process.cwd(), 'public/favicon.ico');
    try {
      const data = fs.readFileSync(filePath);
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cache-Control', 'public, max-age=2592000');
      res.status(200).send(data);
      return;
    } catch (err) {
      res.status(404).send('Not Found');
      return;
    }
  }

  // Serve index.html for all other requests (SPA)
  try {
    const indexPath = path.join(process.cwd(), 'dist/client/index.html');
    const data = fs.readFileSync(indexPath);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send('Internal Server Error: ' + err.message);
  }
}
