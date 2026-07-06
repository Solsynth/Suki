---
title: 文件上传
description: 了解如何使用 DysonFS（Solar Network 的文件系统）来完成文件上传。
---

通过网关访问时，将 `/api` 替换成服务 ID `/drive`。

原有的 `/api/tus` 接口已经过时，即将被移除。请使用新的 DysonFS 上传协议上传文件。

DysonFS 支持**直接上传**（适用于小文件）和**分块上传**（适用于大文件）。

## 直接上传

**端点：** `POST /api/files/upload/direct`

多部分表单上传，包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | 文件二进制数据 |
| `hash` | string | 否 | 文件哈希（如 SHA256） |
| `file_name` | string | 否 | 文件名（默认使用上传的文件名） |
| `content_type` | string | 否 | MIME 类型 |
| `pool_id` | GUID | 否 | 目标存储池 |
| `parent_id` | GUID | 否 | 父文件夹 ID |
| `overwrite_id` | GUID | 否 | 覆盖已有文件 |
| `fast_mode` | bool | 否 | 快速覆盖（仅单引用时生效） |
| `index` | bool | 否 | 是否索引文件（默认 false） |
| `expired_at` | string | 否 | 过期时间（ISO 8601） |

### 快速模式覆盖

当 `overwrite_id` 与 `fast_mode: true` 同时设置时，服务器会原地覆盖现有对象（仅在目标对象被单个活动文件引用时）。若被共享，会自动回退到重新创建并交换的方式。

## 分块上传

### 1. 创建上传任务

**端点：** `POST /api/files/upload/create`

**请求体：**

```json
{
  "hash": "string (文件哈希，如 SHA256)",
  "file_name": "string",
  "file_size": "long (字节)",
  "content_type": "string (如 'image/jpeg')",
  "pool_id": "string (GUID，可选)",
  "parent_id": "string (GUID，可选)",
  "overwrite_id": "string (GUID，可选)",
  "fast_mode": "bool (可选)",
  "expired_at": "string (ISO 8601，可选)",
  "chunk_size": "long (字节，可选，默认 5MB)",
  "index": "bool (可选，默认 false)"
}
```

**响应：**

如果已存在相同哈希的文件：

```json
{
  "file_exists": true,
  "file": { ... (CloudFile 对象，snake_case 格式) ... }
}
```

如果文件不存在：

```json
{
  "file_exists": false,
  "task_id": "string",
  "chunk_size": "long",
  "chunks_count": "int"
}
```

### 2. 上传文件分块

**端点：** `POST /api/files/upload/chunk/{taskId}/{chunkIndex}`

以 `multipart/form-data` 格式发送每个分块，包含 `chunk` 字段，内容为二进制数据。

每个分块的大小应等于"创建上传任务"步骤中返回的 `chunk_size`，除了最后一个分块可能更小。

上传从 `0` 到 `chunks_count - 1` 的所有分块。

### 3. 完成上传

**端点：** `POST /api/files/upload/complete/{taskId}`

成功时返回新上传文件的 `CloudFile` 对象。

## 配额

服务器在处理上传前会检查配额。超出配额时返回 `403 Forbidden`。

配额计算方式：
- **基础配额**: 等级配额（Lv0 512MB → Lv120 10GB）+ 特权加成（10GB/25GB/50GB）
- **额外配额**: 来自活动配额记录

## 注意事项

- `index` 控制文件是否出现在文件树中（默认 false）
- `parent_id` 省略时服务端会自动解析
- `overwrite_id` 会替换已有文件的内容而非创建新记录
- `fast_mode` 与 `overwrite_id` 配合时尝试原地覆盖（被共享时回退到重新创建并交换）
