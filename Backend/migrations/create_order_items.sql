-- Migration: create order_items table if missing
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) REFERENCES orders(order_number) ON DELETE CASCADE,
  product_name VARCHAR(255) REFERENCES products(name),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  custom_photo_url VARCHAR(500),
  datewith_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_number ON order_items(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_product_name ON order_items(product_name);
