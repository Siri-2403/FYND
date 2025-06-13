from collections import defaultdict
import math
import re
import pandas as pd
from query_extractor import QueryExtractor
from typing import List, Dict, Tuple, Optional

class SearchEngineBase:
    def __init__(self, df: pd.DataFrame = None):
        self.index = defaultdict(list)
        self.documents = []
        self.doc_lengths = []
        self.avg_doc_length = 0
        self.df = pd.DataFrame() if df is None else df.copy()

    def preprocess_text(self, text: str) -> List[str]:
        """Normalize and tokenize text for indexing"""
        if not isinstance(text, str):
            return []
        text = re.sub(r'[^\w\s₹]', '', text.lower())
        return [word for word in text.split() if len(word) > 2]  # Ignore short words

    def add_to_index(self, text: str, doc_id: int):
        """Add document to search index"""
        terms = self.preprocess_text(text)
        term_counts = defaultdict(int)
        
        for term in terms:
            term_counts[term] += 1
        
        for term, count in term_counts.items():
            self.index[term].append((doc_id, count))
        
        self.documents.append(text)
        self.doc_lengths.append(len(terms))
        self.avg_doc_length = sum(self.doc_lengths) / len(self.doc_lengths) if self.doc_lengths else 0

    def build_index(self):
        """Build search index from DataFrame"""
        if self.df.empty:
            raise ValueError("DataFrame is empty")
            
        for doc_id, row in self.df.iterrows():
            # Combine all relevant fields for indexing
            text_parts = [
                str(row.get('product_name', '')),
                str(row.get('brand', '')),
                ' '.join(row['category_hierarchy']) if isinstance(row.get('category_hierarchy'), list) 
                   else str(row.get('category_hierarchy', '')),
                str(row.get('description', ''))
            ]
            self.add_to_index(' '.join(text_parts), doc_id)

    def bm25_score(self, query_terms: List[str], doc_id: int) -> float:
        """Calculate BM25 relevance score with enhancements"""
        k1 = 1.5
        b = 0.75
        score = 0.0
        doc_length = self.doc_lengths[doc_id] if doc_id < len(self.doc_lengths) else self.avg_doc_length
        
        for term in query_terms:
            # Term frequency in document
            tf = sum(1 for entry in self.index.get(term, []) if entry[0] == doc_id)
            
            # Document frequency
            df = len(self.index.get(term, []))
            if df == 0:
                continue
                
            # Inverse document frequency with smoothing
            N = len(self.documents)
            idf = math.log((N - df + 0.5) / (df + 0.5) + 1)
            
            # BM25 term weight
            numerator = tf * (k1 + 1)
            denominator = tf + k1 * (1 - b + b * (doc_length / self.avg_doc_length))
            score += idf * (numerator / denominator)
        
        return score

    def search(self, query: str, top_n: int = 10) -> List[Tuple[int, float]]:
        """Base search implementation"""
        query_terms = self.preprocess_text(query)
        if not query_terms:
            return []
        
        doc_scores = defaultdict(float)
        for term in query_terms:
            for doc_id, tf in self.index.get(term, []):
                doc_scores[doc_id] += self.bm25_score(query_terms, doc_id)
        
        return sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]

class FlipkartSearchEngine(SearchEngineBase):
    def __init__(self, data_file: str):
        super().__init__()
        self.blocked_terms = [
            'bra', 'brassiere', 'lingerie', 'bikini', 'panty',
            'underwear', 'intimate', 'innerwear', 'brief'
        ]
        
        try:
            # Load and clean data
            self.df = pd.read_csv(data_file)
            self._clean_data()
            self._remove_blocked_items
            self.build_index()
            
            # Initialize query extractor with proper known values
            self.extractor = QueryExtractor(
                known_brands=self._get_unique_brands(),
                known_categories=self._get_unique_categories()
            )
        except Exception as e:
            raise ValueError(f"Search engine initialization failed: {str(e)}")
        
    def _remove_blocked_items(self):
        """Remove blocked items before indexing"""
        self.df = self.df[~self.df.apply(self.blocker.should_block, axis=1)]

    def _is_blocked_product(self, product):
        """Check if product should be blocked from results"""
        name = str(product.get('product_name', '')).lower()
        brand = str(product.get('brand', '')).lower()
        
        # Handle categories (works with both list and string formats)
        categories = []
        if isinstance(product.get('category_hierarchy'), list):
            categories = [str(c).lower() for c in product['category_hierarchy']]
        elif pd.notna(product.get('category_hierarchy')):
            categories = [str(product['category_hierarchy']).lower()]
        
        # Check all relevant fields for blocked terms
        for term in self.blocked_terms:
            if (term in name or 
                term in brand or 
                any(term in cat for cat in categories)):
                return True
        return False
    
    def _clean_data(self):
        """Ensure data consistency and handle missing values"""
        # Create missing columns with empty defaults
        for col in ['product_name', 'brand', 'category_hierarchy', 'discounted_price', 'description']:
            if col not in self.df.columns:
                self.df[col] = '' if col != 'discounted_price' else float('inf')
        
        # Clean text fields
        self.df['product_name'] = self.df['product_name'].astype(str)
        self.df['brand'] = self.df['brand'].astype(str).replace('nan', '')
        
        # Handle category hierarchy
        if 'category_hierarchy' in self.df.columns:
            if isinstance(self.df['category_hierarchy'].iloc[0], str):
                self.df['category_hierarchy'] = (
                    self.df['category_hierarchy']
                    .str.split('>>')
                    .apply(lambda x: [item.strip() for item in x] if isinstance(x, list) else [])
                )
            elif not isinstance(self.df['category_hierarchy'].iloc[0], list):
                self.df['category_hierarchy'] = [[] for _ in range(len(self.df))]
        
        # Clean numeric fields
        self.df['discounted_price'] = (
            pd.to_numeric(self.df['discounted_price'], errors='coerce')
            .fillna(float('inf'))
        )

    def _get_unique_brands(self) -> List[str]:
        """Get unique brand names"""
        return (
            self.df['brand']
            .str.lower()
            .dropna()
            .unique()
            .tolist()
        )

    def _get_unique_categories(self) -> List[str]:
        """Get unique categories from hierarchy"""
        try:
            return (
                self.df['category_hierarchy']
                .explode()
                .str.lower()
                .dropna()
                .unique()
                .tolist()
            )
        except:
            return []

    def _extract_filters(self, query: str) -> Dict:
        """Enhanced filter extraction"""
        extracted = self.extractor.process(query.lower())
        filters = extracted['filters']
        
        # Extract price limit from query
        price_matches = re.findall(r'(?:under|below|less than|₹|rs|inr)\s*(\d+(?:,\d{3})*)', query.lower())
        if price_matches:
            filters['price']['max_price'] = float(price_matches[-1].replace(',', ''))
        
        return filters

    def _calculate_relevance(self, product: pd.Series, query_terms: List[str]) -> float:
        """Calculate custom relevance score"""
        # Base score components
        name = product.get('product_name', '').lower()
        categories = ' '.join(product.get('category_hierarchy', [])).lower()
        description = product.get('description', '').lower()
        
        # Term presence boosts
        name_matches = sum(1 for term in query_terms if term in name)
        category_matches = sum(1 for term in query_terms if term in categories)
        
        # Positional boosts
        name_boost = 3.0  # Highest priority - matches in product name
        category_boost = 2.0  # Medium priority - matches in category
        desc_boost = 1.0  # Lower priority - matches in description
        
        return (
            (name_matches * name_boost) + 
            (category_matches * category_boost) +
            (sum(1 for term in query_terms if term in description) * desc_boost)
        )

    def search(self, query: str, top_n: int = 10) -> List[Tuple[int, float]]:
        """Precision search with intelligent filtering"""
        try:
            # Process query and extract filters
            filters = self._extract_filters(query)
            query_terms = self.preprocess_text(query.lower())
            
            if not query_terms:
                return []
            
            # Get base results
            base_results = super().search(query, top_n * 2)
            
            # Apply strict filtering and custom relevance
            seen=set()
            final_results = []
            for doc_id, bm25_score in base_results:
                product = self.df.iloc[doc_id]
                
                # Skip blocked products
                if self._is_blocked_product(product):
                    continue
                
                key = (
                    product['product_name'].strip().lower(),
                    product['brand'].strip().lower()
                )
                
                if key in seen:
                    continue
                seen.add(key)
                   
            results = []
            for doc_id, bm25_score in base_results:
                product = self.df.iloc[doc_id]
                
                # Price filter
                price = product.get('discounted_price', float('inf'))
                if filters['price'].get('max_price') and price > filters['price']['max_price']:
                    continue
                
                # Must-include terms filter
                if filters['must_include']:
                    product_text = f"{product['product_name']} {' '.join(product.get('category_hierarchy', []))}".lower()
                    if not all(term in product_text for term in filters['must_include']):
                        continue
                
                # Exclude terms filter
                if filters['exclude']:
                    product_text = f"{product['product_name']} {product.get('description', '')}".lower()
                    if any(term in product_text for term in filters['exclude']):
                        continue
                
                # Calculate custom relevance score
                custom_score = self._calculate_relevance(product, query_terms)
                final_score = bm25_score * (1 + custom_score * 0.1)  # Combine scores
                
                results.append((doc_id, final_score))
            
            # Deduplicate results
            seen = set()
            final_results = []
            for doc_id, score in results:
                product = self.df.iloc[doc_id]
                key = (
                    product['product_name'].strip().lower(),
                    product['brand'].strip().lower()
                )
                if key not in seen:
                    seen.add(key)
                    final_results.append((doc_id, score))
            
            # Sort by final score and return top results
            final_results.sort(key=lambda x: x[1], reverse=True)
            return final_results[:top_n]
            
        except Exception as e:
            print(f"Search error: {str(e)}")
            return []