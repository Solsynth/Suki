---
title: 聊天同步与消息
---

聊天消息由 `DysonNetwork.Messager` 服务处理。通过网关访问时，将 `/api` 替换为 `/messager/chat`。

## 架构概述

实时消息通过 WebSocket 传递。同步端点用于离线优先恢复：

```
客户端 <-- WebSocket (Ring) --> Messager（实时消息）
客户端 <-- HTTP POST --> Messager（同步 / 缺失消息恢复）
```

所有 WebSocket 包通过 Ring WebSocket 网关发送，设置 `endpoint = "DysonNetwork.Messager"`。

## WebSocket 包

### 出站（客户端 → 服务端）

| 类型 | 用途 | 响应 |
|------|------|------|
| `messages.send` | 发送聊天消息 | `messages.delivered`（确认）+ `messages.new`（广播） |
| `messages.typing` | 打字/说话/上传中指示器 | 广播到房间 |

### 入站（服务端 → 客户端）

| 类型 | 载荷 |
|------|------|
| `messages.new` | 新聊天消息 |
| `messages.update` | 编辑的消息 |
| `messages.delete` | 删除的消息 |
| `messages.delivered` | 发送确认（完整的持久化 `SnChatMessage`） |
| `messages.typing` | 打字指示器 |
| `messages.reaction.added` | 表情反应添加 |
| `messages.reaction.removed` | 表情反应移除 |

### WebSocket 包结构

```json
{
    "type": "messages.send",
    "endpoint": "DysonNetwork.Messager",
    "data": {
      "chat_room_id": "...",
      "content": "Hello",
      "nonce": "optional-client-nonce",
      "attachments_id": [],
      "meta": {},
      "replied_message_id": null,
      "forwarded_message_id": null
    }
}
```

## 聊天表情反应

### 默认表情符号

| 符号 | 说明 |
|------|------|
| `thumb_up` | 点赞 |
| `thumb_down` | 踩 |
| `just_okay` | 一般般 |
| `cry` | 哭泣 |
| `confuse` | 困惑 |
| `clap` | 鼓掌 |
| `laugh` | 大笑 |
| `angry` | 生气 |
| `party` | 庆祝 |
| `pray` | 祈祷 |
| `heart` | 爱心 |

自定义表情反应符号需要活跃的订阅。

### 端点

#### 列出反应

```
GET /messager/chat/{roomId}/messages/{messageId}/reactions
```

查询参数：`symbol`（筛选）、`offset`、`take`、`order`（使用 `created` 按最新排序）。返回 `SnChatReaction` 对象，响应头包含 `X-Total`。

#### 添加或切换反应

```
POST /messager/chat/{roomId}/messages/{messageId}/reactions
```

**请求：**

```json
{
  "symbol": "heart",
  "attitude": 0
}
```

`attitude`：`0` = 正面，`1` = 中立，`2` = 负面。

**切换行为：** 如果用户已添加了相同的符号，调用此端点会**移除**该反应（返回 `204 No Content`）。

#### 移除反应

```
DELETE /messager/chat/{roomId}/messages/{messageId}/reactions/{symbol}
```

返回 `204 No Content`。

### 实时同步

添加的反应广播 `messages.reaction.added`，移除的反应广播 `messages.reaction.removed`。两者都在 `meta` 中包含更新后的 `reactions_count` 快照。

**添加反应载荷：**

```json
{
  "type": "messages.reaction.added",
  "meta": {
    "message_id": "...",
    "symbol": "heart",
    "reaction": { "id": "...", "symbol": "heart", "attitude": 0, ... },
    "reactions_count": { "heart": 3, "thumb_up": 1 }
  }
}
```

**移除反应载荷：**

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

### 持久化模型

- `chat_reactions` 表：单个用户反应的真实来源
- `chat_messages.reactions_count`：消息行上的 JSONB 摘要缓存（如 `{"heart": 3, "thumb_up": 1}`）
- 添加/移除操作在同一写流程中更新两者
- 消息还暴露 `reactions_made`（当前请求用户已反应的符号字典）

### 同步集成

反应变更作为同步消息存储在房间中。通过全局同步端点同步时，反应变更以 `messages.reaction.added` / `messages.reaction.removed` 消息类型传递。`meta.reactions_count` 已包含更新的快照——无需第二次补充。

推荐客户端行为：
- 使用 `meta.message_id` 定位目标消息
- 用 `meta.reactions_count` 替换本地 `reactions_count`
- 从刷新后的消息载荷应用用户特定的切换状态

## 房间序列同步

每条消息在房间内获得一个单调递增的 `room_sequence`（int64）。这支持缺失检测和恢复：

```
收到: [1000, 1001, 1003]
缺失:  [1002] → 请求恢复
```

- `room_sequence` 由后端在持久化时分配
- 每个房间内唯一（非跨房间）
- 用于间隔检测，不作为全局排序
- 旧消息基于 `created_at` 使用 `ROW_NUMBER()` 回填

## 同步端点

### 1. 房间列表同步

同步用户加入的房间列表（非消息）。

```
POST /messager/chat/rooms/sync
```

**请求：**

```json
{ "last_sync_timestamp": 1706745600000 }
```

首次同步使用 `0`。存储响应中的 `current_timestamp` 用于下次请求。

**响应：**

| 字段 | 说明 |
|------|------|
| `changes` | 房间列表变更：`joined`、`updated`、`removed` |
| `summaries` | 每个受影响房间的未读消息数 + 最新消息 |
| `current_timestamp` | 保存用于下次同步 |
| `total_count` | 变更数量 |

每个 `change` 包含完整的 `SnChatRoom` 和当前用户的 `SnChatMember`。每次请求限制 500 条变更。

### 2. 消息同步（房间内）

同步特定房间内的消息。支持基于时间戳和序列的恢复。

```
POST /messager/chat/{roomId}/sync
```

**时间戳模式**（常规增量同步）：

```json
{ "last_sync_timestamp": 1706745600000 }
```

**序列恢复模式**（填补间隔）：

```json
{
  "last_sync_timestamp": 1706745600000,
  "missing_sequences": [1002, 1005],
  "missing_sequence_ranges": [
    { "start_sequence": 2000, "end_sequence": 2050 }
  ]
}
```

提供序列或范围时，服务端切换到精确间隔恢复模式。范围会在服务端自动归一化和合并。

**响应：**

| 字段 | 说明 |
|------|------|
| `messages` | 按 `room_sequence` 升序排列的匹配消息 |
| `current_timestamp` | 结果中的最新时间戳 |
| `total_count` | 应用限制前的计数 |

### 3. 全局同步

跨所有房间同步消息（仅支持时间戳）。

```
POST /messager/chat/sync
```

**请求：**

```json
{ "last_sync_timestamp": 1706745600000 }
```

**响应：**

| 字段 | 说明 |
|------|------|
| `messages` | 来自所有房间的消息，按 `created_at` 升序排列 |
| `current_timestamp` | 保存用于下次同步 |
| `total_count` | 消息数量 |

每房间限制 500 条消息。E2EE 消息以加密形式返回，由客户端解密。

## 推荐客户端流程

```
1. 连接 WebSocket → 接收实时消息
2. 每个房间的每条消息存储 room_sequence
3. WebSocket 断开时：
   a. 重新连接 WebSocket
   b. 调用房间列表同步 → 获取加入/更新/移除的房间
   c. 调用全局同步 → 捕获跨房间的遗漏消息
   d. 检测每个房间的序列间隔
   e. 调用房间同步并传入 missing_sequences → 填补间隔
4. 收到 WebSocket 消息时：
   a. 检查 room_sequence 间隔
   b. 如果检测到间隔 → 调用房间同步并传入 missing_sequences/ranges
```

## 打字指示器

发送临时活动状态：

```json
{
  "type": "messages.typing",
  "endpoint": "DysonNetwork.Messager",
  "data": {
    "chat_room_id": "...",
    "type": "typing"
  }
}
```

活动类型：`typing`、`speaking`、`uploading`。广播给除发送者外的所有房间成员。

## 消息转发

将聊天历史片段复制到另一个房间：

```
POST /api/chat/{roomId}/messages/redirect
```

```json
{
  "message_ids": ["msg-id-1", "msg-id-2"]
}
```

- 所有消息必须来自同一源房间
- 服务端按时间戳重建副本
- 目前仅支持文本消息

## 系统消息

后端生成的事件以 `messages.new` 包传递：

| 类型 | 用途 |
|------|------|
| `system.member.joined` | 成员加入房间 |
| `system.member.left` | 成员离开/被移除 |
| `system.chat.updated` | 房间设置变更 |
| `system.e2ee.enabled` | MLS 加密已启用 |
| `system.mls.epoch_changed` | MLS epoch 前进 |
| `system.mls.reshare_required` | 需要 MLS 重新分享 |
| `system.call.member.joined` | 通话参与者加入 |
| `system.call.member.left` | 通话参与者离开 |

## 加密（MLS 硬切换）

加密房间独占使用 MLS（消息层安全）：

- 加密模式：`None (0)` 或 `E2eeMls (3)`
- 启用：`POST /api/chat/{id}/mls/enable`（单向，不可关闭）
- 写入 MLS 房间需要请求头：`X-Client-Ability: chat.mls.v2`
- 加密消息携带：`ciphertext`、`encryption_epoch`、`encryption_scheme: "chat.mls.v2"`
- 加密消息中仍允许未加密的文件附件
- 推送通知显示通用文本："Encrypted message"
