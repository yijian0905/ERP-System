-- ERP System - User Login Diagnostic SQL
-- Run this in PostgreSQL to diagnose login issues

-- 1. List all users with their tenant info
SELECT 
    u.email,
    u.name,
    u.role,
    u.is_active as user_active,
    LEFT(u.password, 30) as password_preview,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.status as tenant_status,
    t.tier as tenant_tier
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;

-- 2. Check for email case sensitivity issues
-- This shows if emails are stored in different cases
SELECT 
    email,
    LOWER(email) as lowercase_email,
    email = LOWER(email) as is_lowercase
FROM users
WHERE deleted_at IS NULL;

-- 3. Check tenant licenses
SELECT 
    t.name as tenant_name,
    t.slug,
    t.status,
    l.tier as license_tier,
    l.is_active as license_active,
    l.expires_at
FROM tenants t
LEFT JOIN licenses l ON t.id = l.tenant_id
ORDER BY t.created_at DESC;

-- 4. Check if specific user exists (replace email)
-- SELECT * FROM users WHERE LOWER(email) = LOWER('admin@test-company.test');

