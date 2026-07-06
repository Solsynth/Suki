---
title: File Upload
description: Learn how to use DysonFS (Solar Network's file system) for file uploads.
---

When accessing via the gateway, replace `/api` with the service ID `/drive`.

The original `/api/tus` endpoint is deprecated and will be removed soon. Please use the new DysonFS upload protocol for file uploads.

DysonFS supports both **direct upload** (for small files) and **chunked upload** (for large files).

## Direct Upload

**Endpoint:** `POST /api/files/upload/direct`

Multipart form upload with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | The file binary data |
| `hash` | string | no | File hash (e.g., SHA256) |
| `file_name` | string | no | File name (defaults to uploaded filename) |
| `content_type` | string | no | MIME type |
| `pool_id` | GUID | no | Target storage pool |
| `parent_id` | GUID | no | Parent folder ID |
| `overwrite_id` | GUID | no | Overwrite an existing file |
| `fast_mode` | bool | no | Fast overwrite (single-reference only) |
| `index` | bool | no | Whether to index the file (default: false) |
| `expired_at` | string | no | Expiration time (ISO 8601) |

### Fast Mode Overwrite

When `overwrite_id` is set with `fast_mode: true`, the server overwrites the existing backing object in place (only when the target object is referenced by exactly one live file). If shared, it automatically falls back to recreate-and-swap.

## Chunked Upload

### 1. Create Upload Task

**Endpoint:** `POST /api/files/upload/create`

**Request Body:**

```json
{
  "hash": "string (file hash, e.g., SHA256)",
  "file_name": "string",
  "file_size": "long (bytes)",
  "content_type": "string (e.g., 'image/jpeg')",
  "pool_id": "string (GUID, optional)",
  "parent_id": "string (GUID, optional)",
  "overwrite_id": "string (GUID, optional)",
  "fast_mode": "bool (optional)",
  "expired_at": "string (ISO 8601, optional)",
  "chunk_size": "long (bytes, optional, default 5MB)",
  "index": "bool (optional, default false)"
}
```

**Response:**

If a file with the same hash already exists:

```json
{
  "file_exists": true,
  "file": { ... (CloudFile object, in snake_case format) ... }
}
```

If the file does not exist:

```json
{
  "file_exists": false,
  "task_id": "string",
  "chunk_size": "long",
  "chunks_count": "int"
}
```

### 2. Upload File Chunks

**Endpoint:** `POST /api/files/upload/chunk/{taskId}/{chunkIndex}`

Send each chunk as `multipart/form-data` with a `chunk` field containing binary data.

Each chunk's size should equal the `chunk_size` returned in the "Create Upload Task" step, except for the last chunk which may be smaller.

Upload all chunks from `0` to `chunks_count - 1`.

### 3. Complete Upload

**Endpoint:** `POST /api/files/upload/complete/{taskId}`

Returns the `CloudFile` object on success.

## Quota

Upload quota is checked before task creation or direct upload processing. If exceeded, the server returns `403 Forbidden`.

Quota is calculated as:
- **Base quota**: Level-based (512MB at Lv0 → 10GB at Lv120) + Perk bonus (10GB/25GB/50GB)
- **Extra quota**: From active quota records

## Notes

- `index` controls whether the file appears in the file tree (default: false)
- `parent_id` can be resolved server-side when omitted
- `overwrite_id` replaces content of an existing file instead of creating a new record
- `fast_mode` with `overwrite_id` tries to overwrite in place (falls back to recreate-and-swap if shared)
