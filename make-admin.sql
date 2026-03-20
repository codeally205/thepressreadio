-- Make user an admin
UPDATE "user" 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'filalliance769@gmail.com';

-- Verify the update
SELECT id, email, name, role, auth_provider 
FROM "user" 
WHERE email = 'filalliance769@gmail.com';
