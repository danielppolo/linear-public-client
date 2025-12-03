# API Documentation

This document describes all available API endpoints for the Linear Public Client application.

## Base URL

All API endpoints are prefixed with `/api/v1`.

## Authentication

Most endpoints require Bearer token authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <API_BEARER_TOKEN>
```

The token is configured via the `API_BEARER_TOKEN` environment variable.

---

## Customer Requests API

### Create Customer Request

Creates a new customer request and automatically creates a corresponding Linear issue.

**Endpoint:** `POST /api/v1/customer-requests`

**Authentication:** Required

**Request Body:**

```json
{
  "content": "The user's request description",
  "type": "bug" | "feature",
  "external_user_id": "unique-user-identifier",
  "user_name": "John Doe",  // Optional
  "project_id": "linear-project-id",
  "source": "web" | "mobile" | "api",  // Optional
  "metadata": {  // Optional
    "env": "production",
    "app_version": "1.0.0",
    // ... any additional metadata
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "content": "The user's request description",
  "type": "bug",
  "status": "pending",
  "external_user_id": "unique-user-identifier",
  "user_name": "John Doe",
  "project_id": "linear-project-id",
  "linear_issue_id": "linear-issue-id",
  "response": "AI-generated response text",  // If AI is enabled
  "source": "web",
  "metadata": {
    "model_issue_suggestion": {  // If AI is enabled
      "title": "Suggested issue title",
      "description": "Suggested issue description",
      "labels": ["label1", "label2"],
      "priority": 3
    }
  },
  "deleted_at": null
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
  ```json
  {
    "message": "Validation failed",
    "details": [
      {
        "path": ["content"],
        "message": "Content is required"
      }
    ]
  }
  ```

- `401 Unauthorized` - Missing or invalid bearer token
  ```json
  {
    "message": "Unauthorized"
  }
  ```

- `502 Bad Gateway` - Linear API error (request is rolled back)
  ```json
  {
    "message": "Failed to create Linear issue: <error message>",
    "details": { /* error details */ }
  }
  ```

**Notes:**

- The request automatically creates a Linear issue in the specified project
- If AI is enabled (`ENABLE_AI=true`), the system will:
  - Generate structured issue suggestions (title, description, labels, priority)
  - Generate a user-facing confirmation response
- If Linear issue creation fails, the customer request is automatically deleted (rollback)
- The initial status is always `"pending"`

---

### List Customer Requests

Retrieves a paginated list of customer requests with optional filtering.

**Endpoint:** `GET /api/v1/customer-requests`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `triaged`, `in_progress`, `resolved`, `closed`, `cancelled`, `in_review`, `error` |
| `external_user_id` | string | No | Filter by external user ID |
| `limit` | number | No | Number of results per page (1-100, default: 20) |
| `cursor` | string | No | Pagination cursor (use `next_cursor` from previous response) |

**Example Request:**

```
GET /api/v1/customer-requests?status=pending&limit=10&external_user_id=user123
```

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "content": "The user's request description",
      "type": "bug",
      "status": "pending",
      "external_user_id": "user123",
      "user_name": "John Doe",
      "project_id": "linear-project-id",
      "linear_issue_id": "linear-issue-id",
      "response": null,
      "source": "web",
      "metadata": null,
      "deleted_at": null
    }
  ],
  "next_cursor": "uuid-of-last-item" | null
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid bearer token
- `500 Internal Server Error` - Server error

**Notes:**

- Results are ordered by `id` in ascending order
- Soft-deleted requests (where `deleted_at IS NOT NULL`) are excluded
- Use `next_cursor` for pagination: pass it as the `cursor` parameter in the next request
- If `next_cursor` is `null`, there are no more results

---

### Get Customer Request

Retrieves a specific customer request by ID.

**Endpoint:** `GET /api/v1/customer-requests/{id}`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Customer request UUID |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "content": "The user's request description",
  "type": "bug",
  "status": "pending",
  "external_user_id": "unique-user-identifier",
  "user_name": "John Doe",
  "project_id": "linear-project-id",
  "linear_issue_id": "linear-issue-id",
  "response": "AI-generated response text",
  "source": "web",
  "metadata": {
    "linear_state": {
      "id": "state-id",
      "name": "In Progress",
      "updated_at": "2024-01-02T00:00:00.000Z"
    },
    "latest_comment": {
      "id": "comment-id",
      "body": "Comment text",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "user": {
        "id": "user-id",
        "name": "Team Member"
      }
    }
  },
  "deleted_at": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid bearer token
- `404 Not Found` - Customer request not found or deleted
  ```json
  {
    "message": "Customer request with id {id} not found"
  }
  ```
- `500 Internal Server Error` - Server error

---

### Update Customer Request

Updates an existing customer request. Only provided fields are updated.

**Endpoint:** `PATCH /api/v1/customer-requests/{id}`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Customer request UUID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "status": "resolved",  // Optional
  "content": "Updated content",  // Optional
  "type": "feature",  // Optional
  "response": "Updated response text",  // Optional
  "metadata": {  // Optional
    "cancel_reason": "Duplicate request"
  }
}
```

**Response:** `200 OK`

Returns the updated customer request object (same format as GET response).

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid bearer token
- `404 Not Found` - Customer request not found or deleted
- `500 Internal Server Error` - Server error

**Notes:**

- The `updated_at` timestamp is automatically updated
- Metadata is merged/replaced (not deep merged)
- Status values must be one of: `pending`, `triaged`, `in_progress`, `resolved`, `closed`, `cancelled`, `in_review`, `error`

---

### Delete Customer Request

Soft-deletes a customer request by setting `deleted_at` timestamp.

**Endpoint:** `DELETE /api/v1/customer-requests/{id}`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Customer request UUID |

**Response:** `204 No Content`

No response body.

**Error Responses:**

- `401 Unauthorized` - Missing or invalid bearer token
- `404 Not Found` - Customer request not found or already deleted
- `500 Internal Server Error` - Server error

**Notes:**

- This is a soft delete - the record remains in the database with `deleted_at` set
- Soft-deleted requests are excluded from list and get operations
- The Linear issue is not deleted

---

## Webhooks API

### Linear Webhook

Receives webhook events from Linear when issues or comments are created/updated.

**Endpoint:** `POST /api/v1/webhooks/linear`

**Authentication:** Required (see below)

**Authentication Methods:**

The webhook supports two authentication methods (at least one must be configured):

1. **Bearer Token** - Set `WEBHOOK_BEARER_TOKEN` environment variable
   ```
   Authorization: Bearer <WEBHOOK_BEARER_TOKEN>
   ```

2. **HMAC-SHA256 Signature** - Set `LINEAR_WEBHOOK_SECRET` environment variable
   ```
   Linear-Signature: sha256=<hex_digest>
   ```
   The signature is computed as `HMAC-SHA256(secret, request_body)`.

**Request Body:**

Linear webhook event payload (varies by event type):

```json
{
  "type": "Issue" | "Comment",
  "action": "create" | "update",
  "data": {
    "id": "linear-issue-id",
    "identifier": "PROJ-123",
    "title": "Issue title",
    "state": {
      "id": "state-id",
      "name": "In Progress"
    },
    "team": {
      "id": "team-id"
    },
    "comments": {
      "nodes": [
        {
          "id": "comment-id",
          "body": "Comment text",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "user": {
            "id": "user-id",
            "name": "User Name"
          }
        }
      ]
    }
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid webhook authentication
  ```json
  {
    "message": "Invalid webhook authentication"
  }
  ```

**Notes:**

- The webhook handles two event types:
  - **Issue events** (`type: "Issue"`, `action: "create" | "update"`):
    - On create: Adds a default label to the Linear issue
    - On update: Updates the customer request status based on Linear issue state
    - If status changes to `resolved` and AI is enabled, generates a resolution response
  - **Comment events** (`type: "Comment"`, `action: "create"`):
    - Updates the customer request metadata with the latest comment
- The webhook always returns `200 OK` to prevent Linear from retrying (errors are logged)
- Only customer requests linked to the Linear issue (via `linear_issue_id`) are updated
- If the Linear issue is not found in the database, the webhook silently succeeds (issue may have been created outside the system)

---

## Data Types

### CustomerRequestType

```typescript
type CustomerRequestType = "bug" | "feature"
```

### CustomerRequestStatus

```typescript
type CustomerRequestStatus =
  | "pending"
  | "triaged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled"
  | "in_review"
  | "error"
```

### CustomerRequestMetadata

```typescript
type CustomerRequestMetadata = {
  env?: string
  app_version?: string
  cancel_reason?: string
  latest_comment?: {
    id: string
    body: string
    createdAt: string
    user?: {
      id: string
      name: string
    }
  }
  model_issue_suggestion?: {
    title: string
    description: string
    labels: string[]
    priority: number
  }
  linear_state?: {
    id: string
    name: string
    updated_at: string
  }
  [key: string]: unknown
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "message": "Error message",
  "details": { /* Optional error details */ }
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Validation error or invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - External service (Linear) error

---

## Rate Limiting

Currently, there are no rate limits enforced. Consider implementing rate limiting for production use.

---

## Examples

### Create a Bug Report

```bash
curl -X POST https://api.example.com/api/v1/customer-requests \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The app crashes when I click the submit button",
    "type": "bug",
    "external_user_id": "user-123",
    "user_name": "Jane Doe",
    "project_id": "proj_abc123",
    "source": "mobile",
    "metadata": {
      "app_version": "2.1.0",
      "env": "production"
    }
  }'
```

### List Pending Requests

```bash
curl -X GET "https://api.example.com/api/v1/customer-requests?status=pending&limit=20" \
  -H "Authorization: Bearer your-token"
```

### Update Request Status

```bash
curl -X PATCH https://api.example.com/api/v1/customer-requests/{id} \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "response": "This has been fixed in version 2.2.0"
  }'
```

