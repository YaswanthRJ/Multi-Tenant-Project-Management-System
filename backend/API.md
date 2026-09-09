# Backend API Contract

Base URL during development: `http://localhost:4000`

The API uses JSON request/response bodies. Browser requests that use authentication must include cookies:

```ts
fetch(url, {
  credentials: "include"
});
```

The access token is stored in the HTTP-only `access_token` cookie. Frontend code must not read or store the token.

## Authentication

### `POST /auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Success: `200`

```json
{
  "message": "Login successful"
}
```

Errors:

- `400`: missing email or password
- `401`: invalid credentials
- `403`: account disabled
- `429`: login rate limit exceeded

After login, call `GET /me` to populate frontend user state.

### `POST /auth/logout`

Clears the authentication cookie.

Success: `200`

```json
{
  "message": "Logout successful"
}
```

### `GET /me`

Requires authentication.

Success: `200`

```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "tenantId": "tenant-uuid",
  "permissions": [
    "users.read",
    "projects.read",
    "projects.create"
  ]
}
```

`tenantId` is `null` for Super Admin users.

Unauthenticated response: `401`.

## Permissions

Permission names are returned by `GET /permissions`; do not hard-code the available list in the frontend.

### `GET /permissions`

Requires `permissions.manage`.

Success: `200`

```json
[
  {
    "id": 1,
    "name": "users.read",
    "description": "View users"
  }
]
```

### `PUT /permissions/admin`

Requires `permissions.manage`.

Replaces the permissions assigned to the `ADMIN` role. This does not change user-specific permissions.

Request:

```json
{
  "permissions": [
    "users.read",
    "users.create",
    "projects.read"
  ]
}
```

Use an empty array to remove all Admin role permissions.

Success: `200`

```json
{
  "message": "Admin permissions updated"
}
```

Invalid or unknown permission names: `400`.

### `PUT /users/:id/permissions`

Requires `permissions.manage`.

Replaces the target user's user-specific permissions. Role permissions are unchanged.

Request:

```json
{
  "permissions": [
    "projects.read",
    "projects.update"
  ]
}
```

Use an empty array to remove all user-specific permissions.

Success: `200`

```json
{
  "message": "Permissions updated"
}
```

Responses:

- `400`: invalid request or unknown permission name
- `401`: unauthenticated
- `403`: missing `permissions.manage`
- `404`: target user does not exist or is outside the caller's tenant

## Projects

All project routes require authentication and the listed permission.

Project response shape:

```json
{
  "id": "project-uuid",
  "name": "WaziApp",
  "address": "Infopark, Thrissur, Kerala",
  "useCase": "WhatsApp customer communication",
  "status": "ACTIVE",
  "tenantId": "tenant-uuid",
  "createdAt": "2026-09-09T12:00:00.000Z",
  "updatedAt": "2026-09-09T12:00:00.000Z"
}
```

### `GET /projects`

Permission: `projects.read`

- Tenant users receive only their tenant's projects.
- Super Admin receives projects across all tenants.
- Do not send `tenantId` as a query parameter.

### `GET /projects/:id`

Permission: `projects.read`.

Tenant users cannot retrieve another tenant's project. A missing or out-of-scope project returns `404`.

### `POST /projects`

Permission: `projects.create`.

Request:

```json
{
  "name": "WaziApp",
  "address": "Infopark, Thrissur, Kerala",
  "useCase": "WhatsApp customer communication",
  "status": "ACTIVE",
  "tenantId": "tenant-uuid"
}
```

`tenantId` is used only for Super Admin creation. Tenant users are always assigned their authenticated tenant, regardless of a submitted value.

Required fields: `name`, `address`, `useCase`, and `status`.

Valid statuses: `ACTIVE`, `INACTIVE`, `DRAFT`.

Success: `201` with the created project.

Invalid input: `400`.

### `PUT /projects/:id`

Permission: `projects.update`.

Request fields are the same as project creation. Super Admin may include `tenantId` to reassign ownership. Tenant users cannot move a project between tenants.

Success: `200` with the updated project.

### `DELETE /projects/:id`

Permission: `projects.delete`.

Success: `204` with no response body.

### Project errors

- `400`: invalid project input or malformed UUID
- `401`: unauthenticated
- `403`: missing permission
- `404`: project does not exist or is outside the caller's tenant

## Users

All user routes require authentication and the listed permission. Password hashes are never returned.

User response shape:

```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "roleId": 3,
  "roleName": "AGENT",
  "tenantId": "tenant-uuid",
  "isDisabled": false,
  "createdAt": "2026-09-09T12:00:00.000Z",
  "updatedAt": "2026-09-09T12:00:00.000Z"
}
```

### `GET /users`

Permission: `users.read`.

- Super Admin receives users across all tenants.
- Tenant users receive only users from their tenant.

### `POST /users`

Permission: `users.create`.

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "role": "AGENT",
  "tenantId": "tenant-uuid"
}
```

- `name`, `email`, `password`, and `role` are required.
- Valid roles are `ADMIN` and `AGENT`.
- Super Admin must provide `tenantId`.
- Tenant users use their authenticated tenant; frontend `tenantId` is not trusted.
- Tenant Admins may create only `AGENT` users.
- Super Admin may create `ADMIN` or `AGENT` users.
- `SUPER_ADMIN` cannot be created through this endpoint.

Success: `201` with the created user.

### `PUT /users/:id`

Permission: `users.update`.

All fields are optional, but at least one field must be provided:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "new-password",
  "role": "AGENT",
  "tenantId": "tenant-uuid"
}
```

- Tenant Admins can update only Agent targets and cannot send `tenantId`.
- Super Admin can update Admin or Agent targets and may change `tenantId`.
- `SUPER_ADMIN` cannot be created or assigned through this endpoint.

### `PATCH /users/:id/disable`

Permission: `users.disable`.

Request:

```json
{
  "disabled": true
}
```

Tenant Admins can enable/disable only Agent targets in their tenant. Super Admin can manage Admin and Agent targets across tenants.

Success: `200` with the updated user.

### User errors

- `400`: invalid request body or missing required field
- `401`: unauthenticated
- `403`: missing permission or disallowed role/target operation
- `404`: user does not exist or is outside the caller's tenant

## Tenants

Only Super Admin may access these endpoints. Super Admin is represented by `roleName = SUPER_ADMIN` and `tenantId = null` in the authenticated user.

### `GET /tenants`

Success: `200`

```json
[
  {
    "id": "tenant-uuid",
    "name": "Acme Inc",
    "createdAt": "2026-09-09T12:00:00.000Z",
    "updatedAt": "2026-09-09T12:00:00.000Z"
  }
]
```

The current database schema has no `updated_at` column for tenants, so `updatedAt` mirrors `createdAt`.

### `POST /tenants`

Request:

```json
{
  "name": "Acme Inc"
}
```

Success: `201` with the created tenant.

Empty or missing name: `400`.

## Common behavior

- `401` means there is no valid authenticated session.
- `403` means the user is authenticated but lacks the required permission or business access.
- `404` is used for missing resources and tenant-out-of-scope resources.
- `429` indicates rate limiting.
- Authentication and permission state are refreshed from the database on each protected request.
- After changing permissions, the frontend does not need a new JWT. Call `GET /me` again to receive the current effective permissions.

Rate limits:

- `POST /auth/login`: 5 requests per 15 minutes per IP.
- General API: 100 requests per minute per IP.
