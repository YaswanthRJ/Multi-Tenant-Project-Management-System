INSERT INTO roles (name, description)
VALUES
    ('SUPER_ADMIN', 'System-wide administrator'),
    ('ADMIN', 'Tenant administrator'),
    ('AGENT', 'Tenant user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description)
VALUES
    ('users.read', 'View users'),
    ('users.create', 'Create users'),
    ('users.update', 'Update users'),
    ('users.disable', 'Enable or disable users'),
    ('projects.read', 'View projects'),
    ('projects.create', 'Create projects'),
    ('projects.update', 'Update projects'),
    ('projects.delete', 'Delete projects'),
    ('permissions.manage', 'Manage role permissions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'users.read',
    'users.create',
    'users.update',
    'users.disable',
    'projects.read',
    'projects.create',
    'projects.update',
    'projects.delete'
)
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'projects.read'
WHERE r.name = 'AGENT'
ON CONFLICT DO NOTHING;

-- Create initial Super Admin
INSERT INTO users (
    name,
    email,
    password_hash,
    role_id,
    tenant_id,
    is_disabled
)
SELECT
    'System Administrator',
    'admin@example.com',
    crypt('change-this-password', gen_salt('bf', 12)),
    id,
    NULL,
    FALSE
FROM roles
WHERE name = 'SUPER_ADMIN'
ON CONFLICT (email) DO NOTHING;