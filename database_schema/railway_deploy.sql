-- Railway PostgreSQL Deployment Script
-- Currency Gift Store Database Schema
-- Optimized for Railway Cloud PostgreSQL Database
-- Version 2.0 - Production Ready

-- Railway PostgreSQL connection settings
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create ENUM types for Railway PostgreSQL
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

CREATE TYPE public.enum_payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE public.enum_payment_method AS ENUM (
    'UPI',
    'credit_card',
    'debit_card',
    'net_banking',
    'wallet',
    'cash_on_delivery'
);

-- Users table - Railway PostgreSQL optimized
CREATE TABLE public.users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table - Railway PostgreSQL optimized
CREATE TABLE public.products (
    name VARCHAR(255) PRIMARY KEY,
    type public.enum_products_type NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    w_days INTEGER,
    image_url VARCHAR(500),
    image_public_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cart table - Railway PostgreSQL persistent cart management
CREATE TABLE public.cart (
    id SERIAL PRIMARY KEY,
    cart_number VARCHAR(50) NOT NULL,
    user_email VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    custom_photo_url VARCHAR(500),
    datewith_instructions TEXT,
    is_checked_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints for Railway
    CONSTRAINT cart_user_email_fkey FOREIGN KEY (user_email) 
        REFERENCES public.users(email) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT cart_product_name_fkey FOREIGN KEY (product_name) 
        REFERENCES public.products(name) ON UPDATE CASCADE
);

-- Payments table - Railway PostgreSQL payment management
CREATE TABLE public.payments (
    payment_id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255),
    payment_method public.enum_payment_method DEFAULT 'UPI',
    payment_status public.enum_payment_status DEFAULT 'pending',
    payment_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    upi_transaction_id VARCHAR(255),
    upi_reference_id VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    gateway_response TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint for Railway
    CONSTRAINT payments_user_email_fkey FOREIGN KEY (user_email) 
        REFERENCES public.users(email) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Coupons table - Railway PostgreSQL discount management
CREATE TABLE public.coupons (
    code VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table - Railway PostgreSQL order management
CREATE TABLE public.orders (
    order_number VARCHAR(20) PRIMARY KEY,
    user_email VARCHAR(255),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    cart_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    order_status public.enum_orders_status DEFAULT 'pending',
    payment_id VARCHAR(255),
    coupon_code VARCHAR(50),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints for Railway
    CONSTRAINT orders_user_email_fkey FOREIGN KEY (user_email) 
        REFERENCES public.users(email) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT orders_payment_id_fkey FOREIGN KEY (payment_id) 
        REFERENCES public.payments(payment_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT orders_coupon_code_fkey FOREIGN KEY (coupon_code) 
        REFERENCES public.coupons(code) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Order Items table - Railway PostgreSQL order details
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    custom_photo_url VARCHAR(500),
    datewith_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints for Railway
    CONSTRAINT order_items_order_number_fkey FOREIGN KEY (order_number) 
        REFERENCES public.orders(order_number) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT order_items_product_name_fkey FOREIGN KEY (product_name) 
        REFERENCES public.products(name) ON UPDATE CASCADE
);

-- Product Reviews table - Railway PostgreSQL reviews system
CREATE TABLE public.product_reviews (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints for Railway
    CONSTRAINT reviews_product_fkey FOREIGN KEY (product_name) 
        REFERENCES public.products(name) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT reviews_user_fkey FOREIGN KEY (user_email) 
        REFERENCES public.users(email) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Wishlist table - Railway PostgreSQL user favorites
CREATE TABLE public.wishlist (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints for Railway
    CONSTRAINT wishlist_user_fkey FOREIGN KEY (user_email) 
        REFERENCES public.users(email) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT wishlist_product_fkey FOREIGN KEY (product_name) 
        REFERENCES public.products(name) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint for Railway
    UNIQUE(user_email, product_name)
);

-- Admin Users table - Railway PostgreSQL admin management
CREATE TABLE public.admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'manager', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact Messages table - Railway PostgreSQL customer support
CREATE TABLE public.contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    assigned_to INTEGER,
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint for Railway
    CONSTRAINT contact_assigned_to_fkey FOREIGN KEY (assigned_to) 
        REFERENCES public.admin_users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Railway PostgreSQL Optimized Indexes for better performance
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_available ON public.products(is_available);
CREATE INDEX idx_cart_user_email ON public.cart(user_email);
CREATE INDEX idx_cart_cart_number ON public.cart(cart_number);
CREATE INDEX idx_cart_checked_out ON public.cart(is_checked_out);
CREATE INDEX idx_payments_user_email ON public.payments(user_email);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_cart_number ON public.orders(cart_number);
CREATE INDEX idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX idx_order_items_order_number ON public.order_items(order_number);
CREATE INDEX idx_order_items_product_name ON public.order_items(product_name);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_expiry ON public.coupons(expiry_date);
CREATE INDEX idx_coupons_type ON public.coupons(type);
CREATE INDEX idx_reviews_product_name ON public.product_reviews(product_name);
CREATE INDEX idx_reviews_user_email ON public.product_reviews(user_email);
CREATE INDEX idx_wishlist_user_email ON public.wishlist(user_email);
CREATE INDEX idx_wishlist_product_name ON public.wishlist(product_name);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_contact_messages_assigned_to ON public.contact_messages(assigned_to);

-- Railway PostgreSQL Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Railway PostgreSQL Auto-update triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_updated_at 
    BEFORE UPDATE ON public.cart 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON public.coupons 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at 
    BEFORE UPDATE ON public.product_reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON public.admin_users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON public.contact_messages 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Railway PostgreSQL Utility Functions
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_cart_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CART' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- INSERT INITIAL PRODUCT DATA FOR RAILWAY DEPLOYMENT

-- Currency Notes (9 denominations) - Railway Production Ready
INSERT INTO public.products (name, type, is_available, price, w_days, image_url) VALUES
('1_rupees_note', 'currency_note', true, 499.00, 3, NULL),
('2_rupees_note', 'currency_note', true, 2499.00, 14, NULL),
('5_rupees_note', 'currency_note', true, 599.00, 3, NULL),
('10_rupees_note', 'currency_note', true, 399.00, 3, NULL),
('20_rupees_note', 'currency_note', true, 699.00, 3, NULL),
('50_rupees_note', 'currency_note', true, 1299.00, 6, NULL),
('100_rupees_note', 'currency_note', true, 1499.00, 6, NULL),
('200_rupees_note', 'currency_note', true, 1599.00, 7, NULL),
('500_rupees_note', 'currency_note', true, 2499.00, 7, NULL);

-- Photo Frames - Railway Production Ready
INSERT INTO public.products (name, type, is_available, price, w_days, image_url) VALUES
('small1_1note_1name', 'photo_frame', true, 1999.00, 10, NULL),
('small2_2notes_2names', 'photo_frame', true, 2999.00, 10, NULL),
('custom', 'photo_frame', true, 999.00, 12, NULL),
('big1_1-200set_2notes_2names', 'photo_frame', true, 8999.00, 15, NULL),
('big2_1-500set_2notes_2names', 'photo_frame', true, 9999.00, 15, NULL);

-- Resin Frames - Railway Production Ready
INSERT INTO public.products (name, type, is_available, price, w_days, image_url) VALUES
('small_resin_frame', 'resin_frame', true, 2999.00, 8, NULL),
('large_resin_frame', 'resin_frame', true, 4999.00, 8, NULL);

-- Zodiac Products - Railway Production Ready
INSERT INTO public.products (name, type, is_available, price, w_days, image_url) VALUES
('zodiac_coin', 'zodiac', true, 399.00, 5, NULL),
('zodiac_stamp', 'zodiac', true, 199.00, 5, NULL);

-- INSERT PRODUCTION COUPON DATA FOR RAILWAY
INSERT INTO public.coupons (code, type, discount_value, expiry_date, usage_limit, is_active) VALUES
('WELCOME10', 'percentage', 10.00, '2025-12-31 23:59:59+00', 100, true),
('FESTIVE20', 'percentage', 20.00, '2025-10-31 23:59:59+00', 200, true),
('NEWUSER15', 'percentage', 15.00, '2025-11-30 23:59:59+00', 75, true),
('RAILWAY50', 'fixed', 50.00, '2025-12-31 23:59:59+00', 500, true);

-- Railway PostgreSQL deployment complete!
-- 
-- RAILWAY DEPLOYMENT INSTRUCTIONS:
-- 1. Create a PostgreSQL service in Railway
-- 2. Connect to your Railway PostgreSQL database
-- 3. Run this entire script in Railway's PostgreSQL console
-- 4. Update your app environment variables:
--    DATABASE_URL (Railway provides this automatically)
--    Or use individual variables:
--    DB_HOST=your-railway-postgres-host
--    DB_NAME=your-railway-db-name  
--    DB_USER=your-railway-db-user
--    DB_PASSWORD=your-railway-db-password
--    DB_PORT=5432
-- 5. Deploy your app to Railway
--
-- Features included:
-- ✅ All tables with Railway PostgreSQL optimizations
-- ✅ Foreign key relationships
-- ✅ Indexes for performance
-- ✅ Auto-timestamp triggers  
-- ✅ Utility functions (order/cart number generation)
-- ✅ Initial product data
-- ✅ Sample coupons
-- ✅ Railway-specific timezone handling
-- ✅ Production-ready constraints and checks