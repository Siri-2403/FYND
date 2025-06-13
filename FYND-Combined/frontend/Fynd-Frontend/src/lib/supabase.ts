import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  price: number
  currency: string
  color?: string
  size?: string
  location?: string
  rating: number
  stock: number
  image_url?: string
  description?: string
  style?: string
  delivery_time?: string
  discount?: string
  external_id?: string
  source: string
  created_at: string
  updated_at: string
}

// Flipkart product interface based on your table schema
export interface FlipkartProduct {
  uniq_id: string
  crawl_timestamp?: string
  product_url?: string
  product_name: string
  product_category_tree?: any // jsonb type
  pid?: string
  retail_price?: string
  discounted_price?: string
  image?: any // jsonb type
  is_FK_Advantage_product?: boolean
  description?: string
  product_rating?: string
  overall_rating?: string
  brand?: string
  product_specifications?: string
}

export interface UserSearch {
  id: string
  user_id: string
  query: string
  extracted_params: any
  results_count: number
  created_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

// Search parameters interface
export interface SearchParams {
  category?: string
  subcategory?: string
  brand?: string
  color?: string
  price_max?: number
  location?: string
  size?: string
  product_name?: string
  min_rating?: number
  limit?: number
}