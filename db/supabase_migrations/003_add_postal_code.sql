-- Add postal_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
