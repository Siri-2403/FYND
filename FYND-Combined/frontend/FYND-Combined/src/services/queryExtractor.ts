// Query extraction service - converts natural language to search parameters
import type { SearchParams } from '../lib/supabase'

interface ExtractedInfo {
  category?: string
  subcategory?: string
  brand?: string
  color?: string
  price_max?: number
  location?: string
  size?: string
  product_name?: string
  min_rating?: number
}

export class QueryExtractor {
  private static readonly CATEGORIES = [
    'footwear', 'apparel', 'accessories', 'groceries', 
    'food', 'home decor', 'home essentials', 'electronics'
  ]

  private static readonly SUBCATEGORIES = [
    'athletic', 'top', 'bottom', 'outerwear', 'headwear',
    'bag', 'ethnic', 'produce', 'bakery', 'ready-to-eat', 
    'wall art', 'decorative', 'kitchenware', 'bedding', 
    'window', 'lighting'
  ]

  private static readonly BRANDS = [
    'nike', 'puma', 'adidas', 'levis', 'zara', 'h&m',
    'michael kors', 'guess', 'philips', 'samsung',
    'apple', 'dominos', 'pizza hut', 'organic harvest'
  ]

  private static readonly COLORS = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 
    'brown', 'pink', 'purple', 'beige', 'orange', 'gold', 
    'silver', 'gray', 'navy', 'multicolor'
  ]

  private static readonly LOCATIONS = [
    'new york', 'los angeles', 'chicago', 'houston', 
    'phoenix', 'philadelphia', 'san antonio', 'san diego',
    'dallas', 'san jose', 'austin', 'jacksonville',
    'fort worth', 'columbus', 'charlotte', 'san francisco',
    'indianapolis', 'seattle', 'denver', 'washington',
    'boston', 'el paso', 'detroit', 'nashville',
    'portland', 'memphis', 'oklahoma city', 'las vegas',
    'louisville', 'baltimore', 'milwaukee', 'albuquerque',
    'tucson', 'fresno', 'mesa', 'sacramento', 'atlanta',
    'kansas city', 'colorado springs', 'omaha', 'raleigh',
    'miami', 'oakland', 'minneapolis', 'tulsa', 'cleveland',
    'wichita', 'arlington'
  ]

  private static readonly SIZES = [
    's', 'small', 'm', 'medium', 'l', 'large', 'xl', 'xxl',
    'xs', 'extra small', 'extra large', 'free size', 'one size',
    '6', '7', '8', '9', '10', '11', '12', '13', '14',
    '28', '30', '32', '34', '36', '38', '40', '42'
  ]

  private static readonly PRODUCT_NAMES = [
    'sneakers', 'shoes', 't-shirt', 'shirt', 'jeans', 'pants',
    'jacket', 'coat', 'dress', 'skirt', 'shorts', 'cap', 'hat',
    'handbag', 'backpack', 'wallet', 'watch', 'sunglasses',
    'pizza', 'burger', 'sandwich', 'salad', 'pasta', 'rice',
    'bread', 'milk', 'eggs', 'cheese', 'chicken', 'beef',
    'sofa', 'chair', 'table', 'bed', 'lamp', 'curtains',
    'pillow', 'blanket', 'vase', 'mirror', 'phone', 'laptop',
    'headphones', 'speaker', 'camera', 'tablet'
  ]

  private static fuzzyMatch(word: string, choices: string[], threshold = 0.7): string | null {
    if (!word || word.length < 2) return null
    
    word = word.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    for (const choice of choices) {
      if (choice.includes(word) || word.includes(choice)) {
        const score = Math.max(
          choice.length / word.length,
          word.length / choice.length
        )
        if (score > bestScore && score >= threshold) {
          bestScore = score
          bestMatch = choice
        }
      }
    }

    return bestMatch
  }

  private static extractPrice(query: string): number | undefined {
    const pricePatterns = [
      /(?:under|below|less than|up to|max|maximum)\s*\$?(\d+(?:\.\d{2})?)/i,
      /\$(\d+(?:\.\d{2})?)\s*(?:or less|max|maximum)/i,
      /price\s*(?:under|below|less than|up to|max|maximum)\s*\$?(\d+(?:\.\d{2})?)/i,
      /budget\s*(?:of|is|under|below)?\s*\$?(\d+(?:\.\d{2})?)/i
    ]

    for (const pattern of pricePatterns) {
      const match = query.match(pattern)
      if (match) {
        return parseFloat(match[1])
      }
    }

    return undefined
  }

  private static extractRating(query: string): number | undefined {
    const ratingPatterns = [
      /(?:rating|rated)\s*(?:above|over|at least)\s*(\d(?:\.\d)?)/i,
      /(\d(?:\.\d)?)\s*(?:stars?|rating)\s*(?:or|and)\s*(?:above|over|higher)/i,
      /(?:minimum|min)\s*(?:rating|stars?)\s*(?:of)?\s*(\d(?:\.\d)?)/i
    ]

    for (const pattern of ratingPatterns) {
      const match = query.match(pattern)
      if (match) {
        const rating = parseFloat(match[1])
        return rating <= 5 ? rating : undefined
      }
    }

    return undefined
  }

  static extractInfo(query: string): SearchParams {
    if (!query || typeof query !== 'string') {
      return {}
    }

    const cleanQuery = query.toLowerCase().trim()
    const params: SearchParams = {}

    // Extract price
    params.price_max = this.extractPrice(cleanQuery)

    // Extract rating
    params.min_rating = this.extractRating(cleanQuery)

    // Remove price and rating mentions for cleaner token processing
    let processedQuery = cleanQuery
      .replace(/(?:under|below|less than|up to|max|maximum)\s*\$?\d+(?:\.\d{2})?/gi, '')
      .replace(/\$\d+(?:\.\d{2})?\s*(?:or less|max|maximum)/gi, '')
      .replace(/(?:rating|rated)\s*(?:above|over|at least)\s*\d(?:\.\d)?/gi, '')
      .replace(/\d(?:\.\d)?\s*(?:stars?|rating)\s*(?:or|and)\s*(?:above|over|higher)/gi, '')

    // Extract tokens
    const tokens = processedQuery
      .split(/[\s,.-]+/)
      .filter(token => token.length > 1)
      .filter(token => !['i', 'need', 'want', 'looking', 'for', 'find', 'show', 'me', 'get', 'buy', 'search', 'a', 'an', 'the', 'some', 'any'].includes(token))

    // Try to match complete product names first
    for (const productName of this.PRODUCT_NAMES) {
      if (cleanQuery.includes(productName)) {
        params.product_name = productName
        processedQuery = processedQuery.replace(productName, '')
        break
      }
    }

    // Process remaining tokens
    for (const token of tokens) {
      if (!token) continue

      // Skip if we already found this type
      if (!params.category) {
        const category = this.fuzzyMatch(token, this.CATEGORIES)
        if (category) {
          params.category = category
          continue
        }
      }

      if (!params.subcategory) {
        const subcategory = this.fuzzyMatch(token, this.SUBCATEGORIES)
        if (subcategory) {
          params.subcategory = subcategory
          continue
        }
      }

      if (!params.brand) {
        const brand = this.fuzzyMatch(token, this.BRANDS)
        if (brand) {
          params.brand = brand
          continue
        }
      }

      if (!params.color) {
        const color = this.fuzzyMatch(token, this.COLORS)
        if (color) {
          params.color = color
          continue
        }
      }

      if (!params.location) {
        const location = this.fuzzyMatch(token, this.LOCATIONS)
        if (location) {
          params.location = location
          continue
        }
      }

      if (!params.size) {
        const size = this.fuzzyMatch(token, this.SIZES)
        if (size) {
          params.size = size
          continue
        }
      }
    }

    // Set default limit
    params.limit = 20

    return params
  }
}