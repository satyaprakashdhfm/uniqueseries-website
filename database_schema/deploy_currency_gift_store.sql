-- Currency Gift Store Database Schema - Complete Production Ready
-- PostgreSQL Database Setup Script
-- Updated with Coupons table and current structure

-- Database connection settings
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

-- Create ENUM types
CREATE TYPE public.enum_orders_payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

CREATE TYPE public.enum_orders_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE public.enum_products_type AS ENUM (
    'currency_note',
    'photo_frame',
    'resin_frame',
    'zodiac_coin',
    'zodiac'
);

-- Legacy ENUM types (keeping for compatibility)
CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

CREATE TYPE public.product_type AS ENUM (
    'currency_note',
    'photo_frame',
    'resin_frame',
    'zodiac_coin'
);

-- Users table - for authentication and user management
CREATE TABLE public.users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table - with name as primary key
CREATE TABLE public.products (
    name VARCHAR(255) PRIMARY KEY,
    type public.enum_products_type NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    w_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table - NEW TABLE for discount management
CREATE TABLE public.coupons (
    code VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    expiry_date TIMESTAMP WITHOUT TIME ZONE,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table - comprehensive order management
CREATE TABLE public.orders (
    order_number VARCHAR(20) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    order_amount NUMERIC(10, 2) NOT NULL,
    custom_photo_url VARCHAR(500),
    order_status public.enum_orders_status DEFAULT 'pending'::public.enum_orders_status,
    datewith_instructions TEXT,
    payment_id VARCHAR(255),
    payment_status public.enum_orders_payment_status DEFAULT 'pending'::public.enum_orders_payment_status,
    payment_method VARCHAR(50) DEFAULT 'UPI'::VARCHAR,
    upi_transaction_id VARCHAR(255),
    upi_reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT orders_product_name_fkey FOREIGN KEY (product_name) 
        REFERENCES public.products(name) ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_available ON public.products(is_available);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_product_name ON public.orders(product_name);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_expiry ON public.coupons(expiry_date);
CREATE INDEX idx_coupons_type ON public.coupons(type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON public.coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- INSERT INITIAL PRODUCT DATA

-- Currency Notes (9 denominations)
INSERT INTO public.products (name, type, is_available, price, w_days) VALUES
('1_rupees_note', 'currency_note', true, 499.00, 3),
('2_rupees_note', 'currency_note', true, 2499.00, 14),
('5_rupees_note', 'currency_note', true, 599.00, 3),
('10_rupees_note', 'currency_note', true, 399.00, 3),
('20_rupees_note', 'currency_note', true, 699.00, 3),
('50_rupees_note', 'currency_note', true, 1299.00, 6),
('100_rupees_note', 'currency_note', true, 1499.00, 6),
('200_rupees_note', 'currency_note', true, 1599.00, 7),
('500_rupees_note', 'currency_note', true, 2499.00, 7);

-- Photo Frames
INSERT INTO public.products (name, type, is_available, price, w_days) VALUES
('small1_1note_1name', 'photo_frame', true, 1999.00, 10),
('small2_2notes_2names', 'photo_frame', true, 2999.00, 10),
('custom', 'photo_frame', true, 999.00, 12),
('big1_1-200set_2notes_2names', 'photo_frame', true, 8999.00, 15),
('big2_1-500set_2notes_2names', 'photo_frame', true, 9999.00, 15);

-- Resin Frames
INSERT INTO public.products (name, type, is_available, price, w_days) VALUES
('small_resin_frame', 'resin_frame', true, 2999.00, 8),
('large_resin_frame', 'resin_frame', true, 4999.00, 8);

-- Zodiac Products
INSERT INTO public.products (name, type, is_available, price, w_days) VALUES
('zodiac_coin', 'zodiac', true, 399.00, 5),
('zodiac_stamp', 'zodiac', true, 199.00, 5);

-- INSERT SAMPLE COUPON DATA
INSERT INTO public.coupons (code, type, discount_value, expiry_date, usage_limit, is_active) VALUES
('WELCOME10', 'percentage', 10.00, '2025-12-31 23:59:59', 100, true),
('FLAT50', 'fixed', 50.00, '2025-09-30 23:59:59', 50, true),
('FESTIVE20', 'percentage', 20.00, '2025-10-31 23:59:59', 200, true),
('NEWUSER15', 'percentage', 15.00, '2025-11-30 23:59:59', 75, true);

-- Grant permissions (uncomment and adjust for your production user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_production_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_production_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_production_user;

-- Database setup complete
-- Tables created: users, products, coupons, orders
-- Relationships: orders -> products (FK), orders -> users (loose via email)
-- Features: Auto-timestamps, order number generation, coupon system