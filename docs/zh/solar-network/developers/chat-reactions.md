---
title: 聊天表情反应 API
---

## 数据模型

- `chat_reactions` 表：单个用户反应的真实来源
- `chat_messages.reactions_count`：消息行上的 JSONB 摘要缓存（如 `{"heart": 3, "thumb_up": 1}`）
- 添加/移除操作在同一写流程中更新两者

### 消息字段

| 字段 | 类型 | 说明 |
|------|------|------|
| reactions_count | dict | 符号 → 数量映射 |
| reactions_made | dict? | 当前用户已反应的符号（仅在带用户上下文时返回） |

## 端点

所有端点前缀为 `/messager/chat`（网关）或 `/api/chat`（本地）。

### 列出反应

```
GET /messager/chat/{roomId}/messages/{messageId}/reactions
```

| 参数 | 说明 |
|------|------|
| symbol | 筛选单个反应符号 |
| offset | 分页偏移（默认: 0） |
| take | 每页大小（默认: 20） |
| order | `created` 按最新排序；否则按符号然后最新排序 |

返回带有 `sender` 的 `SnChatReaction` 对象。`X-Total` 头包含总数。

公开未加密房间可选认证。私密/加密房间需要认证。

### 添加或切换反应

```
POST /messager/chat/{roomId}/messages/{messageId}/reactions
```

```json
{
  "symbol": "heart",
  "attitude": 0
}
```

`attitude`：`0` = 正面，`1` = 中立，`2` = 负面。

**切换行为：** 如果用户已添加了相同的符号，此操作**移除**该反应并返回 `204 No Content`。

自定义符号需要活跃的订阅（否则返回 `400`）。

### 移除反应

```
DELETE /messager/chat/{roomId}/messages/{messageId}/reactions/{symbol}
```

返回 `204 No Content`。

## WebSocket 事件

### 添加反应

```json
{
  "type": "messages.reaction.added",
  "meta": {
    "message_id": "...",
    "symbol": "heart",
    "reaction": {
      "id": "...",
      "symbol": "heart",
      "attitude": 0,
      "message_id": "...",
      "sender_id": "..."
    },
    "reactions_count": { "heart": 3, "thumb_up": 1 }
  }
}
```

### 移除反应

```json
{
  "type": "messages.reaction.removed",
  "meta": {
    "message_id": "...",
    "symbol": "heart",
    "reactions_count": { "thumb_up": 1 }
  }
}
```

## 同步集成

反应变更作为同步消息存储在房间中。通过全局同步端点（`POST /messager/chat/sync`）同步时，反应变更以 `messages.reaction.added` / `messages.reaction.removed` 消息类型传递。

`meta.reactions_count` 已包含更新的快照——无需第二次补充。

### 推荐客户端行为

- 使用 `meta.message_id` 定位目标消息
- 用同步载荷中的 `meta.reactions_count` 替换本地 `reactions_count`
- 根据需要从刷新的消息载荷应用用户特定的切换状态
