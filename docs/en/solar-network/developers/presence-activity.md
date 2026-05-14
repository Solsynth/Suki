---
title: 在线状态活动
---

## 概述

在线状态活动 API 允许用户管理当前活动（如游戏、音乐、健身），通过基于租约的系统实现自动过期。活动可以创建、更新和删除，支持灵活的元数据以及系统生成和用户定义的标识符。

## 核心功能

- **基于租约的过期**：活动在 1-60 分钟内自动过期，除非续期
- **灵活的标识符**：支持自动生成的 GUID 和用户定义的 ManualId
- **可扩展的元数据**：JSON 存储的元数据字典，用于自定义开发者数据
- **软删除**：活动采用软删除方式，自动被过滤
- **性能优化**：缓存的活动具有 1 分钟过期时间
- **需要认证**：所有端点都需要有效的用户认证

## API 端点

## 获取活动

获取认证用户的所有当前活动（未过期的在线状态活动）。

**端点：** `GET /pass/activities`

**响应：**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "Gaming",
    "manualId": "game-session-1",
    "title": "Playing Cyberpunk 2077",
    "subtitle": "Night City Exploration",
    "caption": "Missions completed: 15",
    "meta": {
      "appName": "Cyberpunk 2077",
      "platform": "Steam",
      "customProperty": "additional data"
    },
    "leaseMinutes": 10,
    "leaseExpiresAt": "2024-01-15T14:30:00Z",
    "accountId": "user-guid",
    "createdAt": "2024-01-15T14:25:00Z",
    "updatedAt": "2024-01-15T14:25:00Z",
    "deletedAt": null
  }
]
```

**常见响应码：**

- `200 OK` - 成功，返回活动数组
- `401 Unauthorized` - 认证无效或缺失

---

## 创建新活动

创建具有可配置租约期的新在线状态活动。

**端点：** `POST /pass/activities`

**请求体：**

```json
{
  "type": "Gaming",
  "manualId": "my-game-session",
  "title": "Playing Cyberpunk 2077",
  "subtitle": "Night City Mission",
  "caption": "Currently exploring downtown",
  "meta": {
    "appName": "Cyberpunk 2077",
    "platform": "Steam",
    "difficulty": "Hard",
    "mods": ["mod1", "mod2"]
  },
  "leaseMinutes": 15
}
```

**响应：** 返回创建的 `SnPresenceActivity` 对象，包含已填充的字段。

**字段详情：**

- `type`：PresenceType 枚举（Unknown、Gaming、Music、Workout）
- `manualId`：可选的用户定义字符串标识符
- `title`、`subtitle`、`caption`：显示字符串（每个最多 4096 字符）
- `meta`：可选的 `Dictionary<string, object>`，用于自定义数据
- `leaseMinutes`：1-60 分钟（默认：5）

**响应码：**

- `200 OK` - 活动创建成功
- `400 Bad Request` - 租约分钟无效或数据格式错误
- `401 Unauthorized` - 认证无效

---

## 更新活动

使用 GUID 或 ManualId 更新现有活动。仅更新提供的字段。

**端点：** `PUT /pass/activities`

**查询参数：**（需要其一）

- `id` - 系统生成的 GUID（字符串）
- `manualId` - 用户定义的标识符（字符串）

**请求体：**（所有字段可选）

```json
{
  "title": "Updated: Playing Cyberpunk 2077",
  "meta": {
    "appName": "Cyberpunk 2077",
    "platform": "Steam",
    "newProperty": "updated data"
  },
  "leaseMinutes": 20
}
```

**响应：** 返回更新的 `SnPresenceActivity` 对象。

**响应码：**

- `200 OK` - 活动更新成功
- `400 Bad Request` - 缺少或无效的 ID 参数
- `401 Unauthorized` - 认证无效
- `404 Not Found` - 活动未找到或不属于该用户

**示例 cURL：**

```bash
# 通过 ManualId 更新
curl -X PUT "/pass/activities?manualId=my-game-session" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"leaseMinutes": 20}'

# 通过 GUID 更新
curl -X PUT "/pass/activities?id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

---

## 删除活动

使用 GUID 或 ManualId 软删除活动。

**端点：** `DELETE /pass/activities`

**查询参数：**（需要其一）

- `id` - 系统生成的 GUID（字符串）
- `manualId` - 用户定义的标识符（字符串）

**请求体：** 无

**响应：** 无内容（204）

**响应码：**

- `204 No Content` - 活动删除成功
- `400 Bad Request` - 缺少或无效的 ID 参数
- `401 Unauthorized` - 认证无效
- `404 Not Found` - 活动未找到或不属于该用户

**示例 cURL：**

```bash
# 通过 ManualId 删除
curl -X DELETE "/pass/activities?manualId=my-game-session" \
  -H "Authorization: Bearer <token>"
```

---

## 其他端点

### 通过账户 ID 获取活动

**端点：** `GET /pass/activities/{accountId:guid}`

用于管理或调试目的。返回指定账户 ID 的活动，无视认证状态。

---

## 数据模型

### PresenceType 枚举

```csharp
public enum PresenceType
{
    Unknown,
    Gaming,
    Music,
    Workout
}
```

### SnPresenceActivity

```csharp
public class SnPresenceActivity : ModelBase
{
    public Guid Id { get; set; } // 系统生成的 GUID
    public PresenceType Type { get; set; }
    public string? ManualId { get; set; } // 用户定义的 ID
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Caption { get; set; }
    public Dictionary<string, object>? Meta { get; set; } // JSON 元数据
    public int LeaseMinutes { get; set; } // 租约时长
    public Instant LeaseExpiresAt { get; set; } // 过期时间戳

    // 继承自 ModelBase
    public Guid AccountId { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; } // 软删除
}
```

## 行为与约束

### 租约过期

- 当 `SystemClock.Instance.GetCurrentInstant() > LeaseExpiresAt` 时，活动自动过期
- 过期检查在数据库查询中进行，因此过期的活动会在 GET 操作中被过滤
- 客户端必须定期更新/续租以保持活动活跃

### ID 灵活性

- **ManualId**：用户定义的字符串，在用户活动范围内唯一
- **GUID**：系统生成的，始终唯一，在 API 响应中返回
- 两者可以互换用于更新和删除

### 性能优化

- 活动缓存 1 分钟以处理频繁更新
- 创建/更新/删除操作会使缓存失效
- 数据库查询自动过滤过期的活动

### 安全

- 所有操作都限定在认证用户的账户范围内
- 用户只能管理自己的活动
- 无效或过期的认证令牌返回 401 Unauthorized

### 数据存储

- 活动存储在 PostgreSQL 中，支持 JSONB 元数据
- 软删除使用时间戳而非硬删除
- EF Core 中间件自动处理 CreatedAt/UpdatedAt 时间戳

## 使用示例

### 游戏会话管理

```javascript
// 开始游戏会话
const activity = await fetch("/pass/activities", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "Gaming",
    manualId: "game-session-1",
    title: "Playing Cyberpunk 2077",
    meta: { appId: "cyberpunk2077", mods: ["photorealistic"] },
    leaseMinutes: 15,
  }),
});

// 更新进度（延长租约）
await fetch("/pass/activities?manualId=game-session-1", {
  method: "PUT",
  body: JSON.stringify({
    title: "Playing Cyberpunk 2077 - Level 25",
    leaseMinutes: 15,
  }),
});

// 结束会话
await fetch("/pass/activities?manualId=game-session-1", {
  method: "DELETE",
});
```

### 元数据扩展

```javascript
// 丰富的元数据支持
const activity = {
  type: "Music",
  manualId: "spotify-session",
  title: "Listening to Electronic",
  meta: {
    spotifyTrackId: "1Je1IMUlBXcx1FzbcXRuWw",
    artist: "Purity Ring",
    album: "Shrines",
    duration: 240000, // 毫秒
    custom: { userRating: 5, genre: "Electronic" },
  },
  leaseMinutes: 30,
};
```

## 错误处理

常见错误响应遵循 REST API 约定：

```json
{
  "type": "Microsoft.AspNetCore.Mvc.ValidationProblemDetails",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "leaseMinutes": ["Lease minutes must be between 1 and 60."]
  }
}
```
