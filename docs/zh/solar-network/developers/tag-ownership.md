---
title: 标签所有权 API
---

## 数据模型

### SnPostTag

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| slug | string(128) | 唯一规范化标识符（小写、去空格） |
| name | string(256)? | 显示名称 |
| description | string(4096)? | 标签描述/元数据 |
| owner_publisher_id | UUID? | 拥有者发布者 |
| is_protected | bool | 仅拥有者可在新帖子中使用 |
| is_event | bool | 有时间限制的活动标签 |
| event_ends_at | Instant? | 过期时间戳 |

### 受保护标签配额

```
quota = 3 + 3 × perkLevel
```

| 特权等级 | 配额 |
|----------|------|
| 0 | 3 |
| 1 | 6 |
| 2 | 9 |
| 3 | 12 |

## 发布者端点

所有端点前缀为 `/api/posts/tags`。`pub` 查询参数选择发布者（默认为当前用户的默认发布者）。

### 创建标签

```
POST /api/posts/tags?pub={publisherName}
```

```json
{
  "slug": "photography",
  "name": "Photography",
  "description": "摄影相关帖子"
}
```

认证的发布者成为拥有者。

### 获取标签

```
GET /api/posts/tags/{slug}
```

### 更新标签

```
PATCH /api/posts/tags/{slug}?pub={publisherName}
```

仅拥有发布者的管理员/所有者可编辑。

### 认领标签

```
POST /api/posts/tags/{slug}/claim?pub={publisherName}
```

手动认领未被拥有的标签。

### 检查配额

```
GET /api/posts/tags/quota?pub={publisherName}
```

返回总额度/已用/剩余配额和受保护标签列表。

## 管理员端点

所有端点需要 `IsSuperuser` 或 `posts.tags.admin` 权限。

### 分配所有权

```
POST /api/admin/posts/tags/{slug}/assign
```

```json
{ "publisher_id": "..." }
```

### 切换保护状态

```
PATCH /api/admin/posts/tags/{slug}/protect
```

```json
{ "is_protected": true }
```

超出配额返回 `400`。

### 设置活动标签

```
PATCH /api/admin/posts/tags/{slug}/event
```

```json
{
  "is_event": true,
  "ends_at": "2026-06-01T00:00:00Z"
}
```

### 管理员更新

```
PATCH /api/admin/posts/tags/{slug}
```

管理员可更新任何标签，无论所有权。

## 帖子创建时的验证

1. 规范化 slug（去空格、小写）
2. 按 slug 查找已有标签
3. 创建缺失的标签（未拥有）
4. 对每个标签：
   - 活动标签已过期 → `400`
   - 受保护且拥有者与帖子发布者不同 → `400`
5. 将标签附加到帖子
