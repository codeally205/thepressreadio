-- Fix the foreign key constraint to point to the correct table
-- Drop the incorrect constraint
ALTER TABLE article_views DROP CONSTRAINT article_views_user_id_users_id_fk;

-- Add the correct constraint pointing to "user" table
ALTER TABLE article_views 
ADD CONSTRAINT article_views_user_id_user_id_fk 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;