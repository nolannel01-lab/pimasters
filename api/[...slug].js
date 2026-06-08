import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`)
  
  // Serve static assets
  if (pathname.startsWith('/assets/')) {
    const filePath = path.join(process.cwd(), 'dist/client', pathname)
    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      
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
        '.woff2': 'font/woff2'
      }
      
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.status(200).send(data)
    } catch (err) {
      return res.status(404).send('Not Found')
    }
  }
  
  // Serve favicon
  if (pathname === '/favicon.ico') {
    const filePath = path.join(process.cwd(), 'dist/client/favicon.ico')
    try {
      const data = fs.readFileSync(filePath)
      res.setHeader('Content-Type', 'image/x-icon')
      res.setHeader('Cache-Control', 'public, max-age=2592000')
      return res.status(200).send(data)
    } catch (err) {
      return res.status(404).send('Not Found')
    }
  }
  
  // Serve index.html for SPA routing
  try {
    const indexPath = path.join(process.cwd(), 'dist/client/index.html')
    const data = fs.readFileSync(indexPath)
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'no-cache')
    return res.status(200).send(data)
  } catch (err) {
    return res.status(500).send('Internal Server Error')
  }
}
