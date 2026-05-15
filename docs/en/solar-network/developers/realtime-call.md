---
title: 实时通话
---

本文档介绍 Dysonnetwork 中用于语音/视频通话的实时通话 API。该实现使用 LiveKit 作为底层实时通信提供商。

## 概述

实时通话 API 提供以下端点：

- 开始/结束通话
- 使用认证令牌加入通话
- 管理通话参与者（踢出、静音）
- 通过定期轮询获取参与者信息

**注意：** Webhook 已被定期 GET 请求取代，用于参与者同步。

## 基础 URL

```
/messager/chat/realtime
```

## 认证

所有端点都需要在 `Authorization` 头中提供有效的 Bearer 令牌。

## 端点

### 1. 获取进行中的通话

获取聊天室中正在进行的通话信息。

**端点：** `GET /{roomId:guid}`

**响应：** `SnRealtimeCall`

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "senderId": "uuid",
  "sessionId": "string",
  "providerName": "LiveKit",
  "endedAt": null,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 2. 加入通话

加入正在进行的通话并获取 LiveKit 认证令牌。

**端点：** `GET /{roomId:guid}/join`

**响应：** `JoinCallResponse`

```json
{
  "provider": "LiveKit",
  "endpoint": "wss://livekit.example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "callId": "uuid",
  "roomName": "Call_xxx",
  "isAdmin": true,
  "participants": [
    {
      "identity": "username",
      "name": "Display Name",
      "accountId": "uuid",
      "joinedAt": "2024-01-01T00:00:00Z",
      "trackSid": "TR_xxx",
      "profile": {
        "id": "uuid",
        "nick": "nickname",
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

**注意：** `isAdmin` 字段表示用户是否可以踢出/静音参与者。以下用户为管理员：

- 聊天室所有者
- 私信对话（双方都是管理员）

---

### 3. 获取参与者

获取通话中的当前参与者。此端点将参与者从 LiveKit 同步到缓存。

**端点：** `GET /{roomId:guid}/participants`

**响应：** `List<CallParticipant>`

```json
[
  {
    "identity": "username",
    "name": "Display Name",
    "accountId": "uuid",
    "joinedAt": "2024-01-01T00:00:00Z",
    "trackSid": "TR_xxx",
    "profile": { ... }
  }
]
```

**用法：** 定期轮询此端点（例如每 5-10 秒）以获取更新的参与者列表，而不是依赖 webhook。

---

### 4. 开始通话

在聊天室中开始新的通话。

**端点：** `POST /{roomId:guid}`

**响应：** `SnRealtimeCall`

**错误：**

- `403` - 非成员或超时
- `423` - 通话正在进行中

---

### 5. 结束通话

结束正在进行的通话。

**端点：** `DELETE /{roomId:guid}`

**响应：** `204 No Content`

---

### 6. 踢出参与者

从通话中踢出参与者。可选择禁止他们进入聊天室。

**端点：** `POST /{roomId:guid}/kick/{targetAccountId:guid}`

**请求体：**

```json
{
  "banDurationMinutes": 30,
  "reason": "Violation of community guidelines"
}
```

| 字段                 | 类型   | 必填 | 描述                                     |
| -------------------- | ------ | ---- | ---------------------------------------- |
| `banDurationMinutes` | int    | 否   | 禁止进入聊室的时长（0 或 null = 不禁止） |
| `reason`             | string | 否   | 踢出/禁止的原因                          |

**响应：** `204 No Content`

**授权：** 只有聊天室所有者/管理员可以踢出参与者。

**行为：**

- 从 LiveKit 房间中移除参与者
- 如果 `banDurationMinutes > 0`，则在成员上设置 `TimeoutUntil` 以阻止加入

---

### 7. 静音参与者

静音参与者的音频轨道。

**端点：** `POST /{roomId:guid}/mute/{targetAccountId:guid}`

**响应：** `204 No Content`

---

### 8. 取消静音参与者

取消静音参与者的音频轨道。

**端点：** `POST /{roomId:guid}/unmute/{targetAccountId:guid}`

**响应：** `204 No Content`

---

## 数据模型

### JoinCallResponse

```csharp
public class JoinCallResponse
{
    public string Provider { get; set; }      // 例如，"LiveKit"
    public string Endpoint { get; set; }        // LiveKit WebSocket 端点
    public string Token { get; set; }          // 用于认证的 JWT 令牌
    public Guid CallId { get; set; }           // 通话标识符
    public string RoomName { get; set; }       // LiveKit 房间名称
    public bool IsAdmin { get; set; }          // 用户是否可以管理参与者
    public List<CallParticipant> Participants { get; set; }
}
```

### CallParticipant

```csharp
public class CallParticipant
{
    public string Identity { get; set; }       // LiveKit 身份（用户名）
    public string Name { get; set; }          // 显示名称
    public Guid? AccountId { get; set; }      // DysonNetwork 账户 ID
    public DateTime JoinedAt { get; set; }     // 参与者加入时间
    public string? TrackSid { get; set; }      // 用于静音的轨道 SID
    public SnChatMember? Profile { get; set; } // 聊天成员资料
}
```

### KickParticipantRequest

```csharp
public class KickParticipantRequest
{
    public int? BanDurationMinutes { get; set; }  // 禁止时长（分钟）
    public string? Reason { get; set; }           // 踢出/禁止的原因
}
```

---

## 客户端实现指南

### 加入通话

```typescript
interface CallJoinResponse {
  provider: string;
  endpoint: string;
  token: string;
  callId: string;
  roomName: string;
  isAdmin: boolean;
  participants: CallParticipant[];
}

async function joinCall(
  roomId: string,
  authToken: string,
): Promise<CallJoinResponse> {
  const response = await fetch(`/api/chat/realtime/${roomId}/join`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to join call");
  }

  return response.json();
}
```

### 轮询参与者

```typescript
interface CallParticipant {
  identity: string;
  name: string;
  accountId: string | null;
  joinedAt: string;
  trackSid: string | null;
}

async function getParticipants(
  roomId: string,
  authToken: string,
): Promise<CallParticipant[]> {
  const response = await fetch(`/api/chat/realtime/${roomId}/participants`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get participants");
  }

  return response.json();
}

// 每 5 秒轮询
setInterval(async () => {
  const participants = await getParticipants(roomId, authToken);
  updateParticipantList(participants);
}, 5000);
```

### 踢出参与者

```typescript
async function kickParticipant(
  roomId: string,
  targetAccountId: string,
  authToken: string,
  options?: { banMinutes?: number; reason?: string },
): Promise<void> {
  const response = await fetch(
    `/api/chat/realtime/${roomId}/kick/${targetAccountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        banDurationMinutes: options?.banMinutes,
        reason: options?.reason,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to kick participant");
  }
}
```

### 静音参与者

```typescript
async function muteParticipant(
  roomId: string,
  targetAccountId: string,
  authToken: string,
): Promise<void> {
  const response = await fetch(
    `/api/chat/realtime/${roomId}/mute/${targetAccountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to mute participant");
  }
}
```

---

## 最佳实践

1. **轮询策略**：每 5-10 秒轮询 `/participants` 以获取准确的参与者列表。不要依赖 webhook（它们不被使用）。

2. **令牌刷新**：LiveKit 令牌在 1 小时后过期。重新获取加入端点以获取新令牌。

3. **权限检查**：仅为管理员用户显示踢出/静音按钮（加入响应中的 `isAdmin: true`）。

4. **轨道处理**：调用静音/取消静音端点时，请使用参与者数据中的 `trackSid`。请注意，如果参与者尚未发布任何轨道，`trackSid` 可能为 null。

5. **错误处理**：妥善处理 403（未授权）、404（无进行中的通话）和网络错误。

6. **重连**：实现重连逻辑 - 如果通话结束（获取参与者返回 404），显示适当的 UI。

---

## 从 Webhook 迁移

之前的实现使用 LiveKit webhook 进行参与者更新。这已被定期轮询取代：

| 之前                  | 之后                         |
| --------------------- | ---------------------------- |
| Webhook 端点接收事件  | 客户端轮询 GET /participants |
| 通过 webhook 实时更新 | 每 5-10 秒轮询               |
| 服务端参与者追踪      | 客户端在加入时获取并轮询     |

**迁移步骤：**

1. 移除 webhook 接收器代码
2. 在客户端实现轮询
3. 在通话加入时调用 `/participants`
4. 设置间隔轮询 `/participants`

---

## 相关文档

如果你需要开发扩展功能，请参考 [LiveKit 文档](https://docs.livekit.io)
