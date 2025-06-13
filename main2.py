from search_engine import FlipkartSearchEngine
import pandas as pd
import os

def display_fynd_results(results, df):
    """Displays results in a clean, FYND-branded format"""
    if not results:
        print("😞 No matching products found. Try different keywords or filters.")
        return
    
    print("\n🔍 FYND Search Results:")
    print("━" * 56)
    
    for i, (doc_id, score) in enumerate(results, 1):
        product = df.iloc[doc_id]
        
        # Product name (truncate if too long)
        name = product['product_name']
        if len(name) > 60:
            name = name[:57] + "..."
        print(f"🏷️ {i}. {name}")
        
        # Brand
        if pd.notna(product.get('brand')):
            print(f"   ⭐ Brand: {product['brand']}")
        
        # Price & Discount
        if pd.notna(product.get('discounted_price')):
            price_str = f"💰 Price: ₹{product['discounted_price']:.2f}"
            if pd.notna(product.get('retail_price')) and product['retail_price'] > product['discounted_price']:
                discount = ((product['retail_price'] - product['discounted_price']) / product['retail_price']) * 100
                price_str += f" (🔖 {discount:.0f}% OFF)"
            print(price_str)
        
        # Ratings (if available)
        if pd.notna(product.get('product_rating')):
            print(f"   🌟 Rating: {product['product_rating']}/5")
        
        # Category
        if isinstance(product.get('category_hierarchy'), list):
            print(f"   📦 Category: {' → '.join(product['category_hierarchy'][:3])}")
        elif pd.notna(product.get('category_hierarchy')):
            print(f"   📦 Category: {product['category_hierarchy']}")
        
        print("━" * 56)

def main():
    # FYND AI Assistant Welcome
    print("\n" + " FYND AI  ")
    print("\nHello there! Welcome to FYND. What are you looking for today?\n")

    # Load data
    data_file = "flipkart_com-ecommerce_sample.csv"
    if not os.path.exists(data_file):
        print("❌ Error: Product database not found. Please check the file path.")
        return
    
    try:
        search_engine = FlipkartSearchEngine(data_file)
        search_engine.build_index()
    except Exception as e:
        print(f"❌ Failed to load data: {str(e)}")
        return

    # AI Assistant Interaction Loop
    while True:
        query = input("\n🔎 What are you looking for? (or type 'exit' to quit): ").strip()
        
        if query.lower() in ['exit', 'quit']:
            print("\nThank you for using FYND! Happy shopping! 🛍️\n")
            break
            
        if not query:
            print("🤔 Please describe a product (e.g., 'wireless headphones under ₹2000')")
            continue
            
        print(f"\nSearching for '{query}'...")
        # In your main.py:
        
        results = search_engine.search(query)
        display_fynd_results(results, search_engine.df)

if __name__ == "__main__":
    main()