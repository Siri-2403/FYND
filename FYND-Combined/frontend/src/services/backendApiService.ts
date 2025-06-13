// Backend API service for connecting to Python Flask backend
import type { Product, SearchParams } from '../lib/supabase'

export interface BackendSearchResponse {
  products: Product[]
  total: number
  sources: {
    local: number
    external: number
  }
}

export class BackendApiService {
  private static readonly BACKEND_URL = 'http://localhost:5000/api'

  // Search products using Python backend
  static async searchProducts(query: string, extractedParams?: SearchParams): Promise<BackendSearchResponse> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          limit: extractedParams?.limit || 20,
          category: extractedParams?.category,
          brand: extractedParams?.brand,
          price_max: extractedParams?.price_max,
          min_rating: extractedParams?.min_rating
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return {
        products: data.products || [],
        total: data.total || 0,
        sources: data.sources || { local: 0, external: 0 }
      }
    } catch (error) {
      console.error('Error searching products via backend:', error)
      throw error
    }
  }

  // Get trending products from backend
  static async getTrendingProducts(category?: string, limit = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      params.append('limit', limit.toString())

      const response = await fetch(`${this.BACKEND_URL}/trending?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Error getting trending products from backend:', error)
      return []
    }
  }

  // Check backend health
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.status === 'healthy' && data.search_engine_ready
    } catch (error) {
      console.error('Backend health check failed:', error)
      return false
    }
  }

  // Get database statistics
  static async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting stats from backend:', error)
      return {
        total_products: 0,
        categories: 0,
        brands: 0
      }
    }
  }
}