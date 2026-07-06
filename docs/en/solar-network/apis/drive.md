---
title: Drive API
description: Files, uploads, attachments, and cloud drive (DysonFS)
hide:
  - toc
---

DysonFS (Dyson Network File System) is the file service behind Solar Network's Drive, handling file hosting, upload processing, media analysis, and all file-related operations.

When accessing via the gateway, replace `/api` with the service ID `/drive`.

## Upload API

### Create Upload Task

**Endpoint:** `POST /api/files/upload/create`

**Request Body:**

```json
{
  "hash": "string (file hash, e.g., SHA256)",
  "file_name": "string",
  "file_size": "long (bytes)",
  "content_type": "string (e.g., 'image/jpeg')",
  "pool_id": "string (GUID, optional)",
  "expired_at": "string (ISO 8601, optional)",
  "chunk_size": "long (bytes, optional, default 5MB)",
  "parent_id": "string (GUID, optional)",
  "overwrite_id": "string (GUID, optional)",
  "fast_mode": "bool (optional)",
  "index": "bool (optional, default false)"
}
```

If a file with the same hash already exists, returns the existing `CloudFile`. Otherwise returns `task_id`, `chunk_size`, and `chunks_count`.

### Upload Chunk

**Endpoint:** `POST /api/files/upload/chunk/{taskId}/{chunkIndex}`

Send each chunk as `multipart/form-data` with a `chunk` field containing binary data.

### Complete Upload

**Endpoint:** `POST /api/files/upload/complete/{taskId}`

Returns the `CloudFile` object on success.

### Direct Upload

**Endpoint:** `POST /api/files/upload/direct`

Multipart form upload with metadata fields plus `file`. Supports `overwrite_id` and `fast_mode` for overwriting existing files.

### Fast Mode

When `overwrite_id` is set with `fast_mode: true`, the server overwrites the existing backing object in place (only when the target object is referenced by exactly one live file). If shared, it automatically falls back to recreate-and-swap.

## File List Filters

These endpoints share the same list query parser:

- `GET /api/files/me`
- `GET /api/files/root/children`
- `GET /api/files/:id/children`
- `GET /api/files/unindexed`

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `offset` | Pagination offset |
| `take` | Page size |
| `order` | `date`, `name`, or `size` |
| `orderDesc` | `true`/`false` |
| `query` | Case-insensitive substring match on file name |
| `name` | Exact file name match |
| `extension` | File extension (with or without `.`) |
| `content_type` / `mime_type` | Exact MIME type match |
| `pool_id` | Filter by pool |
| `parent_id` | Filter by parent folder |
| `indexed` | `true`/`false` |
| `recycled` | `true`/`false` |
| `is_folder` | `true`/`false` |
| `has_thumbnail` | `true`/`false` |
| `min_size` / `max_size` | Size range in bytes |
| `created_after` / `created_before` | Date range (RFC3339 or YYYY-MM-DD) |
| `updated_after` / `updated_before` | Date range |

## Folders

### Create Folder

**Endpoint:** `POST /folders`

```json
{
  "name": "Projects",
  "parent_id": "..."
}
```

Folders are stored as `cloud_files` rows with `is_folder = true` and `indexed = true`.

## Permissions

Files expose read/write/manage permissions:

- **No permission rows** → file is public
- **`private` permission row** → file is private by default
- **Permission checks inherit from ancestor folders**

**Read:** `GET /api/files/:id/permissions`

**Update:** `PUT /api/files/:id/permissions`

```json
{
  "items": [
    {
      "subject_type": "account",
      "subject_id": "...",
      "permission": "read"
    },
    {
      "subject_type": "scope",
      "subject_id": "files.manage",
      "permission": "manage"
    }
  ]
}
```

`subject_type` can be `public`, `private`, `account`, or `scope`.

## File Operations

### Rename

**Endpoint:** `PATCH /api/files/:id`

```json
{"name": "renamed-file.txt"}
```

### Batch Operations

| Operation | Endpoint |
|-----------|----------|
| Recycle | `POST /api/files/recycle/batch` |
| Restore | `POST /api/files/restore/batch` |
| Delete | `POST /api/files/delete/batch` |
| Move | `POST /api/files/move/batch` |

Move request body:

```json
{
  "file_ids": ["file-id-1", "file-id-2"],
  "parent_id": "...",
  "indexed": true
}
```

- Omit `parent_id` or set to `null` to move files back to root
- `indexed` is optional; set to `true`/`false` to change indexing status

## Indexed vs Unindexed

- **Indexed files** appear in `GET /api/files/root/children` and `GET /api/files/:id/children`
- **Unindexed files** only appear in `GET /api/files/unindexed`
- Folders are always indexed
- Set `index` at upload time or change later via the move batch endpoint

## Quota and Billing

Quota values are reported in MB.

**Base quota** = leveling quota + perk quota

| Level | Quota |
|-------|-------|
| Lv0 | 512MB |
| Lv10 | 1GB |
| Lv60 | 5GB |
| Lv120 | 10GB |

| Perk | Extra Quota |
|------|-------------|
| Perk 1 | +10GB |
| Perk 2 | +25GB |
| Perk 3 | +50GB |

Extra quota from active `quota_records` is added after base quota.

**Check quota:** `GET /api/billing/quota`

```json
{
  "based_quota": 15360,
  "extra_quota": 25,
  "total_quota": 15385
}
```

**Check usage:** `GET /api/billing/usage`

```json
{
  "used_quota": 300,
  "total_quota": 15385,
  "total_file_count": 2,
  "total_usage_bytes": 209715200
}
```

Pool billing `cost_multiplier` affects billable usage and quota checks.

## WOPI / Collabora Online

DysonFS supports WOPI host endpoints for Collabora Online document editing.

**Create edit session:** `POST /api/files/:id/edit`

```json
{
  "action_url": "https://collabora.example.com/browser/edit?WOPISrc=...",
  "action": "edit",
  "method": "POST",
  "form_fields": {
    "access_token": "TOKEN",
    "access_token_ttl": "1770000000000"
  },
  "wopi_src": "https://files.example.com/wopi/files/FILE_ID",
  "expires_at": "2026-05-29T12:00:00Z"
}
```

The client should POST `form_fields` to `action_url`, typically into an iframe.

---

Reading the API documentation alone may make some information difficult to understand. Please read it in conjunction with the Drive-related content in the "Developer Services" section.
