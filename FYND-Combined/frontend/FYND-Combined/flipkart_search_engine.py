from search_engine import SearchEngineBase
from data_preprocessor import FlipkartDataPreprocessor
import pandas as pd

class FlipkartSearchEngine(SearchEngineBase):
    def __init__(self, data_file):
        preprocessor = FlipkartDataPreprocessor(data_file)
        self.df = preprocessor.preprocess()
        super().__init__()
        
    def build_index(self):
        # Index product names, descriptions, and specifications
        for idx, row in self.df.iterrows():
            text_to_index = f"{row['product_name']} {row['description']} "
            text_to_index += " ".join([f"{k} {v}" for k, v in row['specifications'].items()])
            
            self.add_to_index(text_to_index, idx)
    
    def search(self, query, top_n=10):
        # Get basic search results
        results = super().search(query)
        
        # Apply e-commerce specific ranking
        ranked_results = []
        for doc_id, score in results:
            product = self.df.iloc[doc_id]
            
            # Boost products with higher discounts and ratings
            boost = 1
            if not pd.isna(product['discount_percentage']):
                boost += product['discount_percentage'] * 0.01
            if not pd.isna(product['product_rating']):
                boost += product['product_rating'] * 0.2
                
            ranked_results.append((doc_id, score * boost))
        
        # Sort by boosted score
        ranked_results.sort(key=lambda x: x[1], reverse=True)
        
        return ranked_results[:top_n]