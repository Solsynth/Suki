---
title: 帖子订阅 API
---

## 概述

存在两种订阅模型：

1. **`SnPostCategorySubscription`** — 订阅分类、标签或合集
2. **`SnPostSubscription`** — 订阅单个帖子以获取更新通知

用途不同：
- 分类/标签/合集订阅在有新帖子匹配时通知
- 帖子订阅在已有帖子收到反应、转发或编辑时通知

## 合集订阅

建立在现有的 `post_category_subscriptions` 表上，新增 `CollectionId` 列。每行恰好指向以下之一：`category_id`、`tag_id` 或 `collection_id`。

当帖子发布时，`PublisherSubscriptionService` 检查包含该帖子的合集，并通知这些合集的订阅者。

### 端点

```
POST /api/publishers/{publisherName}/collections/{slug}/subscribe
POST /api/publishers/{publisherName}/collections/{slug}/unsubscribe
GET  /api/publishers/{publisherName}/collections/{slug}/subscription
```

## 帖子订阅

### 数据模型

`SnPostSubscription` 存储在 `post_subscriptions` 表中：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| post_id | UUID | 目标帖子 |
| account_id | UUID | 订阅者 |
| notify_reactions | bool | 新反应时通知（默认: true） |
| notify_forwards | bool | 转发时通知（默认: true） |
| notify_edits | bool | 编辑时通知（默认: true） |

### 规则

- 每个用户每帖子只能有一个活跃订阅
- 重复订阅更新已有行
- 用户必须能查看该帖子才能订阅
- 操作者不会收到自己触发的通知

### 端点

```
POST   /api/posts/{id}/subscribe
POST   /api/posts/{id}/unsubscribe
GET    /api/posts/{id}/subscription
GET    /api/posts/subscriptions
```

**订阅请求体**（均可选，默认为 `true`）：

```json
{
  "reactions": true,
  "forwards": true,
  "edits": true
}
```

**列出订阅响应：**

```json
[
  {
    "subscription": {
      "id": "...",
      "post_id": "...",
      "notify_reactions": true,
      "notify_forwards": false,
      "notify_edits": true
    },
    "post": {
      "id": "...",
      "title": "Subscribed post",
      "publisher": { "id": "...", "name": "..." }
    }
  }
]
```

## 通知触发器

| 事件 | 主题 |
|------|------|
| 添加反应 | `posts.subscriptions.reactions` |
| 帖子被转发 | `posts.subscriptions.forwards` |
| 帖子被编辑 | `posts.subscriptions.edits` |
