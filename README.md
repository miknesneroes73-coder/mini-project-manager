# Mini Project Manager

Technical test: GraphQL API with NestJS, TypeORM and PostgreSQL.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 15 or 16

The implementation uses NestJS 12, GraphQL code-first, TypeORM 0.3 and PostgreSQL. The exercise explicitly allows `synchronize: true`; migrations are not required.

## Local PostgreSQL

Create a database named `mini_project_manager` and a user/password that match `.env`.

Example using `psql`:

```sql
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE mini_project_manager OWNER postgres;
```

If PostgreSQL already has the `postgres` role, only create the database as appropriate for the local installation.

## Installation

```bash
cp .env.example .env
npm install
npm test
npm run build
npm start
```

The API listens on `PORT` (default `3000`). Apollo Sandbox is available at the GraphQL endpoint `/graphql`.

## Tenant header

Every operation except the first negative test must include:

```text
x-tenant-id: 11111111-1111-4111-8111-111111111111
```

Use the second tenant for isolation tests:

```text
x-tenant-id: 22222222-2222-4222-8222-222222222222
```

A missing or invalid tenant header returns `TENANT_REQUIRED` and does not access the database.

## GraphQL examples

Create:

```graphql
mutation {
  createProject(input: { title: "Web corporativa", priority: HIGH })
}
```

List:

```graphql
query {
  projects(limit: 10) {
    count
    data {
      id
      title
      status
      priority
      createdAt
      updatedAt
    }
  }
}
```

## Architecture

`domain` contains repository contracts and enums and has no NestJS dependency. `application` contains one service per use case (`run` is the public method) and business rules. `infrastructure` contains TypeORM entities, PostgreSQL repositories and thin GraphQL resolvers.

Project archiving is performed by a TypeORM transaction unit of work so the project and all active phases are archived atomically. If the phase update fails, the project update is rolled back as well.

The tests for the required service cases use mocked repositories and do not require PostgreSQL.

## Verification checklist

1. No tenant header + `createProject` -> `TENANT_REQUIRED`.
2. Tenant A creates `Web corporativa` with `HIGH` -> `PLANNED`.
3. Tenant A creates `App interna` with `IN_PROGRESS`.
4. Tenant A creates phases in P1 with orders 1 and 0.
5. Random project id for a phase -> `PROJECT_NOT_AVAILABLE`.
6. `phases(projectId: P1)` -> two phases ordered by `order`, then `createdAt`.
7. `projects(limit: 1)` -> newest project in `data`, `count: 2`.
8. Search `web` and priority `HIGH` each return one project.
9. Delete P1; it disappears from `project` and its phases list is empty.
10. Tenant B cannot see Tenant A's records.
11. Tenant A updates P2 and `updatedAt` advances.
12. A phase can be archived independently while P2 remains visible.
13. Blank project titles are rejected and the project count does not increase.

## Login (Version 2)

The API now also supports user registration and login. Passwords are stored as secure scrypt hashes and login returns a signed JWT access token.

Register a user:

```graphql
mutation {
  register(input: {
    email: "demo@example.com"
    password: "password123"
    tenantId: "11111111-1111-4111-8111-111111111111"
  }) {
    accessToken
    user { id email tenantId }
  }
}
```

Login:

```graphql
mutation {
  login(input: {
    email: "demo@example.com"
    password: "password123"
  }) {
    accessToken
    user { id email tenantId }
  }
}
```

Authenticated project requests can use:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The existing `x-tenant-id` header is still supported so the original API behavior remains compatible.

For local development, set `AUTH_JWT_SECRET` in `.env` to a long random value.
