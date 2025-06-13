import { supabase } from '../lib/supabase'
import { QueryExtractor } from './queryExtractor'
import { BackendApiService } from './backendApiService'
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
  private static backendAvailable = false

  // Check if backend is available
  static async checkBackendAvailability(): Promise<boolean> {
    try {
      this.backendAvailable = await BackendApiService.checkHealth()
      return this.backendAvailable
    } catch (error) {
      console.error('Backend not available:', error)
      this.backendAvailable = false
      return false
    }
  }

  // Search products - try backend first, fallback to Supabase
  static async searchProducts(query: string, extractedParams?: SearchParams): Promise<SearchResponse> {
    // Try backend first if available
    if (this.backendAvailable || await this.checkBackendAvailability()) {
      try {
        console.log('🔍 Searching via Python backend...')
        const backendResponse = await BackendApiService.searchProducts(query, extractedParams)
        console.log('✅ Backend search successful')
        return backendResponse
      } catch (error) {
        console.error('❌ Backend search failed, falling back to Supabase:', error)
        this.backendAvailable = false
      }
    }

    // Fallback to Supabase Edge Functions
    try {
      console.log('🔍 Searching via Supabase Edge Functions...')
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
      console.log('✅ Supabase search successful')
      return data
    } catch (error) {
      console.error('❌ Supabase search failed, using local fallback:', error)
      return this.fallbackLocalSearch(query, extractedParams)
    }
  }

  // Get trending products - try backend first, fallback to Supabase
  static async getTrendingProducts(category?: string, limit = 10): Promise<Product[]> {
    // Try backend first if available
    if (this.backendAvailable || await this.checkBackendAvailability()) {
      try {
        console.log('📈 Getting trending products from backend...')
        const products = await BackendApiService.getTrendingProducts(category, limit)
        console.log('✅ Backend trending products successful')
        return products
      } catch (error) {
        console.error('❌ Backend trending failed, falling back to Supabase:', error)
        this.backendAvailable = false
      }
    }

    // Fallback to Supabase Edge Functions
    try {
      console.log('📈 Getting trending products from Supabase...')
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
      console.log('✅ Supabase trending products successful')
      return data.products || []
    } catch (error) {
      console.error('❌ All trending product sources failed:', error)
      return []
    }
  }

  // Fallback to local database search
  private static async fallbackLocalSearch(query: string, params?: SearchParams): Promise<SearchResponse> {
    try {
      console.log('🔍 Using local database fallback...')
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

      console.log('✅ Local database search successful')
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

  // Get backend statistics
  static async getBackendStats(): Promise<any> {
    if (this.backendAvailable || await this.checkBackendAvailability()) {
      try {
        return await BackendApiService.getStats()
      } catch (error) {
        console.error('Error getting backend stats:', error)
      }
    }
    return null
  }
}