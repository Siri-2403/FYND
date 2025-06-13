import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { productId, source } = await req.json()

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let product = null

    // Check if it's a local product
    if (!source || source === 'local') {
      const { data: localProduct } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (localProduct) {
        product = localProduct
      }
    }

    // If not found locally, try external APIs
    if (!product && source) {
      if (source === 'dummyjson') {
        const externalId = productId.replace('dummy_', '')
        const response = await fetch(`https://dummyjson.com/products/${externalId}`)
        const data = await response.json()
        
        if (data && data.id) {
          product = {
            id: `dummy_${data.id}`,
            name: data.title,
            category: data.category,
            price: data.price,
            currency: 'USD',
            image_url: data.thumbnail,
            images: data.images || [],
            description: data.description,
            rating: data.rating || 4.0,
            brand: data.brand,
            source: 'dummyjson',
            external_id: data.id.toString(),
            stock: data.stock,
            discount: data.discountPercentage ? `${Math.round(data.discountPercentage)}% OFF` : undefined
          }
        }
      } else if (source === 'fakestore') {
        const externalId = productId.replace('fakestore_', '')
        const response = await fetch(`https://fakestoreapi.com/products/${externalId}`)
        const data = await response.json()
        
        if (data && data.id) {
          product = {
            id: `fakestore_${data.id}`,
            name: data.title,
            category: data.category,
            price: data.price,
            currency: 'USD',
            image_url: data.image,
            description: data.description,
            rating: data.rating?.rate || 4.0,
            brand: 'Generic',
            source: 'fakestore',
            external_id: data.id.toString(),
            stock: Math.floor(Math.random() * 20) + 1
          }
        }
      }
    }

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ product }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-product-details function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})