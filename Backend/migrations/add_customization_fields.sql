-- Migration script to add customization fields to order_items table
-- Run this script to update existing database with new customization columns

-- Add the three customization columns to order_items table
ALTER TABLE order_items 
ADD COLUMN special_data TEXT COMMENT 'For currency notes: special dates like anniversary, birthday, etc.',
ADD COLUMN custom_names TEXT COMMENT 'For frames/resin frames: names to be included',
ADD COLUMN custom_description TEXT COMMENT 'For frames/resin frames: description, zodiac details, etc.';

-- Update any existing records to have NULL values for these new fields (they will be NULL by default)
-- No additional UPDATE needed since we're adding nullable columns

-- Verify the changes
DESCRIBE order_items;

-- Show sample of updated table structure
SELECT 
    id, 
    product_id, 
    quantity, 
    unit_price, 
    special_data, 
    custom_names, 
    custom_description,
    created_at 
FROM order_items 
LIMIT 5;
