CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role_id INTEGER NOT NULL
        REFERENCES roles(id),

    tenant_id UUID
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    permission_id INTEGER NOT NULL
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_permissions (
    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    permission_id INTEGER NOT NULL
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    PRIMARY KEY (user_id, permission_id)
);

CREATE TYPE project_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT'
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    address VARCHAR(500) NOT NULL,

    use_case TEXT NOT NULL,

    status project_status NOT NULL DEFAULT 'DRAFT',

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id
    ON users(tenant_id);

CREATE INDEX idx_users_role_id
    ON users(role_id);

CREATE INDEX idx_projects_tenant_id
    ON projects(tenant_id);

CREATE INDEX idx_user_permissions_user_id
    ON user_permissions(user_id);

CREATE INDEX idx_role_permissions_role_id
    ON role_permissions(role_id);