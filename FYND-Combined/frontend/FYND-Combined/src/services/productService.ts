import { supabase } from '../lib/supabase'
import type { Product, SearchParams, UserSearch } from '../lib/supabase'

export class ProductService {
  // Search products with filters
  static async searchProducts(params: SearchParams): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .gt('stock', 0) // Only show products in stock
        .order('rating', { ascending: false })

      // Apply filters
      if (params.category) {
        query = query.ilike('category', `%${params.category}%`)
      }
      
      if (params.subcategory) {
        query = query.ilike('subcategory', `%${params.subcategory}%`)
      }
      
      if (params.brand) {
        query = query.ilike('brand', `%${params.brand}%`)
      }
      
      if (params.color) {
        query = query.ilike('color', `%${params.color}%`)
      }
      
      if (params.location) {
        query = query.ilike('location', `%${params.location}%`)
      }
      
      if (params.size) {
        query = query.ilike('size', `%${params.size}%`)
      }
      
      if (params.product_name) {
        query = query.or(`name.ilike.%${params.product_name}%,description.ilike.%${params.product_name}%`)
      }
      
      if (params.price_max) {
        query = query.lte('price', params.price_max)
      }
      
      if (params.min_rating) {
        query = query.gte('rating', params.min_rating)
      }
      
      if (params.limit) {
        query = query.limit(params.limit)
      } else {
        query = query.limit(20) // Default limit
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in searchProducts:', error)
      return []
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error getting product:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProductById:', error)
      return null
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string, limit = 10): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('category', `%${category}%`)
        .gt('stock', 0)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting products by category:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getProductsByCategory:', error)
      return []
    }
  }

  // Save user search
  static async saveUserSearch(userId: string, query: string, extractedParams: any, resultsCount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_searches')
        .insert({
          user_id: userId,
          query,
          extracted_params: extractedParams,
          results_count: resultsCount
        })

      if (error) {
        console.error('Error saving user search:', error)
      }
    } catch (error) {
      console.error('Error in saveUserSearch:', error)
    }
  }

  // Get user's search history
  static async getUserSearchHistory(userId: string, limit = 10): Promise<UserSearch[]> {
    try {
      const { data, error } = await supabase
        .from('user_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting search history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserSearchHistory:', error)
      return []
    }
  }

  // Add product to favorites
  static async addToFavorites(userId: string, productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          product_id: productId
        })

      if (error) {
        console.error('Error adding to favorites:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in addToFavorites:', error)
      return false
    }
  }

  // Remove product from favorites
  static async removeFromFavorites(userId: string, productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) {
        console.error('Error removing from favorites:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in removeFromFavorites:', error)
      return false
    }
  }

  // Get user's favorite products
  static async getUserFavorites(userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting user favorites:', error)
        return []
      }

      return data?.map(fav => fav.products).filter(Boolean) || []
    } catch (error) {
      console.error('Error in getUserFavorites:', error)
      return []
    }
  }
}