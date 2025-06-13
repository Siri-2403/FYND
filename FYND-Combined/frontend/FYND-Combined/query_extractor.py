import re
from collections import defaultdict

class QueryExtractor:
    def __init__(self, known_brands=None, known_categories=None):
        self.known_brands = known_brands or []
        self.known_categories = known_categories or []
        
        # Improved regex patterns
        self.price_pattern = re.compile(
            r'(?:under|below|less\s*than|above|over|more\s*than|₹|rs|inr)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 
            re.IGNORECASE
        )
        self.range_pattern = re.compile(
            r'(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:to|-|and)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 
            re.IGNORECASE
        )
        self.must_include_pattern = re.compile(r'\"([^\"]+)\"')
        
    def _clean_price(self, price_str):
        """Convert price string to float"""
        return float(price_str.replace(',', ''))
    
    def extract_price_filters(self, query):
        """Extract price range filters from query"""
        price_filters = {
            'min_price': None,
            'max_price': None
        }
        clean_query = query
        
        # Check for range patterns (e.g., "1000 to 2000")
        range_match = self.range_pattern.search(query)
        if range_match:
            min_p, max_p = map(self._clean_price, range_match.groups())
            price_filters['min_price'] = min_p
            price_filters['max_price'] = max_p
            clean_query = self.range_pattern.sub('', clean_query)
        
        # Check for single price limits
        price_matches = list(self.price_pattern.finditer(query))
        if price_matches:
            for match in price_matches:
                price = self._clean_price(match.group(1))
                prefix = match.group(0).lower()
                
                if any(word in prefix for word in ['under', 'below', 'less']):
                    price_filters['max_price'] = price
                elif any(word in prefix for word in ['above', 'over', 'more']):
                    price_filters['min_price'] = price
                else:  # Just a price mention without qualifier
                    price_filters['max_price'] = price * 1.1
                    price_filters['min_price'] = price * 0.9
                
                clean_query = clean_query.replace(match.group(0), '')
        
        return price_filters, clean_query.strip()
    
    def extract_brand_filters(self, query):
        """Extract brand filters from query"""
        brands_found = []
        clean_query = query
        
        for brand in self.known_brands:
            if isinstance(brand, str) and brand.lower() in query.lower():
                brands_found.append(brand)
                clean_query = clean_query.replace(brand, '')
        
        return brands_found, clean_query.strip()
    
    def extract_category_filters(self, query):
        """Extract category filters from query"""
        categories_found = []
        clean_query = query
        
        for category in self.known_categories:
            if isinstance(category, str) and category.lower() in query.lower():
                categories_found.append(category)
                clean_query = clean_query.replace(category, '')
        
        return categories_found, clean_query.strip()
    
    def extract_must_include(self, query):
        """Extract quoted terms that must be included"""
        must_include = []
        clean_query = query
        
        for match in self.must_include_pattern.finditer(query):
            must_include.append(match.group(1).lower())
            clean_query = clean_query.replace(match.group(0), '')
        
        return must_include, clean_query.strip()
    
    def process(self, query):
        """Process query and extract all filters"""
        # Extract must-include terms first
        must_include, clean_query = self.extract_must_include(query)
        
        # Extract price filters
        price_filters, clean_query = self.extract_price_filters(clean_query)
        
        # Extract brand filters
        brand_filters, clean_query = self.extract_brand_filters(clean_query)
        
        # Extract category filters
        category_filters, clean_query = self.extract_category_filters(clean_query)
        
        # Extract keywords to exclude (prefixed with -)
        exclude_terms = []
        words = clean_query.split()
        for word in words[:]:
            if word.startswith('-'):
                exclude_terms.append(word[1:].lower())
                words.remove(word)
        clean_query = ' '.join(words)
        
        return {
            'original_query': query,
            'clean_query': clean_query,
            'filters': {
                'price': price_filters,
                'brands': brand_filters,
                'categories': category_filters,
                'must_include': must_include,
                'exclude': exclude_terms
            }
        }