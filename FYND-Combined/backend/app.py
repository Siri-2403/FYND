from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from search_engine import FlipkartSearchEngine
from data_preprocessor import FlipkartDataPreprocessor
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables to store the search engine and data
search_engine = None
df = None

def initialize_search_engine():
    """Initialize the search engine with CSV data"""
    global search_engine, df
    
    try:
        # Use the CSV file from the backend directory
        data_file = "flipkart_com-ecommerce_sample.csv"
        
        if not os.path.exists(data_file):
            print(f"❌ Error: {data_file} not found")
            return False
            
        print("🔄 Initializing search engine...")
        search_engine = FlipkartSearchEngine(data_file)
        search_engine.build_index()
        df = search_engine.df
        print("✅ Search engine initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize search engine: {str(e)}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'FYND Backend API is running',
        'search_engine_ready': search_engine is not None
    })

@app.route('/api/search', methods=['POST'])
def search_products():
    """Search products endpoint"""
    global search_engine, df
    
    if search_engine is None:
        return jsonify({
            'error': 'Search engine not initialized',
            'products': [],
            'total': 0
        }), 500
    
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        limit = data.get('limit', 20)
        
        if not query:
            return jsonify({
                'error': 'Query parameter is required',
                'products': [],
                'total': 0
            }), 400
        
        print(f"🔍 Searching for: '{query}'")
        
        # Perform search
        results = search_engine.search(query, top_n=limit)
        
        # Convert results to frontend format
        products = []
        for doc_id, score in results:
            try:
                product = df.iloc[doc_id]
                
                # Extract category from product_category_tree
                category = 'general'
                if pd.notna(product.get('product_category_tree')):
                    if isinstance(product['product_category_tree'], str):
                        categories = product['product_category_tree'].split(' >> ')
                        category = categories[-1].strip() if categories else 'general'
                
                # Parse price
                price = 0
                if pd.notna(product.get('discounted_price')):
                    price_str = str(product['discounted_price']).replace('₹', '').replace(',', '')
                    try:
                        price = float(price_str)
                    except:
                        price = 0
                elif pd.notna(product.get('retail_price')):
                    price_str = str(product['retail_price']).replace('₹', '').replace(',', '')
                    try:
                        price = float(price_str)
                    except:
                        price = 0
                
                # Parse rating
                rating = 4.0
                if pd.notna(product.get('product_rating')):
                    try:
                        rating = float(product['product_rating'])
                        rating = min(rating, 5.0)  # Cap at 5.0
                    except:
                        rating = 4.0
                
                # Calculate discount
                discount = None
                if (pd.notna(product.get('retail_price')) and 
                    pd.notna(product.get('discounted_price'))):
                    try:
                        retail = float(str(product['retail_price']).replace('₹', '').replace(',', ''))
                        discounted = float(str(product['discounted_price']).replace('₹', '').replace(',', ''))
                        if retail > discounted:
                            discount_pct = ((retail - discounted) / retail) * 100
                            discount = f"{discount_pct:.0f}% OFF"
                    except:
                        pass
                
                # Default image URL
                image_url = 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400'
                
                product_data = {
                    'id': f"flipkart_{product.get('uniq_id', doc_id)}",
                    'name': str(product.get('product_name', 'Unknown Product')),
                    'category': category.lower(),
                    'brand': str(product.get('brand', 'Unknown')),
                    'price': price,
                    'currency': 'INR',
                    'image_url': image_url,
                    'description': str(product.get('description', product.get('product_specifications', ''))),
                    'rating': rating,
                    'stock': 10,  # Default stock
                    'source': 'flipkart',
                    'external_id': str(product.get('uniq_id', doc_id)),
                    'discount': discount,
                    'created_at': '2024-01-01T00:00:00Z',
                    'updated_at': '2024-01-01T00:00:00Z'
                }
                
                products.append(product_data)
                
            except Exception as e:
                print(f"Error processing product {doc_id}: {str(e)}")
                continue
        
        response = {
            'products': products,
            'total': len(products),
            'sources': {
                'local': len(products),
                'external': 0
            }
        }
        
        print(f"✅ Found {len(products)} products")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Search error: {str(e)}")
        return jsonify({
            'error': f'Search failed: {str(e)}',
            'products': [],
            'total': 0
        }), 500

@app.route('/api/trending', methods=['GET'])
def get_trending_products():
    """Get trending products endpoint"""
    global search_engine, df
    
    if search_engine is None or df is None:
        return jsonify({
            'products': [],
            'total': 0
        }), 500
    
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # Get top-rated products as trending
        trending_df = df.nlargest(limit, 'product_rating') if 'product_rating' in df.columns else df.head(limit)
        
        products = []
        for idx, product in trending_df.iterrows():
            try:
                # Extract category
                category = 'general'
                if pd.notna(product.get('product_category_tree')):
                    if isinstance(product['product_category_tree'], str):
                        categories = product['product_category_tree'].split(' >> ')
                        category = categories[-1].strip() if categories else 'general'
                
                # Parse price
                price = 0
                if pd.notna(product.get('discounted_price')):
                    price_str = str(product['discounted_price']).replace('₹', '').replace(',', '')
                    try:
                        price = float(price_str)
                    except:
                        price = 0
                
                # Parse rating
                rating = 4.0
                if pd.notna(product.get('product_rating')):
                    try:
                        rating = float(product['product_rating'])
                        rating = min(rating, 5.0)
                    except:
                        rating = 4.0
                
                product_data = {
                    'id': f"flipkart_{product.get('uniq_id', idx)}",
                    'name': str(product.get('product_name', 'Unknown Product')),
                    'category': category.lower(),
                    'brand': str(product.get('brand', 'Unknown')),
                    'price': price,
                    'currency': 'INR',
                    'image_url': 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400',
                    'description': str(product.get('description', product.get('product_specifications', ''))),
                    'rating': rating,
                    'stock': 10,
                    'source': 'flipkart',
                    'external_id': str(product.get('uniq_id', idx)),
                    'trending': True,
                    'created_at': '2024-01-01T00:00:00Z',
                    'updated_at': '2024-01-01T00:00:00Z'
                }
                
                products.append(product_data)
                
            except Exception as e:
                print(f"Error processing trending product {idx}: {str(e)}")
                continue
        
        return jsonify({
            'products': products,
            'total': len(products)
        })
        
    except Exception as e:
        print(f"❌ Trending products error: {str(e)}")
        return jsonify({
            'products': [],
            'total': 0
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    global df
    
    if df is None:
        return jsonify({
            'total_products': 0,
            'categories': 0,
            'brands': 0
        }), 500
    
    try:
        stats = {
            'total_products': len(df),
            'categories': df['product_category_tree'].nunique() if 'product_category_tree' in df.columns else 0,
            'brands': df['brand'].nunique() if 'brand' in df.columns else 0,
            'avg_rating': float(df['product_rating'].mean()) if 'product_rating' in df.columns else 0
        }
        
        return jsonify(stats)
        
    except Exception as e:
        print(f"❌ Stats error: {str(e)}")
        return jsonify({
            'total_products': 0,
            'categories': 0,
            'brands': 0
        }), 500

if __name__ == '__main__':
    print("🚀 Starting FYND Backend API...")
    
    # Initialize search engine
    if initialize_search_engine():
        print("🌐 Starting Flask server on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to start server - search engine initialization failed")