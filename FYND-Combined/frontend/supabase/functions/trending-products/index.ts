import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Fetch trending products from multiple sources including Flipkart
    const trendingProducts = await fetchTrendingProducts(category, limit)

    return new Response(
      JSON.stringify({ 
        products: trendingProducts,
        total: trendingProducts.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in trending-products function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchTrendingProducts(category?: string | null, limit = 10): Promise<any[]> {
  const products: any[] = []

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch trending from Flipkart table
    const flipkartTrending = await fetchTrendingFromFlipkart(supabaseClient, category, Math.floor(limit / 3))
    products.push(...flipkartTrending)

    // Fetch from DummyJSON with high ratings
    const dummyResponse = await fetch(`https://dummyjson.com/products?limit=${Math.ceil(limit / 3)}&sortBy=rating&order=desc`)
    const dummyData = await dummyResponse.json()
    
    const dummyProducts = dummyData.products?.map((item: any) => ({
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
      discount: item.discountPercentage ? `${Math.round(item.discountPercentage)}% OFF` : undefined,
      trending: true
    })) || []

    products.push(...dummyProducts)

    // Fetch from FakeStore
    let fakeStoreUrl = 'https://fakestoreapi.com/products'
    if (category) {
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
        fakeStoreUrl += `/category/${mappedCategory}`
      }
    }

    const fakeStoreResponse = await fetch(`${fakeStoreUrl}?limit=${Math.floor(limit / 3)}`)
    const fakeStoreData = await fakeStoreResponse.json()

    const fakeStoreProducts = (Array.isArray(fakeStoreData) ? fakeStoreData : [])
      .filter((item: any) => (item.rating?.rate || 0) >= 4.0) // Only high-rated products
      .map((item: any) => ({
        id: `fakestore_${item.id}`,
        name: item.title,
        category: item.category || 'general',
        price: item.price,
        currency: 'USD',
        image_url: item.image || '',
        description: item.description,
        rating: item.rating?.rate || 4.0,
        brand: 'Premium',
        source: 'fakestore',
        external_id: item.id.toString(),
        stock: Math.floor(Math.random() * 20) + 1,
        trending: true
      }))

    products.push(...fakeStoreProducts)

  } catch (error) {
    console.error('Error fetching trending products:', error)
  }

  // Sort by rating and return top products
  return products
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit)
}

// Enhanced function to fetch trending products from Flipkart table with better image handling
async function fetchTrendingFromFlipkart(supabaseClient: any, category?: string | null, limit = 5): Promise<any[]> {
  try {
    let dbQuery = supabaseClient
      .from('flipkart')
      .select('*')
      .order('product_rating', { ascending: false })
      .limit(limit)

    if (category) {
      dbQuery = dbQuery.or(`product_category_tree::text.ilike.%${category}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching trending from Flipkart table:', error)
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
        rating: Math.min(rating, 5.0),
        brand: item.brand || 'Unknown',
        source: 'flipkart',
        external_id: item.uniq_id,
        stock: Math.floor(Math.random() * 50) + 1,
        discount: item.discounted_price && item.retail_price ? 
          `${Math.round(((parseFloat(item.retail_price.replace(/[^\d.]/g, '')) - price) / parseFloat(item.retail_price.replace(/[^\d.]/g, ''))) * 100)}% OFF` : 
          undefined,
        trending: true
      }
    })
  } catch (error) {
    console.error('Error in fetchTrendingFromFlipkart:', error)
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