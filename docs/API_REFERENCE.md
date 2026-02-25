# TaxiHub API Reference

**REST API Endpoints for TaxiHub Backend**

This document contains all the REST API endpoints available in the TaxiHub backend for managing communities and members.

---

## Table of Contents

1. [Communities](#communities)
2. [Community Members](#community-members)
3. [Authentication](#authentication)

---

## Communities

### Get All Communities

```
GET /api/communities
```

**Authentication**: None

**Purpose**: Retrieve a list of all registered communities

**Response**:
```json
[
  {
    "id": "string",
    "hiveTag": "string",
    "name": "string",
    "latitude": "number",
    "longitude": "number"
  }
]
```

---

### Get Specific Community

```
GET /api/communities/:identifier
```

**Authentication**: None

**Purpose**: Get detailed information about a specific community

**Parameters**:
- `identifier` (string, required) - Community ID or hiveTag

**Response**:
```json
{
  "id": "string",
  "hiveTag": "string",
  "name": "string",
  "latitude": "number",
  "longitude": "number"
}
```

---

### Get Community Members

```
GET /api/communities/:identifier/members
```

**Authentication**: None

**Purpose**: Retrieve all members of a specific community

**Parameters**:
- `identifier` (string, required) - Community ID or hiveTag

**Query Parameters**:
- `role` (string, optional) - Filter members by role (e.g., "Driver", "Admin")

**Example**: `/api/communities/global-taxi/members?role=Driver`

**Response**:
```json
[
  {
    "username": "string",
    "role": "string",
    "joinedAt": "timestamp"
  }
]
```

---

### Register/Update Community

```
POST /api/communities/register
```

**Authentication**: API Key required (scope: `communities:write`)

**Purpose**: Create a new community or update an existing one

**Headers**:
```
Authorization: Bearer <api_key>
```

**Request Body**:
```json
{
  "hiveTag": "string (required)",
  "name": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Community registered successfully",
  "community": {
    "id": "string",
    "hiveTag": "string",
    "name": "string",
    "latitude": "number",
    "longitude": "number"
  }
}
```

---

## Community Members

### Add Member to Community

```
POST /api/communities/members
```

**Authentication**: API Key required (scope: `communities:write`)

**Purpose**: Add a user to a community with a specific role

**Headers**:
```
Authorization: Bearer <api_key>
```

**Request Body**:
```json
{
  "username": "string (required)",
  "hiveTag": "string (required)",
  "role": "string (optional, defaults to 'Driver')"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Member added successfully",
  "member": {
    "username": "string",
    "hiveTag": "string",
    "role": "string"
  }
}
```

---

## Authentication

### API Key Authentication

Protected endpoints require an API key with appropriate scopes.

**Header Format**:
```
Authorization: Bearer <api_key>
```

**Available Scopes**:
- `communities:write` - Required for creating/updating communities and managing members

**Example Request**:
```bash
curl -X POST https://your-domain.com/api/communities/register \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "hiveTag": "hive-123456",
    "name": "Global Taxi Hub",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**:
```json
{
  "error": "Invalid request parameters"
}
```

**401 Unauthorized**:
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found**:
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

---

## Related Documentation

- [HIVE_OPERATIONS.md](../HIVE_OPERATIONS.md) - Hive blockchain operations reference
- [README.md](../README.md) - Project overview and setup instructions
