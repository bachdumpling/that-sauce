# That Sauce API Documentation

## Overview

The "That Sauce" API is a RESTful service that powers the content management and creator platform. It's built with Express.js and TypeScript, using Supabase as the database backend.

## Base URL

```
/api
```

## Authentication

The API uses token-based authentication. Include the authentication token in the Authorization header:

```
Authorization: Bearer {token}
```

Many endpoints use the `extractUser` middleware to identify the current user but don't require authentication for public data access.

## Rate Limiting & Caching

The API implements caching for frequently accessed resources to improve performance. Cache expiration times vary by endpoint.

## Content Types

All requests should use:

- Content-Type: `application/json` for request bodies
- Accept: `application/json` for response bodies

## Response Format

All API responses follow a standard format:

```json
{
  "success": true|false,
  "data": { ... },  // Only present on successful responses
  "error": "Error message", // Only present on error responses
  "details": { ... } // Additional error details in development mode
}
```

Pagination responses include:

```json
{
  "success": true,
  "data": {
    "results": [ ... ],
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

## Error Codes

- `400` - Bad Request: Missing or invalid parameters
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource doesn't exist
- `500` - Internal Server Error: Something went wrong on the server

## API Endpoints

### Test Endpoints

#### GET /

Tests if the API is running.

**Response**

```json
{
  "message": "API is running"
}
```

#### GET /test-db

Tests database connection.

**Response**

```json
{
  "message": "Database connection successful",
  "data": [...]
}
```

### Search API

The Search API allows users to find creators, projects, and media content. [View detailed documentation](./search-api.md).

### Creator API

The Creator API allows management of creator profiles and accounts. [View detailed documentation](./creator-api.md).

### Project API

The Project API enables management of creator projects and associated content. [View detailed documentation](./project-api.md).

### Media API

The Media API handles image and video content management. [View detailed documentation](./media-api.md).

### Portfolio API

The Portfolio API manages creator portfolios and project associations. [View detailed documentation](./portfolio-api.md).

### Admin API

The Admin API provides special endpoints for system administrators. [View detailed documentation](./admin-api.md).

### Error Response Format

All error responses follow a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional details for debugging (dev mode only)
  }
}
```

Common error codes include:

- `BAD_REQUEST`: Invalid request parameters
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., username already taken)
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `USERNAME_TAKEN`: Requested username is already in use
- `SERVER_ERROR`: Internal server error

## Onboarding API

The onboarding API provides endpoints for managing user onboarding flow.

### Get Onboarding Status

```
GET /api/onboarding/status
```

**Authentication Required**: Yes

**Response**:

```json
{
  "success": true,
  "data": {
    "profile": {
      /* profile data */
    },
    "creator": {
      /* creator data if exists */
    },
    "onboarding_completed": false,
    "current_step": 1,
    "user_role": null
  }
}
```

### Set User Role

```
PUT /api/onboarding/role
```

**Authentication Required**: Yes

**Request Body**:

```json
{
  "role": "creator" // or "employer"
}
```

**Response**:

```json
{
  "success": true,
  "message": "User role set successfully",
  "data": {
    /* updated profile data */
  }
}
```

### Set Organization (for employers)

```
PUT /api/onboarding/organization
```

**Authentication Required**: Yes

**Request Body**:

```json
{
  "organization_id": "uuid", // Optional - provide to select existing org
  "organization_name": "My Company", // Required if organization_id is not provided
  "website": "example.com", // Optional
  "logo_url": "https://example.com/logo.png" // Optional
}
```

**Response**:

```json
{
  "success": true,
  "message": "Organization set successfully",
  "data": {
    "profile": {
      /* updated profile data */
    },
    "organization_id": "uuid"
  }
}
```

### Upload Profile Image

```
POST /api/onboarding/profile-image
```

**Authentication Required**: Yes

**Request Body**: Form data with a file field named "file"

**Response**:

```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "avatar_url": "https://example.com/avatar.jpg",
    "creator": {
      /* creator data if exists */
    }
  }
}
```

### Set Profile Information

```
PUT /api/onboarding/profile
```

**Authentication Required**: Yes

**Request Body**:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Short bio or tagline",
  "primary_role": ["Designer", "Developer"],
  "location": "City, Country",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      /* updated profile data */
    },
    "creator": {
      /* creator data */
    }
  }
}
```

### Set Social Links

```
PUT /api/onboarding/social-links
```

**Authentication Required**: Yes

**Request Body**:

```json
{
  "social_links": {
    "website": "example.com",
    "instagram": "username",
    "linkedin": "in/username",
    "dribbble": "username",
    "vimeo": "username"
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "Social links updated and onboarding completed",
  "data": {
    "creator": {
      /* updated creator data */
    },
    "profile": {
      /* updated profile data */
    }
  }
}
```

**Note**: At least 2 social links are required to complete the onboarding process.
