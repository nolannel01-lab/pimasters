import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { URL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

// Import the TanStack Start handler
const { default: handler } = await import('./dist/server/index.js')

// Create and start the server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  
  // Handle static assets
  if (url.pathname.startsWith('/assets/')) {
    const filePath = path.join(__dirname, 'dist/client', url.pathname)
    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      
      // Set appropriate content type
      const contentTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      }
      
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=31536000' })
      res.end(data)
      return
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
      return
    }
  }
  
  // Handle favicon and other public files
  if (url.pathname === '/favicon.ico') {
    const filePath = path.join(__dirname, 'dist/client/favicon.ico')
    try {
      const data = fs.readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'max-age=2592000' })
      res.end(data)
      return
    } catch (e) {
      res.writeHead(404)
      res.end()
      return
    }
  }
  
  // Delegate all other requests to TanStack Start handler
  try {
    await handler(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

