-- Backfill postal_code for existing orders
-- Set default postal code (00000) for orders without postal_code
UPDATE orders
SET postal_code = '00000'
WHERE postal_code IS NULL OR postal_code = '';
