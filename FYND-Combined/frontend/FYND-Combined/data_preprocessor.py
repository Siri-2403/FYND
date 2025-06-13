import pandas as pd
import numpy as np
from typing import Dict, Any

class FlipkartDataPreprocessor:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df = None
        self.processed_data = None

    def load_data(self) -> None:
        """Load raw data from CSV file"""
        try:
            self.df = pd.read_csv(self.data_path)
            print(f"Successfully loaded data with {len(self.df)} rows")
        except Exception as e:
            raise ValueError(f"Error loading data: {str(e)}")

    def clean_data(self) -> None:
        """Perform data cleaning operations"""
        if self.df is None:
            raise ValueError("Data not loaded. Call load_data() first")

        # Handle missing values
        self.df['product_name'] = self.df['product_name'].fillna('Unknown')
        self.df['brand'] = self.df['brand'].fillna('Unknown')
        
        # Convert price columns to numeric
        self.df['discounted_price'] = pd.to_numeric(
            self.df['discounted_price'].str.replace('₹', '').str.replace(',', ''),
            errors='coerce'
        )
        self.df['retail_price'] = pd.to_numeric(
            self.df['retail_price'].str.replace('₹', '').str.replace(',', ''),
            errors='coerce'
        )

        # Calculate discount percentage
        self.df['discount_percentage'] = round(
            ((self.df['retail_price'] - self.df['discounted_price']) / 
             self.df['retail_price']) * 100, 2
        )

        # Clean category hierarchy
        if 'category_hierarchy' in self.df.columns:
            self.df['category_hierarchy'] = (
                self.df['category_hierarchy']
                .str.split('>>')
                .apply(lambda x: [item.strip() for item in x] if isinstance(x, list) else [])
            )

    def preprocess(self) -> Dict[str, Any]:
        """Run full preprocessing pipeline"""
        self.load_data()
        self.clean_data()
        
        self.processed_data = {
            'products': self.df.to_dict('records'),
            'stats': {
                'total_products': len(self.df),
                'price_range': {
                    'min': float(self.df['discounted_price'].min()),
                    'max': float(self.df['discounted_price'].max())
                },
                'avg_discount': float(self.df['discount_percentage'].mean())
            }
        }
        return self.processed_data

    def save_clean_data(self, output_path: str) -> None:
        """Save processed data to CSV"""
        if self.processed_data is None:
            self.preprocess()
            
        clean_df = pd.DataFrame(self.processed_data['products'])
        clean_df.to_csv(output_path, index=False)
        print(f"Clean data saved to {output_path}")

# Example usage
if __name__ == "__main__":
    processor = FlipkartDataPreprocessor("flipkart_com-ecommerce_sample.csv")
    processed_data = processor.preprocess()
    processor.save_clean_data("cleaned_products.csv")