import React from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

// Server-side rendering - provide minimal SSR response
export async function render(
  options?: {
    path?: string
  }
) {
  const router = getRouter()
  
  try {
    // Just return minimal HTML that client can hydrate
    // We don't do actual server-side rendering on Vercel
    return {
      html: '',
      status: 200,
      headers: {},
    }
  } catch (error) {
    console.error('SSR Error:', error)
    throw error
  }
}

export default {
  render,
}

