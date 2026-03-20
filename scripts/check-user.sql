-- Check if the user exists in the database
SELECT id, email, name, role, "createdAt" FROM "user" WHERE id = 'bd96f5c6-b9f0-4c64-8f86-3ad4b7367ed8';

-- Also check all users to see what's in the database
SELECT id, email, name, role FROM "user" LIMIT 10;