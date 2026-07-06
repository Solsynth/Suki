---
title: Presence Activity
---

## Overview

The Presence Activity API allows users to manage current activities (such as gaming, music, fitness) with automatic expiration via a lease-based system. Activities can be created, updated, and deleted, with support for flexible metadata and both system-generated and user-defined identifiers.

## Core Features

- **Lease-based expiration**: Activities automatically expire within 1-60 minutes unless renewed
- **Flexible identifiers**: Supports both auto-generated GUIDs and user-defined ManualIds
- **Extensible metadata**: JSON-stored metadata dictionary for custom developer data
- **Soft delete**: Activities are soft-deleted and automatically filtered out
- **Performance optimized**: Cached activities have a 1-minute expiration
- **Authentication required**: All endpoints require valid user authentication

## API Endpoints

## Get Activities

Gets all current activities for the authenticated user (non-expired presence activities).

**Endpoint:** `GET /pass/activities`

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "Gaming",
    "manualId": "game-session-1",
    "title": "Playing Cyberpunk 2077",
    "subtitle": "Night City Exploration",
    "caption": "Missions completed: 15",
    "meta": {
      "appName": "Cyberpunk 2077",
      "platform": "Steam",
      "customProperty": "additional data"
    },
    "leaseMinutes": 10,
    "leaseExpiresAt": "2024-01-15T14:30:00Z",
    "accountId": "user-guid",
    "createdAt": "2024-01-15T14:25:00Z",
    "updatedAt": "2024-01-15T14:25:00Z",
    "deletedAt": null
  }
]
```

**Common Response Codes:**

- `200 OK` - Success, returns array of activities
- `401 Unauthorized` - Invalid or missing authentication

---

## Create New Activity

Creates a new presence activity with a configurable lease duration.

**Endpoint:** `POST /pass/activities`

**Request Body:**

```json
{
  "type": "Gaming",
  "manualId": "my-game-session",
  "title": "Playing Cyberpunk 2077",
  "subtitle": "Night City Mission",
  "caption": "Currently exploring downtown",
  "meta": {
    "appName": "Cyberpunk 2077",
    "platform": "Steam",
    "difficulty": "Hard",
    "mods": ["mod1", "mod2"]
  },
  "leaseMinutes": 15
}
```

**Response:** Returns the created `SnPresenceActivity` object with populated fields.

**Field Details:**

- `type`: PresenceType enum (Unknown, Gaming, Music, Workout)
- `manualId`: Optional user-defined string identifier
- `title`, `subtitle`, `caption`: Display strings (max 4096 characters each)
- `meta`: Optional `Dictionary<string, object>` for custom data
- `leaseMinutes`: 1-60 minutes (default: 5)

**Response Codes:**

- `200 OK` - Activity created successfully
- `400 Bad Request` - Invalid lease minutes or malformed data
- `401 Unauthorized` - Invalid authentication

---

## Update Activity

Updates an existing activity using either GUID or ManualId. Only updates provided fields.

**Endpoint:** `PUT /pass/activities`

**Query Parameters:** (one required)

- `id` - System-generated GUID (string)
- `manualId` - User-defined identifier (string)

**Request Body:** (all fields optional)

```json
{
  "title": "Updated: Playing Cyberpunk 2077",
  "meta": {
    "appName": "Cyberpunk 2077",
    "platform": "Steam",
    "newProperty": "updated data"
  },
  "leaseMinutes": 20
}
```

**Response:** Returns the updated `SnPresenceActivity` object.

**Response Codes:**

- `200 OK` - Activity updated successfully
- `400 Bad Request` - Missing or invalid ID parameter
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - Activity not found or does not belong to user

**Example cURL:**

```bash
# Update via ManualId
curl -X PUT "/pass/activities?manualId=my-game-session" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"leaseMinutes": 20}'

# Update via GUID
curl -X PUT "/pass/activities?id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

---

## Delete Activity

Soft-deletes an activity using either GUID or ManualId.

**Endpoint:** `DELETE /pass/activities`

**Query Parameters:** (one required)

- `id` - System-generated GUID (string)
- `manualId` - User-defined identifier (string)

**Request Body:** None

**Response:** No content (204)

**Response Codes:**

- `204 No Content` - Activity deleted successfully
- `400 Bad Request` - Missing or invalid ID parameter
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - Activity not found or does not belong to user

**Example cURL:**

```bash
# Delete via ManualId
curl -X DELETE "/pass/activities?manualId=my-game-session" \
  -H "Authorization: Bearer <token>"
```

---

## Additional Endpoints

### Get Activities by Account ID

**Endpoint:** `GET /pass/activities/{accountId:guid}`

Used for administrative or debugging purposes. Returns activities for the specified account ID regardless of authentication status.

---

## Data Model

### PresenceType Enum

```csharp
public enum PresenceType
{
    Unknown,
    Gaming,
    Music,
    Workout
}
```

### SnPresenceActivity

```csharp
public class SnPresenceActivity : ModelBase
{
    public Guid Id { get; set; } // System-generated GUID
    public PresenceType Type { get; set; }
    public string? ManualId { get; set; } // User-defined ID
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Caption { get; set; }
    public Dictionary<string, object>? Meta { get; set; } // JSON metadata
    public int LeaseMinutes { get; set; } // Lease duration
    public Instant LeaseExpiresAt { get; set; } // Expiration timestamp

    // Inherited from ModelBase
    public Guid AccountId { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; } // Soft delete
}
```

## Behavior and Constraints

### Lease Expiration

- Activity automatically expires when `SystemClock.Instance.GetCurrentInstant() > LeaseExpiresAt`
- Expiration check happens in the database query, so expired activities are filtered in GET operations
- Clients must periodically update/renew to keep activities active

### ID Flexibility

- **ManualId**: User-defined string, unique within the user's activities
- **GUID**: System-generated, always unique, returned in API responses
- Both can be interchangeably used for updates and deletes

### Performance Optimization

- Activities are cached for 1 minute to handle frequent updates
- Create/update/delete operations invalidate the cache
- Database queries automatically filter expired activities

### Security

- All operations are scoped to the authenticated user's account
- Users can only manage their own activities
- Invalid or expired authentication tokens return 401 Unauthorized

### Data Storage

- Activities are stored in PostgreSQL with JSONB metadata support
- Soft deletes use timestamps rather than hard deletes
- EF Core middleware automatically handles CreatedAt/UpdatedAt timestamps

## Usage Examples

### Gaming Session Management

```javascript
// Start gaming session
const activity = await fetch("/pass/activities", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "Gaming",
    manualId: "game-session-1",
    title: "Playing Cyberpunk 2077",
    meta: { appId: "cyberpunk2077", mods: ["photorealistic"] },
    leaseMinutes: 15,
  }),
});

// Update progress (extend lease)
await fetch("/pass/activities?manualId=game-session-1", {
  method: "PUT",
  body: JSON.stringify({
    title: "Playing Cyberpunk 2077 - Level 25",
    leaseMinutes: 15,
  }),
});

// End session
await fetch("/pass/activities?manualId=game-session-1", {
  method: "DELETE",
});
```

### Metadata Extensions

```javascript
// Rich metadata support
const activity = {
  type: "Music",
  manualId: "spotify-session",
  title: "Listening to Electronic",
  meta: {
    spotifyTrackId: "1Je1IMUlBXcx1FzbcXRuWw",
    artist: "Purity Ring",
    album: "Shrines",
    duration: 240000, // milliseconds
    custom: { userRating: 5, genre: "Electronic" },
  },
  leaseMinutes: 30,
};
```

## Error Handling

Common error responses follow REST API conventions:

```json
{
  "type": "Microsoft.AspNetCore.Mvc.ValidationProblemDetails",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "leaseMinutes": ["Lease minutes must be between 1 and 60."]
  }
}
```
