import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { URL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

// MIME types
const mimeTypes = {
  '.html': 'text/html',
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
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

// Create and start the server
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathname = url.pathname
  
  // Remove trailing slash except for root
  let filePath = pathname === '/' ? '/index.html' : pathname
  
  // Full file path
  let fullPath = path.join(__dirname, 'dist/client', filePath)
  
  // Normalize and prevent directory traversal
  fullPath = path.normalize(fullPath)
  const clientDir = path.normalize(path.join(__dirname, 'dist/client'))
  
  if (!fullPath.startsWith(clientDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Forbidden')
    return
  }
  
  // Try to serve the file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // If file not found and it's not an asset, serve index.html (for SPA routing)
      if (err.code === 'ENOENT' && !pathname.startsWith('/assets/') && !pathname.includes('.')) {
        fs.readFile(path.join(clientDir, 'index.html'), (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not Found')
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(indexData)
          }
        })
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not Found')
      }
      return
    }
    
    // Determine content type
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    
    // Set cache headers
    let cacheControl = 'no-cache'
    if (pathname.startsWith('/assets/')) {
      cacheControl = 'public, max-age=31536000, immutable'  // 1 year for hashed assets
    } else if (ext === '.js' || ext === '.css') {
      cacheControl = 'public, max-age=3600'  // 1 hour for JS/CSS
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    })
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


