-- Complete user login diagnostic query
-- Replace 'admin@test-corp.test' with the email you're trying to login with

SELECT 
    -- User info
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.is_active as user_active,
    u.deleted_at IS NOT NULL as is_deleted,
    
    -- Password hash info
    LENGTH(u.password) as password_length,
    LEFT(u.password, 30) as password_preview,
    (u.password LIKE '$2a$%' OR u.password LIKE '$2b$%') as is_bcrypt_format,
    (LENGTH(u.password) >= 60) as has_min_length,
    
    -- Tenant info
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    t.status as tenant_status,
    t.tier as tenant_tier,
    
    -- License info
    l.id as license_id,
    l.tier as license_tier,
    l.is_active as license_active,
    l.expires_at as license_expires,
    
    -- Summary flags
    CASE 
        WHEN u.deleted_at IS NOT NULL THEN 'USER_DELETED'
        WHEN NOT u.is_active THEN 'USER_DISABLED'
        WHEN t.status != 'ACTIVE' THEN 'TENANT_INACTIVE'
        WHEN NOT (u.password LIKE '$2a$%' OR u.password LIKE '$2b$%') THEN 'INVALID_PASSWORD_HASH'
        WHEN LENGTH(u.password) < 60 THEN 'PASSWORD_TOO_SHORT'
        WHEN l.id IS NULL OR NOT l.is_active THEN 'NO_ACTIVE_LICENSE'
        ELSE 'OK'
    END as login_status

FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN licenses l ON l.tenant_id = t.id AND l.is_active = true
WHERE LOWER(u.email) = LOWER('admin@test-corp.test')
  AND u.deleted_at IS NULL
ORDER BY l.created_at DESC NULLS LAST
LIMIT 1;

