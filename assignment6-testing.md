# Assignment 6 — Prisma ORM Testing Documentation

## Prisma Setup Verification

Prisma Client was generated successfully with:

```bash
npx prisma generate
```

The Prisma schema was validated with:

```bash
npx prisma validate
```

Result:

```text
The schema at prisma/schema.prisma is valid
```

The development migration was created and applied with:

```bash
npx prisma migrate dev --name firstMigration
```

The development and test databases were successfully migrated.

## Automated Tests

Command:

```bash
npm run tdd assignment6
```

Result:

```text
Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
```

## API Testing

The application was started with:

```bash
node app.js
```

### 1. Health Check

```bash
curl -i http://localhost:3000/health
```

Result:

```json
{
  "status": "ok",
  "db": "connected"
}
```

### 2. Register a User

```bash
curl -i -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nasistu","email":"nasistu.test@example.com","password":"Password123!"}'
```

Result:

```text
HTTP/1.1 201 Created
```

```json
{
  "name": "Nasistu",
  "email": "nasistu.test@example.com"
}
```

The password was hashed before being stored and was not included in the response.

### 3. Test Duplicate Email Error

The registration request was sent again with the same email.

Result:

```text
HTTP/1.1 400 Bad Request
```

```json
{
  "error": "Email is already registered"
}
```

This verifies Prisma error code `P2002` handling.

### 4. Log Off

```bash
curl -i -X POST http://localhost:3000/api/users/logoff
```

Result:

```text
HTTP/1.1 200 OK
```

### 5. Log On with a Mixed-Case Email

```bash
curl -i -X POST http://localhost:3000/api/users/logon \
  -H "Content-Type: application/json" \
  -d '{"email":"Nasistu.Test@Example.com","password":"Password123!"}'
```

Result:

```text
HTTP/1.1 200 OK
```

```json
{
  "name": "Nasistu",
  "email": "nasistu.test@example.com"
}
```

This verifies that the email is converted to lowercase before the Prisma query.

### 6. Create a Task

```bash
curl -i -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Complete Assignment 6","isCompleted":false}'
```

Result:

```text
HTTP/1.1 201 Created
```

```json
{
  "id": 2,
  "title": "Complete Assignment 6",
  "isCompleted": false
}
```

### 7. List Tasks

```bash
curl -i http://localhost:3000/api/tasks
```

Result:

```text
HTTP/1.1 200 OK
```

```json
[
  {
    "id": 2,
    "title": "Complete Assignment 6",
    "isCompleted": false
  }
]
```

### 8. Show One Task

```bash
curl -i http://localhost:3000/api/tasks/2
```

Result:

```text
HTTP/1.1 200 OK
```

```json
{
  "id": 2,
  "title": "Complete Assignment 6",
  "isCompleted": false
}
```

### 9. Update a Task

```bash
curl -i -X PATCH http://localhost:3000/api/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{"title":"Assignment 6 Completed","isCompleted":true}'
```

Result:

```text
HTTP/1.1 200 OK
```

```json
{
  "id": 2,
  "title": "Assignment 6 Completed",
  "isCompleted": true
}
```

### 10. Test Task-Not-Found Error

```bash
curl -i -X PATCH http://localhost:3000/api/tasks/99999 \
  -H "Content-Type: application/json" \
  -d '{"isCompleted":true}'
```

Result:

```text
HTTP/1.1 404 Not Found
```

```json
{
  "error": "Task not found"
}
```

This verifies Prisma error code `P2025` handling.

### 11. Test User-Task Access Control

A second user was registered:

```bash
curl -i -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Second User","email":"second.user@example.com","password":"Password123!"}'
```

The second user then requested the first user's task:

```bash
curl -i http://localhost:3000/api/tasks/2
```

Result:

```text
HTTP/1.1 404 Not Found
```

```json
{
  "error": "Task not found"
}
```

This confirms that one user cannot read another user's task. Task update and delete operations also filter by both `id` and `userId`.

### 12. Delete a Task

After logging back in as the task owner:

```bash
curl -i -X DELETE http://localhost:3000/api/tasks/2
```

Result:

```text
HTTP/1.1 200 OK
```

The deleted task was returned.

### 13. Delete the Same Task Again

```bash
curl -i -X DELETE http://localhost:3000/api/tasks/2
```

Result:

```text
HTTP/1.1 404 Not Found
```

```json
{
  "error": "Task not found"
}
```

## Final Verification

The following operations were tested successfully:

- Prisma Client generation
- Prisma schema validation
- Development and test database migrations
- Database health check
- User registration with password hashing
- Duplicate email handling
- Logon and logoff
- Task creation
- Task listing
- Showing one task
- Task updating
- Task deletion
- Prisma `P2002` and `P2025` error handling
- User and task relationship
- User-task access control
- Graceful Prisma disconnection
- All 35 automated Assignment 6 tests