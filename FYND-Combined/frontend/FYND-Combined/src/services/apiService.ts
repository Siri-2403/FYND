import { supabase } from '../lib/supabase'
import { QueryExtractor } from './queryExtractor'
import type { Product, SearchParams } from '../lib/supabase'

export interface SearchResponse {
  products: Product[]
  total: number
  sources: {
    local: number
    external: number
  }
}

export class ApiService {
  private static readonly SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

  // Search products using Edge Function
  static async searchProducts(query: string, extractedParams?: SearchParams): Promise<SearchResponse> {
    try {
      // Extract parameters if not provided
      const params = extractedParams || QueryExtractor.extractInfo(query)
      
      const response = await fetch(`${this.SUPABASE_FUNCTIONS_URL}/search-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          query: params.product_name || query,
          category: params.category,
          limit: params.limit || 20
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error searching products:', error)
      // Fallback to local search if Edge Function fails
      return this.fallbackLocalSearch(query, extractedParams)
    }
  }

  // Fallback to local database search
  private static async fallbackLocalSearch(query: string, params?: SearchParams): Promise<SearchResponse> {
    try {
      const searchParams = params || QueryExtractor.extractInfo(query)
      
      let dbQuery = supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('rating', { ascending: false })

      // Apply filters
      if (searchParams.category) {
        dbQuery = dbQuery.ilike('category', `%${searchParams.category}%`)
      }
      
      if (searchParams.subcategory) {
        dbQuery = dbQuery.ilike('subcategory', `%${searchParams.subcategory}%`)
      }
      
      if (searchParams.brand) {
        dbQuery = dbQuery.ilike('brand', `%${searchParams.brand}%`)
      }
      
      if (searchParams.color) {
        dbQuery = dbQuery.ilike('color', `%${searchParams.color}%`)
      }
      
      if (searchParams.location) {
        dbQuery = dbQuery.ilike('location', `%${searchParams.location}%`)
      }
      
      if (searchParams.size) {
        dbQuery = dbQuery.ilike('size', `%${searchParams.size}%`)
      }
      
      if (searchParams.product_name || query) {
        const searchTerm = searchParams.product_name || query
        dbQuery = dbQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }
      
      if (searchParams.price_max) {
        dbQuery = dbQuery.lte('price', searchParams.price_max)
      }
      
      if (searchParams.min_rating) {
        dbQuery = dbQuery.gte('rating', searchParams.min_rating)
      }
      
      dbQuery = dbQuery.limit(searchParams.limit || 20)

      const { data, error } = await dbQuery

      if (error) {
        console.error('Error in fallback search:', error)
        return { products: [], total: 0, sources: { local: 0, external: 0 } }
      }

      return {
        products: data || [],
        total: data?.length || 0,
        sources: { local: data?.length || 0, external: 0 }
      }
    } catch (error) {
      console.error('Error in fallback search:', error)
      return { products: [], total: 0, sources: { local: 0, external: 0 } }
    }
  }

  // Get product details
  static async getProductDetails(productId: string, source?: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.SUPABASE_FUNCTIONS_URL}/get-product-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ productId, source })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Error getting product details:', error)
      return null
    }
  }

  // Get trending products
  static async getTrendingProducts(category?: string, limit = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      params.append('limit', limit.toString())

      const response = await fetch(`${this.SUPABASE_FUNCTIONS_URL}/trending-products?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Error getting trending products:', error)
      return []
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string, limit = 10): Promise<Product[]> {
    try {
      const searchResponse = await this.searchProducts('', { category, limit })
      return searchResponse.products
    } catch (error) {
      console.error('Error getting products by category:', error)
      return []
    }
  }
}