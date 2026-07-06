---
title: Drive API
description: 文件、上传、附件与网盘（DysonFS）
hide:
  - toc
---

DysonFS（Dyson Network File System）是 Solar Network _drive_ 背后的文件服务，负责文件托管、上传处理、媒体分析以及所有文件相关操作。

通过网关访问时，将 `/api` 替换为服务 ID `/drive`。

## 上传 API

### 创建上传任务

**端点：** `POST /api/files/upload/create`

**请求体：**

```json
{
  "hash": "string (文件哈希，如 SHA256)",
  "file_name": "string",
  "file_size": "long (字节)",
  "content_type": "string (如 'image/jpeg')",
  "pool_id": "string (GUID，可选)",
  "expired_at": "string (ISO 8601，可选)",
  "chunk_size": "long (字节，可选，默认 5MB)",
  "parent_id": "string (GUID，可选)",
  "overwrite_id": "string (GUID，可选)",
  "fast_mode": "bool (可选)",
  "index": "bool (可选，默认 false)"
}
```

如果已存在相同哈希的文件，返回已有的 `CloudFile`。否则返回 `task_id`、`chunk_size` 和 `chunks_count`。

### 上传分块

**端点：** `POST /api/files/upload/chunk/{taskId}/{chunkIndex}`

以 `multipart/form-data` 格式发送每个分块，包含 `chunk` 字段，内容为二进制数据。

### 完成上传

**端点：** `POST /api/files/upload/complete/{taskId}`

成功时返回 `CloudFile` 对象。

### 直接上传

**端点：** `POST /api/files/upload/direct`

多部分表单上传，包含元数据字段和 `file` 字段。支持 `overwrite_id` 和 `fast_mode` 覆盖已有文件。

### 快速模式

当 `overwrite_id` 与 `fast_mode: true` 同时设置时，服务器会原地覆盖现有对象（仅在目标对象被单个活动文件引用时）。若被共享，会自动回退到重新创建并交换的方式。

## 文件列表筛选

以下端点共享相同的列表查询解析器：

- `GET /api/files/me`
- `GET /api/files/root/children`
- `GET /api/files/:id/children`
- `GET /api/files/unindexed`

**查询参数：**

| 参数 | 说明 |
|------|------|
| `offset` | 分页偏移 |
| `take` | 每页大小 |
| `order` | `date`、`name` 或 `size` |
| `orderDesc` | `true`/`false` |
| `query` | 文件名不区分大小写的模糊匹配 |
| `name` | 精确文件名匹配 |
| `extension` | 文件扩展名（可有或无前导 `.`） |
| `content_type` / `mime_type` |精确的 MIME 类型匹配 |
| `pool_id` | 按存储池筛选 |
| `parent_id` | 按父文件夹筛选 |
| `indexed` | `true`/`false` |
| `recycled` | `true`/`false` |
| `is_folder` | `true`/`false` |
| `has_thumbnail` | `true`/`false` |
| `min_size` / `max_size` | 大小范围（字节） |
| `created_after` / `created_before` | 日期范围（RFC3339 或 YYYY-MM-DD） |
| `updated_after` / `updated_before` | 日期范围 |

## 文件夹

### 创建文件夹

**端点：** `POST /folders`

```json
{
  "name": "项目",
  "parent_id": "..."
}
```

文件夹存储为 `is_folder = true` 且 `indexed = true` 的 `cloud_files` 行。

## 权限

文件通过以下方式暴露读/写/管理权限：

- **无权限记录** → 文件公开
- **`private` 权限记录** → 文件默认私有
- **权限检查从祖先文件夹继承**

**读取：** `GET /api/files/:id/permissions`

**更新：** `PUT /api/files/:id/permissions`

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

`subject_type` 可以是 `public`、`private`、`account` 或 `scope`。

## 文件操作

### 重命名

**端点：** `PATCH /api/files/:id`

```json
{"name": "renamed-file.txt"}
```

### 批量操作

| 操作 | 端点 |
|------|------|
| 回收 | `POST /api/files/recycle/batch` |
| 恢复 | `POST /api/files/restore/batch` |
| 删除 | `POST /api/files/delete/batch` |
| 移动 | `POST /api/files/move/batch` |

移动请求体：

```json
{
  "file_ids": ["file-id-1", "file-id-2"],
  "parent_id": "...",
  "indexed": true
}
```

- 省略 `parent_id` 或设为 `null` 将文件移回根目录
- `indexed` 可选；设为 `true`/`false` 可更改索引状态

## 已索引与未索引

- **已索引文件** 出现在 `GET /api/files/root/children` 和 `GET /api/files/:id/children` 中
- **未索引文件** 仅出现在 `GET /api/files/unindexed` 中
- 文件夹始终已索引
- 可在上传时设置 `index` 字段，或通过批量移动端点稍后更改

## 配额与计费

配额值以 MB 为单位。

**基础配额** = 等级配额 + 特权配额

| 等级 | 配额 |
|------|------|
| Lv0 | 512MB |
| Lv10 | 1GB |
| Lv60 | 5GB |
| Lv120 | 10GB |

| 特权 | 额外配额 |
|------|----------|
| 特权 1 | +10GB |
| 特权 2 | +25GB |
| 特权 3 | +50GB |

活动 `quota_records` 的额外配额在基础配额之后叠加。

**查询配额：** `GET /api/billing/quota`

```json
{
  "based_quota": 15360,
  "extra_quota": 25,
  "total_quota": 15385
}
```

**查询用量：** `GET /api/billing/usage`

```json
{
  "used_quota": 300,
  "total_quota": 15385,
  "total_file_count": 2,
  "total_usage_bytes": 209715200
}
```

存储池计费的 `cost_multiplier` 影响可计量用量和配额检查。

## WOPI / Collabora Online

DysonFS 支持 WOPI 主机端点，用于 Collabora Online 文档编辑。

**创建编辑会话：** `POST /api/files/:id/edit`

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

客户端应将 `form_fields` POST 到 `action_url`，通常在 iframe 中进行。

---

单独阅读 API 文档可能让部分信息晦涩难懂。请结合「开发者服务」章节中有关 Drive 的内容一起阅读。
