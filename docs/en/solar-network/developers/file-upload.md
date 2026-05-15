---
title: 文件上传
description: 了解如何使用 Solar Network 的 API 来完成文件上传。
---

在通过网关访问时，需要将 `/api` 替换成服务 ID `/drive`。

原有的 `/api/tus` 接口已经过时，即将迎来移除的命运。还请使用新的 Solar Network Multipart Upload 协议上传文件。

本文档概述了使用多部分上传 API 分块上传大文件的过程。

## 1. 创建上传任务

要开始文件上传，您首先需要创建一个上传任务。这是通过向 `/api/files/upload/create` 端点发送 `POST` 请求来完成的。

**端点：** `POST /api/files/upload/create`

**请求体：**

```json
{
  "hash": "string (文件哈希，例如 MD5 或 SHA256)",
  "file_name": "string",
  "file_size": "long (字节数)",
  "content_type": "string (例如 'image/jpeg')",
  "pool_id": "string (GUID，可选)",
  "bundle_id": "string (GUID，可选)",
  "encrypt_password": "string (可选)",
  "expired_at": "string (ISO 8601 格式，可选)",
  "chunk_size": "long (字节数，可选，默认 5MB)"
}
```

**响应：**

如果具有相同哈希的文件已存在，服务器将返回 `200 OK`，响应体如下：

```json
{
  "file_exists": true,
  "file": { ... (CloudFile 对象，以 snake_case 格式) ... }
}
```

如果文件不存在，服务器将返回 `200 OK`，包含任务 ID 和分块信息：

```json
{
  "file_exists": false,
  "task_id": "string",
  "chunk_size": "long",
  "chunks_count": "int"
}
```

您将需要 `task_id`、`chunk_size` 和 `chunks_count` 用于后续步骤。

## 2. 上传文件分块

一旦您有了 `task_id`，就可以开始分块上传文件。每个分块作为带有 `multipart/form-data` 的 `POST` 请求发送。

**端点：** `POST /api/files/upload/chunk/{taskId}/{chunkIndex}`

-   `taskId`：上一步上传任务的 ID。
-   `chunkIndex`：您正在上传的分块的从 0 开始的索引。

**请求体：**

请求体的格式应为 `multipart/form-data`，包含一个名为 `chunk` 的表单字段，其中包含该分块的二进制数据。

每个分块的大小应等于"创建上传任务"步骤中返回的 `chunk_size`，除了最后一个分块可能更小。

**响应：**

成功的分块上传将返回 `200 OK`，响应体为空。

您应该上传从 `0` 到 `chunks_count - 1` 的所有分块。

## 3. 完成上传

所有分块成功上传后，您必须发送最终请求以完成上传过程。这将合并所有分块为单个文件并进行处理。

**端点：** `POST /api/files/upload/complete/{taskId}`

-   `taskId`：上传任务的 ID。

**请求体：**

请求体应为空。

**响应：**

成功的请求将返回 `200 OK`，包含新上传文件的 `CloudFile` 对象。

```json
{
  ... (CloudFile 对象) ...
}
```

如果任何分块缺失或合并过程中发生错误，服务器将返回 `400 Bad Request` 以及错误消息。
