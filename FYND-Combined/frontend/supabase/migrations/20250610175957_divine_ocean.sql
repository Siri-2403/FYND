/*
  # Seed Sample Data for FYND

  1. Sample Products
    - Insert sample products from the CSV data
    - Add realistic product images and descriptions
    - Set up diverse product categories

  2. Categories
    - Food & Dining
    - Fashion & Apparel
    - Home & Living
    - Groceries & Essentials
*/

-- Insert sample products
INSERT INTO products (name, category, subcategory, brand, price, color, size, location, rating, stock, image_url, description, style, delivery_time, discount, source) VALUES
-- Food & Dining
('Margherita Pizza', 'food', 'ready-to-eat', 'Dominos', 12.99, 'multicolor', 'Large', 'New York', 4.2, 15, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fresh mozzarella, tomato sauce, and basil on crispy crust', 'Classic', '25-35 min', '20% OFF', 'local'),
('Veg Biryani', 'food', 'ready-to-eat', 'ITC', 8.99, 'multicolor', 'Medium', 'Chennai', 4.0, 25, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400', 'Aromatic basmati rice with mixed vegetables and spices', 'Traditional', '30-40 min', '', 'local'),

-- Fashion & Apparel
('Nike Air Max Sneakers', 'footwear', 'athletic', 'Nike', 129.99, 'black', '9', 'Los Angeles', 4.5, 10, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium athletic sneakers with air cushioning technology', 'Standard', '2-3 days', '', 'local'),
('Cotton T-Shirt', 'apparel', 'top', 'Puma', 24.99, 'blue', 'M', 'Chicago', 4.0, 15, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400', 'Comfortable cotton t-shirt perfect for casual wear', 'Slim Fit', '1-2 days', '15% OFF', 'local'),
('Denim Jacket', 'apparel', 'outerwear', 'Levis', 89.99, 'blue', 'L', 'San Francisco', 4.4, 7, 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=400', 'Classic denim jacket with vintage wash and modern fit', 'Vintage', '2-3 days', '', 'local'),
('Leather Handbag', 'accessories', 'bag', 'Michael Kors', 199.99, 'brown', 'Free Size', 'Miami', 4.3, 5, 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium leather handbag with multiple compartments', 'Luxury', '3-5 days', '25% OFF', 'local'),

-- Home & Living
('Smart LED Bulb', 'home essentials', 'lighting', 'Philips', 24.99, 'white', '9W', 'Seattle', 4.4, 8, 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=400', 'WiFi-enabled smart bulb with color changing features', 'Modern', '1-2 days', '', 'local'),
('Ceramic Flower Vase', 'home decor', 'decorative', 'Portico', 34.99, 'blue', 'Medium', 'Portland', 4.0, 5, 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400', 'Elegant ceramic vase perfect for fresh or artificial flowers', 'Contemporary', '2-3 days', '', 'local'),
('Queen Bedsheet Set', 'home essentials', 'bedding', 'Spaces', 49.99, 'white', 'Queen', 'Denver', 4.2, 6, 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium cotton bedsheet set with pillowcases', 'Luxury', '2-4 days', '10% OFF', 'local'),

-- Groceries & Essentials
('Organic Avocados', 'groceries', 'produce', 'Organic Harvest', 6.99, 'green', '6 pack', 'Austin', 4.5, 50, 'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fresh organic avocados, perfect for healthy meals', 'Organic', 'Same day', '', 'local'),
('Whole Wheat Bread', 'groceries', 'bakery', 'Wonder Bread', 3.99, 'brown', '24 oz', 'Phoenix', 4.1, 30, 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400', 'Nutritious whole wheat bread made with natural ingredients', 'Healthy', 'Same day', '', 'local'),
('Stainless Steel Water Bottle', 'home essentials', 'kitchenware', 'Hydro Flask', 39.99, 'blue', '32 oz', 'Boulder', 4.6, 12, 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=400', 'Insulated stainless steel bottle keeps drinks cold for 24 hours', 'Sport', '1-2 days', '', 'local');