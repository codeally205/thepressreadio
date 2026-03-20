-- Clean up orphaned article_views records
DELETE FROM article_views 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM "user");