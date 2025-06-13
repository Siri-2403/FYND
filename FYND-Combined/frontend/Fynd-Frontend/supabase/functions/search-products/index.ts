import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface SearchRequest {
  query: string
  category?: string
  limit?: number
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  currency: string
  image_url: string
  description: string
  rating: number
  brand?: string
  source: string
  external_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, category, limit = 20 }: SearchRequest = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Search local database first
    let localProducts: Product[] = []
    try {
      let dbQuery = supabaseClient
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('rating', { ascending: false })
        .limit(Math.floor(limit / 4))

      if (category) {
        dbQuery = dbQuery.ilike('category', `%${category}%`)
      }

      if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      }

      const { data: localData } = await dbQuery
      localProducts = localData || []
    } catch (error) {
      console.error('Error fetching local products:', error)
    }

    // Search Flipkart database
    let flipkartProducts: Product[] = []
    try {
      flipkartProducts = await fetchFromFlipkart(supabaseClient, query, category, Math.floor(limit / 4))
    } catch (error) {
      console.error('Error fetching Flipkart products:', error)
    }

    // Fetch from external APIs
    const externalProducts = await fetchExternalProducts(query, category, limit - localProducts.length - flipkartProducts.length)

    // Combine and return results
    const allProducts = [...localProducts, ...flipkartProducts, ...externalProducts]
    
    return new Response(
      JSON.stringify({ 
        products: allProducts.slice(0, limit),
        total: allProducts.length,
        sources: {
          local: localProducts.length,
          flipkart: flipkartProducts.length,
          external: externalProducts.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in search-products function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Enhanced function to fetch from Flipkart table with better image handling
async function fetchFromFlipkart(supabaseClient: any, query: string, category?: string, limit = 5): Promise<Product[]> {
  try {
    let dbQuery = supabaseClient
      .from('flipkart')
      .select('*')
      .order('product_rating', { ascending: false })
      .limit(limit)

    if (category) {
      // Search in product_category_tree jsonb field
      dbQuery = dbQuery.or(`product_category_tree::text.ilike.%${category}%`)
    }

    if (query) {
      dbQuery = dbQuery.or(`product_name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching from Flipkart table:', error)
      return []
    }

    return (data || []).map((item: any) => {
      // Extract category from product_category_tree
      let extractedCategory = 'general'
      if (item.product_category_tree && Array.isArray(item.product_category_tree)) {
        extractedCategory = item.product_category_tree[item.product_category_tree.length - 1] || 'general'
      } else if (typeof item.product_category_tree === 'string') {
        const categories = item.product_category_tree.split(' >> ')
        extractedCategory = categories[categories.length - 1] || 'general'
      }

      // Enhanced image URL extraction with validation
      let imageUrl = ''
      
      if (item.image) {
        try {
          let imageData = item.image
          
          // If it's a string, try to parse it as JSON
          if (typeof imageData === 'string') {
            try {
              imageData = JSON.parse(imageData)
            } catch {
              // If parsing fails, treat as direct URL
              imageUrl = imageData
            }
          }
          
          // If it's an array, get the first valid image
          if (Array.isArray(imageData)) {
            for (const img of imageData) {
              if (typeof img === 'string' && img.trim() && isValidImageUrl(img)) {
                imageUrl = img.trim()
                break
              }
            }
          } 
          // If it's an object, look for common image properties
          else if (typeof imageData === 'object' && imageData !== null) {
            const possibleKeys = ['url', 'src', 'image_url', 'thumbnail', 'main_image', '0']
            for (const key of possibleKeys) {
              if (imageData[key] && typeof imageData[key] === 'string' && isValidImageUrl(imageData[key])) {
                imageUrl = imageData[key].trim()
                break
              }
            }
          }
          // If it's a direct string URL
          else if (typeof imageData === 'string' && isValidImageUrl(imageData)) {
            imageUrl = imageData.trim()
          }
        } catch (error) {
          console.error('Error parsing image data for product:', item.product_name, error)
        }
      }

      // Fallback to a default image if no valid image found
      if (!imageUrl || !isValidImageUrl(imageUrl)) {
        imageUrl = 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400'
      }

      // Parse price from string to number
      let price = 0
      if (item.discounted_price) {
        price = parseFloat(item.discounted_price.replace(/[^\d.]/g, '')) || 0
      } else if (item.retail_price) {
        price = parseFloat(item.retail_price.replace(/[^\d.]/g, '')) || 0
      }

      // Parse rating from string to number
      let rating = 4.0
      if (item.product_rating) {
        rating = parseFloat(item.product_rating) || 4.0
      } else if (item.overall_rating) {
        rating = parseFloat(item.overall_rating) || 4.0
      }

      return {
        id: `flipkart_${item.uniq_id}`,
        name: item.product_name || 'Unknown Product',
        category: extractedCategory.toLowerCase(),
        price: price,
        currency: 'INR',
        image_url: imageUrl,
        description: item.description || item.product_specifications || '',
        rating: Math.min(rating, 5.0), // Ensure rating doesn't exceed 5
        brand: item.brand || 'Unknown',
        source: 'flipkart',
        external_id: item.uniq_id,
        stock: Math.floor(Math.random() * 50) + 1, // Generate random stock since not available
        discount: item.discounted_price && item.retail_price ? 
          `${Math.round(((parseFloat(item.retail_price.replace(/[^\d.]/g, '')) - price) / parseFloat(item.retail_price.replace(/[^\d.]/g, ''))) * 100)}% OFF` : 
          undefined
      }
    })
  } catch (error) {
    console.error('Error in fetchFromFlipkart:', error)
    return []
  }
}

// Helper function to validate image URLs
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Check if it's a valid URL format
  try {
    new URL(url)
  } catch {
    return false
  }
  
  // Check if it has image file extension or is from known image hosting services
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  const imageHosts = /(images\.|img\.|static\.|cdn\.|amazonaws\.com|cloudinary\.com|imgur\.com|pexels\.com|unsplash\.com|flipkart\.com|fkimg\.com)/i
  
  return imageExtensions.test(url) || imageHosts.test(url)
}

async function fetchExternalProducts(query: string, category?: string, limit = 10): Promise<Product[]> {
  const products: Product[] = []

  try {
    // Fetch from DummyJSON API (free fake store API)
    const dummyProducts = await fetchFromDummyJSON(query, category, Math.ceil(limit / 2))
    products.push(...dummyProducts)

    // Fetch from FakeStore API
    const fakeStoreProducts = await fetchFromFakeStore(query, category, Math.floor(limit / 2))
    products.push(...fakeStoreProducts)

  } catch (error) {
    console.error('Error fetching external products:', error)
  }

  return products.slice(0, limit)
}

async function fetchFromDummyJSON(query: string, category?: string, limit = 5): Promise<Product[]> {
  try {
    const response = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    const data = await response.json()

    return data.products?.map((item: any) => ({
      id: `dummy_${item.id}`,
      name: item.title,
      category: item.category || 'general',
      price: item.price,
      currency: 'USD',
      image_url: item.thumbnail || item.images?.[0] || '',
      description: item.description,
      rating: item.rating || 4.0,
      brand: item.brand || 'Unknown',
      source: 'dummyjson',
      external_id: item.id.toString(),
      stock: item.stock || 1,
      discount: item.discountPercentage ? `${Math.round(item.discountPercentage)}% OFF` : undefined
    })) || []
  } catch (error) {
    console.error('Error fetching from DummyJSON:', error)
    return []
  }
}

async function fetchFromFakeStore(query: string, category?: string, limit = 5): Promise<Product[]> {
  try {
    let url = 'https://fakestoreapi.com/products'
    if (category) {
      // Map categories to FakeStore categories
      const categoryMap: { [key: string]: string } = {
        'apparel': 'clothing',
        'fashion': 'clothing',
        'clothing': 'clothing',
        'electronics': 'electronics',
        'jewelry': 'jewelery',
        'accessories': 'jewelery'
      }
      const mappedCategory = categoryMap[category.toLowerCase()]
      if (mappedCategory) {
        url += `/category/${mappedCategory}`
      }
    }

    const response = await fetch(`${url}?limit=${limit}`)
    const data = await response.json()

    const products = Array.isArray(data) ? data : []
    
    return products
      .filter((item: any) => 
        !query || 
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
      .map((item: any) => ({
        id: `fakestore_${item.id}`,
        name: item.title,
        category: item.category || 'general',
        price: item.price,
        currency: 'USD',
        image_url: item.image || '',
        description: item.description,
        rating: item.rating?.rate || 4.0,
        brand: 'Generic',
        source: 'fakestore',
        external_id: item.id.toString(),
        stock: Math.floor(Math.random() * 20) + 1, // Random stock since API doesn't provide it
      }))
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching from FakeStore:', error)
    return []
  }
}