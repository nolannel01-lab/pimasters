import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

// Initialize empty SSR state to prevent hydration errors
const initializeSSRState = () => {
  if (typeof window !== 'undefined') {
    // Initialize with empty dehydrated state
    (window as any).__DEHYDRATED_STATE__ = {}
    
    // Signal that this is a fresh client render, not hydration
    (window as any).__SSR__ = false
  }
}

const router = getRouter()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

// Initialize before rendering
initializeSSRState()

// Render with Suspense boundary
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading application...</p>
          </div>
        </div>
      }
    >
      <RouterProvider router={router} />
    </React.Suspense>
  </React.StrictMode>
)


