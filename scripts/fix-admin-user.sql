-- Insert the admin user with the specific ID from the session
INSERT INTO "user" (
    id, 
    name, 
    email, 
    role, 
    email_verified, 
    auth_provider, 
    created_at, 
    updated_at
) VALUES (
    'a87d7723-cb7a-4d8b-8bfc-f2ff46399042',
    'Admin User',
    'admin@thepressradio.com',
    'admin',
    NOW(),
    'email',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify the user was created
SELECT id, name, email, role FROM "user" WHERE id = 'a87d7723-cb7a-4d8b-8bfc-f2ff46399042';