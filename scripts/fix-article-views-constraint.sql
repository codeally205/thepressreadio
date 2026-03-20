-- Fix article_views table to handle missing users gracefully
-- This script adds a check constraint to ensure either userId or fingerprint is provided

-- Add the check constraint
ALTER TABLE article_views 
ADD CONSTRAINT user_or_fingerprint_check 
CHECK (user_id IS NOT NULL OR fingerprint IS NOT NULL);

-- Optional: Clean up any orphaned article_views records (uncomment if needed)
-- DELETE FROM article_views 
-- WHERE user_id IS NOT NULL 
-- AND user_id NOT IN (SELECT id FROM "user");