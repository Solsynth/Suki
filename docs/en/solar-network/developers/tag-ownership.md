---
title: Tag Ownership API
---

## Data Model

### SnPostTag

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| slug | string(128) | Unique normalized identifier (lowercase, trimmed) |
| name | string(256)? | Display name |
| description | string(4096)? | Tag description/metadata |
| owner_publisher_id | UUID? | Owning publisher |
| is_protected | bool | Only owner can use on new posts |
| is_event | bool | Time-limited event tag |
| event_ends_at | Instant? | Expiry timestamp |

### Protected Tag Quota

```
quota = 3 + 3 × perkLevel
```

| Perk Level | Quota |
|------------|-------|
| 0 | 3 |
| 1 | 6 |
| 2 | 9 |
| 3 | 12 |

## Publisher Endpoints

All endpoints prefixed with `/api/posts/tags`. The `pub` query param selects the publisher (defaults to current user's default publisher).

### Create Tag

```
POST /api/posts/tags?pub={publisherName}
```

```json
{
  "slug": "photography",
  "name": "Photography",
  "description": "Posts about photography"
}
```

The authenticated publisher becomes the owner.

### Get Tag

```
GET /api/posts/tags/{slug}
```

### Update Tag

```
PATCH /api/posts/tags/{slug}?pub={publisherName}
```

Only the owning publisher's manager/owner can edit.

### Claim Tag

```
POST /api/posts/tags/{slug}/claim?pub={publisherName}
```

Manually claim ownership of an unowned tag.

### Check Quota

```
GET /api/posts/tags/quota?pub={publisherName}
```

Returns total/used/remaining quota and list of protected tags.

## Admin Endpoints

All require `IsSuperuser` or `posts.tags.admin` permission.

### Assign Ownership

```
POST /api/admin/posts/tags/{slug}/assign
```

```json
{ "publisher_id": "..." }
```

### Toggle Protection

```
PATCH /api/admin/posts/tags/{slug}/protect
```

```json
{ "is_protected": true }
```

Returns `400` if quota exceeded.

### Set Event Tag

```
PATCH /api/admin/posts/tags/{slug}/event
```

```json
{
  "is_event": true,
  "ends_at": "2026-06-01T00:00:00Z"
}
```

### Admin Update

```
PATCH /api/admin/posts/tags/{slug}
```

Admin can update any tag regardless of ownership.

## Validation During Post creation

1. Normalize slugs (trim, lowercase)
2. Look up existing tags by slug
3. Create missing tags (unowned)
4. For each tag:
   - Event tag expired → `400`
   - Protected and owner differs from post publisher → `400`
5. Attach tags to post
