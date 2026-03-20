-- Fix user tables mismatch
-- This script consolidates the two user tables and updates foreign key references

-- First, let's check what we have
SELECT 'Users in "user" table:' as info;
SELECT id, email, name FROM "user";

SELECT 'Users in "users" table:' as info;  
SELECT id, email, name FROM users;

-- Copy user from users table to "user" table if they don't exist
INSERT INTO "user" (id, name, email, "emailVerified", image, avatar_url, auth_provider, password_hash, role, created_at, updated_at)
SELECT id, name, email, "emailVerified", image, avatar_url, auth_provider, password_hash, role, created_at, updated_at
FROM users 
WHERE email NOT IN (SELECT email FROM "user");

-- Update subscriptions to reference the correct user ID from "user" table
UPDATE subscriptions 
SET user_id = (
    SELECT u.id 
    FROM "user" u 
    JOIN users old_u ON u.email = old_u.email 
    WHERE old_u.id = subscriptions.user_id
)
WHERE user_id IN (SELECT id FROM users);

-- Update payment_events to reference the correct user ID from "user" table  
UPDATE payment_events 
SET user_id = (
    SELECT u.id 
    FROM "user" u 
    JOIN users old_u ON u.email = old_u.email 
    WHERE old_u.id = payment_events.user_id
)
WHERE user_id IN (SELECT id FROM users);

-- Update newsletter_sends to reference the correct user ID from "user" table
UPDATE newsletter_sends 
SET user_id = (
    SELECT u.id 
    FROM "user" u 
    JOIN users old_u ON u.email = old_u.email 
    WHERE old_u.id = newsletter_sends.user_id
)
WHERE user_id IN (SELECT id FROM users);

-- Verify the updates
SELECT 'Updated subscriptions:' as info;
SELECT s.id, s.user_id, u.email 
FROM subscriptions s 
JOIN "user" u ON s.user_id = u.id;

SELECT 'Updated payment_events:' as info;
SELECT COUNT(*) as count FROM payment_events WHERE user_id IS NOT NULL;

SELECT 'Updated newsletter_sends:' as info;
SELECT COUNT(*) as count FROM newsletter_sends WHERE user_id IS NOT NULL;