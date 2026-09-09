# Multi-Tenant Project Management

A full-stack multi-tenant project management application built for the Full Stack Developer technical assignment.

## Overview

The application implements:

* JWT-based authentication
* Role-based access control
* Permission-based authorization
* Multi-tenant data isolation
* Project CRUD
* User management
* Admin permission management
* API rate limiting
* Permission-aware React UI

The implementation intentionally favors a small, straightforward architecture over production-scale abstractions.

## Stack

* **Frontend:** React, TypeScript, React Router, Tailwind CSS
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL
* **Database access:** Raw SQL
* **Authentication:** JWT + HTTP-only cookie

## Authorization Model

The system has three roles:

| Role          | Tenant Scope  | Primary Capabilities                                  |
| ------------- | ------------- | ----------------------------------------------------- |
| `SUPER_ADMIN` | System-wide   | Manage users, tenants, projects and Admin permissions |
| `ADMIN`       | Single tenant | Manage Agents and tenant projects                     |
| `AGENT`       | Single tenant | Access projects according to assigned permissions     |

Permissions are independent of roles:

```text
users.read
users.create
users.update
users.disable

projects.read
projects.create
projects.update
projects.delete

permissions.manage
```

Roles provide default permissions, while users can additionally have user-specific permissions.

### Effective permissions

Protected requests resolve the authenticated user's current permissions from the database rather than relying on stale permissions stored in the authentication token.

This means permission changes take effect without requiring the user to log in again.

## Multi-Tenant Isolation

Tenant isolation is enforced at the backend/resource-access layer.

For tenant-scoped users:

* Project queries are restricted to the authenticated user's tenant.
* User queries are restricted to the authenticated user's tenant.
* Individual resource lookups also include tenant scope.
* A resource ID from another tenant therefore cannot be used to bypass authorization.

Tenant IDs are not trusted from the frontend for tenant-scoped operations.

For example:

```text
Admin A → Tenant A → Project A
Admin A → Tenant B → denied
```

Super Admins are system-level users and have no tenant assignment, allowing them to operate across tenants.

## Project Authorization

Project CRUD is permission-driven.

For example, an Agent may have:

```text
projects.read
projects.update
```

but not:

```text
projects.delete
```

In that case:

* The project can be viewed.
* The project can be updated.
* The Delete action is hidden in the frontend.
* A direct `DELETE /projects/:id` request is rejected with `403 Forbidden`.

Frontend permission checks are therefore treated as UI behaviour only. Backend middleware remains the authorization boundary.

## User Management

Tenant Admins can manage Agents within their own tenant.

They cannot:

* Create Admins
* Modify Admins
* Create or modify Super Admins
* Change an Agent's tenant

Super Admins can manage Admins and Agents across tenants and can assign users to tenants.

`SUPER_ADMIN` cannot be created through the user-management API.

## Permission Management

Super Admins can manage the permissions available to the Admin role.

Individual user permissions can also be replaced independently of the role's default permissions.

Permission replacement is transactional so the existing permission set is not partially updated.

## Authentication

Authentication is implemented using:

* Password hashing
* JWT
* HTTP-only cookies
* Database-backed user lookup on protected requests
* Disabled-account checks

The JWT identifies the authenticated user, while current authorization state is resolved from the database.

## API

### Authentication

```text
POST /auth/login
POST /auth/logout
GET  /me
```

### Projects

```text
POST   /projects
GET    /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id
```

### Users

```text
GET   /users
POST  /users
PUT   /users/:id
PATCH /users/:id/disable
```

### Permissions

```text
GET /permissions
PUT /users/:id/permissions
PUT /permissions/admin
```

### Tenants

```text
GET  /tenants
POST /tenants
```

## Error Behaviour

The API uses standard HTTP status codes:

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| `400`  | Invalid request/input                          |
| `401`  | Authentication required/invalid                |
| `403`  | Authenticated but not authorized               |
| `404`  | Resource not found or outside accessible scope |
| `429`  | Rate limit exceeded                            |

Project validation includes required fields, allowed status values, and malformed ID handling.

## Rate Limiting

Two rate limits are implemented:

* `POST /auth/login`: 5 requests per IP per 15 minutes
* General API: approximately 100 requests per IP per minute

Both return `429 Too Many Requests` when exceeded.

## Database Model

The core relationships are:

```text
Tenant
  ├── Users
  │     └── Role
  │           └── Default Permissions
  │
  └── Projects

User
  └── User-specific Permissions
```

Projects belong to a tenant.

Tenant-scoped users belong to exactly one tenant.

Super Admins have no tenant assignment.

## Key Assumptions

### Super Admin tenant scope

A Super Admin is represented with a `SUPER_ADMIN` role and `tenantId = NULL`.

This combination is treated as the system-level identity throughout the application.

### Project creation

For Admins and Agents, the project tenant is derived from the authenticated user.

Super Admins may provide a tenant when creating a project because they operate across tenants.

### Project reassignment

Super Admins may change a project's tenant during an update.

Tenant-scoped users cannot move projects outside their tenant.

### Admin management

Admins can manage Agents only. Although Admins have user-management permissions, role hierarchy rules are enforced separately from permissions so that a permission such as `users.create` does not allow an Admin to create another Admin.

### User-specific permissions

The assignment describes permissions primarily at the role level. User-specific permissions were additionally implemented to support the example where an Agent receives selected project permissions.

### Frontend

The frontend intentionally focuses on functional workflows and permission-aware UI rather than advanced UX features.

The UI hides unavailable actions based on permissions, but all authorization decisions are independently enforced by the backend.

## Project Structure

```text
backend/
  controllers/
  middleware/
  repositories/
  routes/
  services/
  types/

frontend/
  api/
  auth/
  components/
  layouts/
  pages/
  types/
```

The backend separates HTTP handling, business rules, database access, and authorization middleware.

The frontend separates API access, authentication state, reusable UI components, and pages.

## Implementation Notes

A few areas were intentionally kept simple because they were outside the scope of the assignment:

* No pagination or advanced project filtering
* No password reset/email verification flow
* No refresh-token rotation
* No audit logging
* No complex state-management library
* No production-scale caching layer

The focus was on correctness of authentication, authorization, tenant isolation, API behaviour, and the core project-management workflows.
