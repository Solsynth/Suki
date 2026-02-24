---
title: 直播开发
---

## 概述

直播功能使用户能够使用 LiveKit 作为实时基础设施创建和广播直播视频流。用户可以：

- 创建带有元数据的直播流
- 通过 RTMP（使用 OBS 或类似软件）进行流媒体传输
- 允许观众通过 WebRTC（Flutter/Web 客户端）加入
- 启用 HLS 播放以实现更广泛的平台兼容性
- 通过 Egress 将流推送到外部平台（YouTube、Bilibili 等）
- 跟踪观看者数量和流统计信息

## 架构

### 组件

1. **LiveKit 基础设施**
   - **Room**：每个直播流会话的 WebRTC 房间
   - **Ingress**：流媒体的 RTMP 输入端点（OBS → LiveKit）
   - **Egress (RTMP)**：到外部平台的 RTMP 输出
   - **Egress (HLS)**：用于播放的 HLS 段生成

2. **Sphere API** (DysonNetwork.Sphere)
   - 用于流管理的 RESTful API
   - 用于 WebRTC 身份验证的令牌生成
   - 通过 Entity Framework 进行数据库持久化

3. **模型**
   - `SnLiveStream`：直播流元数据的数据库模型
   - `LiveStreamStatus`：待处理、活跃、已结束、错误
   - `LiveStreamType`：常规、互动
   - `LiveStreamVisibility`：公开、未列出、私有

## API 端点

**注意：** 所有返回直播流数据的端点直接返回 `SnLiveStream` 数据库对象（不是 DTO），包括相关的 `Publisher` 对象。只有令牌生成等特定端点返回自定义匿名对象。

**安全性：** 敏感字段（`ingress_id`、`ingress_stream_key`、`egress_id`）会自动从公共响应中移除。这些字段仅对在流的发布者上具有编辑者角色的用户可见。`开始流媒体` 端点仅向授权用户返回 RTMP 凭据。

### 流管理

#### 创建直播流

为指定的发布者创建新的直播流。如果未指定发布者，则使用用户的第一个个人发布者。

```http
POST /sphere/livestreams?pub=mypublisher
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "我的精彩直播",
  "description": "直播一些精彩内容",
  "slug": "awesome-stream-2026",
  "thumbnail_id": "file-uuid-here",
  "type": "Regular",
  "visibility": "Public"
}

Response 200 OK:
{
  "id": "uuid",
  "room_name": "livestream_abc123",
  "title": "我的精彩直播",
  "description": "直播一些精彩内容",
  "slug": "awesome-stream-2026",
  "type": "Regular",
  "visibility": "Public",
  "status": "Pending",
  "thumbnail": {
    "id": "file-uuid-here",
    "name": "thumbnail.jpg",
    "url": "https://...",
    "mime_type": "image/jpeg",
    "size": 12345
  },
  "publisher_id": "uuid",
  "publisher": {
    "id": "uuid",
    "name": "mypublisher",
    "nick": "My Publisher",
    "picture": {...}
  },
  "created_at": "2026-02-19T15:00:00Z",
  "updated_at": "2026-02-19T15:00:00Z"
}
```

**查询参数：**

| 参数  | 类型   | 描述                                                       |
| ----- | ------ | ---------------------------------------------------------- |
| `pub` | string | 可选的发布者名称。如果未指定，使用用户的第一个个人发布者。 |

**授权：** 需要身份验证并且至少在一个发布者中拥有成员身份。如果指定了 `pub`，则需要在该发布者上至少具有编辑者角色。

**缩略图：** `thumbnail_id` 应该是来自文件服务的文件 ID。缩略图存储在 jsonb 列中的 `SnCloudFileReferenceObject` 中。

#### 开始流媒体

启动直播流。对于应用内流媒体（无入口），使用 `no_ingress: true`，或者为外部流媒体指定入口类型（RTMP/WHIP）。需要在发布者上具有编辑者角色。

**RTMP 流媒体（OBS）：**

```http
POST /sphere/livestreams/{id}/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "participant_name": "Streamer Name"
}

Response 200 OK:
{
  "url": "rtmp://your-livekit-server.com/live",
  "stream_key": "live_xxx",
  "room_name": "livestream_abc123"
}
```

**WHIP 流媒体（WebRTC 摄取）：**

```http
POST /sphere/livestreams/{id}/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "participant_name": "Streamer Name",
  "use_whip": true,
  "enable_transcoding": false
}

Response 200 OK:
{
  "url": "whip://your-livekit-server.com/live",
  "stream_key": "live_xxx",
  "room_name": "livestream_abc123"
}
```

**应用内流媒体（移动/Web）：**

```http
POST /sphere/livestreams/{id}/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "participant_name": "Streamer Name",
  "no_ingress": true
}

Response 200 OK:
{
  "room_name": "livestream_abc123",
  "url": "wss://your-livekit-server.com"
}
```

**请求字段：**

| 字段                 | 类型    | 描述                                                      |
| -------------------- | ------- | --------------------------------------------------------- |
| `participant_name`   | string  | 流媒体者的可选显示名称                                    |
| `no_ingress`         | boolean | 如果为 `true`，完全跳过入口创建（用于应用内 WebRTC 发布） |
| `use_whip`           | boolean | 如果为 `true`，创建 WHIP 入口而不是 RTMP（默认：false）   |
| `enable_transcoding` | boolean | 为入口启用转码（默认：true，如果不支持则忽略 WHIP）       |

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

**入口类型：**

- **RTMP** (`use_whip: false`)：用于 OBS 或其他 RTMP 编码器的传统 RTMP 入口
- **WHIP** (`use_whip: true`)：用于基于浏览器的流媒体的 WebRTC HTTP 摄取协议
- **无** (`no_ingress: true`)：无入口 - 流媒体者直接通过 WebRTC 发布

**OBS 配置（RTMP）：**

- 服务：自定义
- 服务器：`{url}`
- 流密钥：`{stream_key}`

**WHIP 使用：**

- 使用 `url` 作为 WHIP 端点
- 通常用于基于浏览器的 WebRTC 流媒体

**应用内使用（`no_ingress: true`）：**

1. 通过 `GET /sphere/livestreams/{id}/token?identity=streamer_{userId}` 获取带有流媒体者身份的令牌
2. 使用 LiveKit SDK 连接并发布音频/视频

#### 结束直播流

结束直播流并清理资源。需要在发布者上具有编辑者角色。

```http
POST /sphere/livestreams/{id}/end
Authorization: Bearer {token}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

### 观众端点

#### 列出活跃流

返回带有完整数据库对象的活跃公开直播流列表。

```http
GET /sphere/livestreams?limit=20&offset=0

Response 200 OK:
[
  {
    "id": "uuid",
    "title": "我的精彩直播",
    "description": "直播一些精彩内容",
    "room_name": "livestream_abc123",
    "type": "Regular",
    "visibility": "Public",
    "status": "Active",
    "viewer_count": 150,
    "peak_viewer_count": 200,
    "publisher_id": "uuid",
    "publisher": {
      "id": "uuid",
      "name": "channel",
      "nick": "Channel Name",
      "picture": {...}
    },
    "started_at": "2026-02-19T15:30:00Z",
    "created_at": "2026-02-19T15:00:00Z",
    "updated_at": "2026-02-19T15:00:00Z"
  }
]
```

**授权：** 公开，无需身份验证。

#### 按发布者获取流

返回特定发布者的所有直播流（包括已结束的）。

```http
GET /sphere/livestreams/publisher/{publisherId}?limit=20&offset=0

Response 200 OK:
[
  {
    "id": "uuid",
    "title": "过去的直播",
    "description": "这是一个过去的直播",
    "room_name": "livestream_def456",
    "status": "Ended",
    "viewer_count": 1000,
    "peak_viewer_count": 1500,
    "publisher_id": "uuid",
    "publisher": {...},
    "started_at": "2026-02-18T14:00:00Z",
    "ended_at": "2026-02-18T16:00:00Z",
    "created_at": "2026-02-18T14:00:00Z"
  }
]
```

**授权：** 公开，无需身份验证。

#### 获取流详细信息

返回完整的直播流数据库对象，包括发布者详细信息。

```http
GET /sphere/livestreams/{id}

Response 200 OK:
{
  "id": "uuid",
  "title": "我的精彩直播",
  "description": "直播一些精彩内容",
  "slug": "awesome-stream-2026",
  "room_name": "livestream_abc123",
  "type": "Regular",
  "visibility": "Public",
  "status": "Active",
  "ingress_id": "ingress_xxx",
  "ingress_stream_key": "live_xxx",
  "egress_id": "egress_xxx",
  "viewer_count": 150,
  "peak_viewer_count": 200,
  "publisher_id": "uuid",
  "publisher": {
    "id": "uuid",
    "name": "channel",
    "nick": "Channel Name",
    "picture": {...}
  },
  "thumbnail": {...},
  "metadata": {...},
  "started_at": "2026-02-19T15:30:00Z",
  "ended_at": null,
  "created_at": "2026-02-19T15:00:00Z",
  "updated_at": "2026-02-19T15:00:00Z"
}
```

**授权：** 公开，无需身份验证。

#### 更新直播流

更新直播流的元数据（标题、描述、slug、类型、可见性、元数据）。需要在发布者上具有编辑者角色。

```http
PATCH /sphere/livestreams/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "更新的流标题",
  "description": "更新的描述",
  "slug": "updated-slug-2026",
  "type": "Interactive",
  "visibility": "Unlisted",
  "metadata": {
    "category": "gaming",
    "tags": ["fps", "competitive"]
  }
}

Response 200 OK:
{
  "id": "uuid",
  "title": "更新的流标题",
  "description": "更新的描述",
  "slug": "updated-slug-2026",
  "type": "Interactive",
  "visibility": "Unlisted",
  "metadata": {
    "category": "gaming",
    "tags": ["fps", "competitive"]
  },
  "updated_at": "2026-02-19T16:00:00Z",
  ...
}
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

**注意：** 仅更新提供的字段。省略字段以保持现有值。流活跃时无法更新（先结束流，然后更新）。

#### 删除直播流

永久删除直播流和所有相关资源。如果流是活跃的，将首先停止它。需要在发布者上具有编辑者角色。

```http
DELETE /sphere/livestreams/{id}
Authorization: Bearer {token}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

**警告：** 此操作无法撤销。所有流数据，包括 HLS 段和录制内容，将被永久删除。

#### 加入流（获取令牌）

为加入流生成 LiveKit 令牌。如果用户在发布者上具有编辑者角色，会自动检测用户是否应为流媒体者。

```http
GET /sphere/livestreams/{id}/token?streamer=false
Authorization: Bearer {token} (optional for public streams)

Response 200 OK:
{
  "token": "jwt-token-here",
  "room_name": "livestream_abc123",
  "url": "wss://your-livekit-server.com",
  "isStreamer": false,
  "identity": "username"
}
```

**查询参数：**

| 参数       | 类型    | 默认值 | 描述                                                 |
| ---------- | ------- | ------ | ---------------------------------------------------- |
| `streamer` | boolean | false  | 如果为 true 且用户具有编辑者角色，则授予流媒体者权限 |

**授权：** 公开，可选身份验证。如果经过身份验证且用户在发布者上具有编辑者角色，他们将获得流媒体者权限（可以发布音频/视频）。否则，他们获得观众权限（只能订阅）。

**令牌身份：**

- 已认证用户：`account.Name`（如果 Name 为 null，则为 `user_{accountId}`）
- 匿名用户：`guest_{uuid}`
- 令牌元数据包括：`livestream_id`、`is_streamer`、`account_id`

使用此令牌与 LiveKit Flutter SDK：

```dart
final room = Room();
await room.connect(response.url, response.token);
```

### Egress（外部流媒体）

#### 开始 Egress（推送到外部平台）

开始将直播流推送到外部 RTMP 端点。也可以录制到文件。需要在发布者上具有编辑者角色。

```http
POST /sphere/livestreams/{id}/egress
Authorization: Bearer {token}
Content-Type: application/json

{
  "rtmp_urls": [
    "rtmp://live-push.bilivideo.com/live-bvc/...",
    "rtmp://a.rtmp.youtube.com/live2/..."
  ],
  "file_path": "recordings/stream-2026-02-19.mp4"
}

Response 200 OK:
{
  "egress_id": "EG_xxx"
}
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

#### 停止 Egress

停止 egress（外部流媒体）。需要在发布者上具有编辑者角色。

```http
POST /sphere/livestreams/{id}/egress/stop
Authorization: Bearer {token}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

### HLS Egress（播放支持）

HLS（HTTP 直播流）egress 允许观众使用标准 HLS 播放器（例如 HTML5 视频播放器、VLC、iOS 原生播放器）观看流，而不是 WebRTC。这对于以下情况很有用：

- 更好的跨平台兼容性
- WebRTC 不受支持时的回退
- 录制以供以后播放
- 为大量观众减少服务器负载

#### 开始 HLS Egress

开始从直播流生成 HLS 段和播放列表。需要在发布者上具有编辑者角色。

```http
POST /sphere/livestreams/{id}/hls
Authorization: Bearer {token}
Content-Type: application/json

{
  "playlist_name": "playlist.m3u8",
  "segment_duration": 6,
  "segment_count": 0,
  "layout": "default",
  "hls_base_url": "https://your-cdn.com/hls"
}

Response 200 OK:
{
  "egress_id": "EG_xxx",
  "playlist_url": "https://your-cdn.com/hls/{stream-id}/playlist.m3u8",
  "playlist_name": "playlist.m3u8"
}
```

**请求体字段：**

| 字段               | 类型   | 默认值          | 描述                                              |
| ------------------ | ------ | --------------- | ------------------------------------------------- |
| `playlist_name`    | string | "playlist.m3u8" | HLS 播放列表文件的名称                            |
| `segment_duration` | uint   | 6               | 每个段的持续时间（秒）                            |
| `segment_count`    | int    | 0               | 要保留的段数（0 = 无限制）                        |
| `layout`           | string | "default"       | 视频合成布局                                      |
| `hls_base_url`     | string | Auto            | HLS 播放的基础 URL（默认为 `https://{host}/hls`） |

**授权：** 需要身份验证并且在流的发布者上具有管理员（IsSuperuser）角色。

**注意事项：**

- 每个流只能有一个 HLS egress 处于活跃状态。如果要重新启动，请先调用 stop。
- `playlist_url` 存储在直播流中，并在 GET 响应中返回（对所有观众可见）。
- 段存储在 LiveKit 中配置的 `{filename_prefix}` 位置。

#### 停止 HLS Egress

停止 HLS egress 生成。注意：停止后，HLS 播放列表 URL 会被**保留**，因此观众仍然可以播放录制的内容。

```http
POST /sphere/livestreams/{id}/hls/stop
Authorization: Bearer {token}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

#### HLS 播放

一旦 HLS egress 启动，完整的播放列表 URL 会自动构建并在流响应中可用（从 `HlsPlaylistPath` + `PlaybackUrl` 配置组合）：

```http
GET /sphere/livestreams/{id}

Response 200 OK:
{
  "id": "uuid",
  "title": "我的精彩直播",
  "status": "Active",
  "hls_egress_id": "EG_xxx",
  "hls_playlist_path": "https://your-cdn.com/hls/{stream-id}/playlist.m3u8",
  "hls_started_at": "2026-02-19T15:30:00Z",
  ...
}
```

**HTML5 视频播放器示例：**

```html
<video controls autoplay>
  <source
    src="https://your-cdn.com/hls/{stream-id}/playlist.m3u8"
    type="application/x-mpegURL"
  />
</video>
```

**HLS.js 示例（用于不支持原生 HLS 的浏览器）：**

```javascript
import Hls from "hls.js";

const video = document.getElementById("video");
const hlsUrl = "https://your-cdn.com/hls/{stream-id}/playlist.m3u8";

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
  video.src = hlsUrl;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
}
```

#### 更新缩略图

更新或删除直播流缩略图。需要在发布者上具有编辑者角色。

```http
PATCH /sphere/livestreams/{id}/thumbnail
Authorization: Bearer {token}
Content-Type: application/json

{
  "thumbnail_id": "new-file-uuid-here"
}

Response 200 OK:
{
  "id": "uuid",
  "title": "我的精彩直播",
  "thumbnail": {
    "id": "new-file-uuid-here",
    "name": "new-thumbnail.jpg",
    "url": "https://...",
    "mime_type": "image/jpeg",
    "size": 23456
  },
  "updated_at": "2026-02-19T15:30:00Z"
}
```

要删除缩略图，发送 `null`：

```http
PATCH /sphere/livestreams/{id}/thumbnail
Authorization: Bearer {token}
Content-Type: application/json

{
  "thumbnail_id": null
}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

#### 获取房间详细信息

返回实时房间统计信息，包括参与者数量。

```http
GET /sphere/livestreams/{id}/details

Response 200 OK:
{
  "participant_count": 150,
  "viewer_count": 150,
  "peak_viewer_count": 200
}
```

**授权：** 公开，无需身份验证。

### 帖子集成

帖子可以将直播流作为嵌入附加，类似于投票和基金。

#### 创建带有直播流的帖子

```http
POST /sphere/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "加入我的直播！",
  "content": "我正在直播，快来加入！",
  "live_stream_id": "uuid-of-livestream"
}

Response 200 OK:
{
  "id": "post-uuid",
  "title": "加入我的直播！",
  "metadata": {
    "embeds": [
      {
        "type": "livestream",
        "id": "uuid-of-livestream"
      }
    ]
  }
}
```

#### 更新帖子直播流

```http
PATCH /sphere/posts/{post-id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "live_stream_id": "uuid-of-another-livestream"
}

Response 200 OK
```

要从帖子中移除直播流，为 `live_stream_id` 发送 `null`：

```http
PATCH /sphere/posts/{post-id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "live_stream_id": null
}
```

**要求：**

- 直播流必须存在
- 直播流必须属于与帖子相同的发布者
- 只有发布者所有者/编辑者可以附加他们的直播流

### 订阅

#### 获取订阅发布者的直播流

返回当前用户订阅的发布者的完整直播流对象。

```http
GET /sphere/publishers/subscriptions/live
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": "uuid",
    "title": "来自订阅发布者的直播",
    "description": "正在直播！",
    "room_name": "livestream_xyz789",
    "type": "Regular",
    "visibility": "Public",
    "status": "Active",
    "viewer_count": 500,
    "peak_viewer_count": 600,
    "publisher_id": "uuid",
    "publisher": {
      "id": "uuid",
      "name": "channel",
      "nick": "Channel Name",
      "picture": {...}
    },
    "started_at": "2026-02-19T15:30:00Z",
    "created_at": "2026-02-19T15:00:00Z",
    "updated_at": "2026-02-19T15:00:00Z"
  }
]
```

**授权：** 需要身份验证。

### 直播聊天

直播聊天允许观众发送消息，这些消息通过 LiveKit 数据包实时广播给所有参与者，并存储在数据库中以供历史记录。

#### 获取聊天消息

返回直播流的聊天消息历史记录。

```http
GET /sphere/livestreams/{id}/chat?limit=50&offset=0
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": "uuid",
    "live_stream_id": "uuid",
    "sender_id": "uuid",
    "sender_name": "User123",
    "content": "大家好！",
    "created_at": "2026-02-19T15:35:00Z",
    "deleted_at": null,
    "timeout_until": null,
    "sender": {
      "id": "uuid",
      "name": "username",
      "nick": "Display Name",
      "picture": {...}
    }
  }
]
```

**注意：** `sender` 字段包含预加载的账户数据（未存储在 DB 中）。

**授权：** 需要身份验证。

#### 发送聊天消息

向直播流发送聊天消息。消息保存到数据库并通过 LiveKit 广播给所有参与者。

```http
POST /sphere/livestreams/{id}/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "大家好！"
}

Response 200 OK:
{
  "id": "uuid",
  "live_stream_id": "uuid",
  "sender_id": "uuid",
  "sender_name": "User123",
  "content": "大家好！",
  "created_at": "2026-02-19T15:35:00Z",
  "deleted_at": null,
  "timeout_until": null
}
```

**授权：** 需要身份验证。流必须是活跃的。

**实时广播：** 发送消息时，它也会通过 LiveKit 数据包广播给所有连接的参与者。客户端应监听传入的数据消息以显示实时聊天。

**客户端处理（Flutter 示例）：**

```dart
room.onDataReceived = (data) {
  final message = jsonDecode(utf8.decode(data));
  if (message['senderId'] != null) {
    // 收到聊天消息
    addToChatList(ChatMessage(
      id: message['id'],
      senderId: message['senderId'],
      senderName: message['senderName'],
      content: message['content'],
      createdAt: DateTime.parse(message['createdAt']),
    ));
  } else if (message['type'] == 'timeout') {
    // 用户被禁言
    showMessage('您已被禁言 ${message['durationMinutes']} 分钟');
  }
};
```

#### 删除聊天消息

删除聊天消息（软删除）。需要在发布者上具有编辑者角色。

```http
DELETE /sphere/livestreams/{id}/chat/{messageId}
Authorization: Bearer {token}

Response 200 OK
```

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

#### 禁言用户

暂时阻止用户发送聊天消息。需要在发布者上具有编辑者角色。

```http
POST /sphere/livestreams/{id}/chat/{messageId}/timeout
Authorization: Bearer {token}
Content-Type: application/json

{
  "duration_minutes": 10
}

Response 200 OK
```

**请求字段：**

| 字段               | 类型    | 默认值 | 描述                 |
| ------------------ | ------- | ------ | -------------------- |
| `duration_minutes` | integer | 10     | 禁言持续时间（分钟） |

**授权：** 需要身份验证并且在流的发布者上具有编辑者角色。

**广播：** 当用户被禁言时，禁言通知会广播给所有参与者。

### 实时流更新

直播事件（开始、结束、更新）通过 LiveKit 数据包广播给所有连接的参与者。客户端应监听这些事件以实时更新 UI。

#### 事件类型

| 事件             | 描述                         |
| ---------------- | ---------------------------- |
| `stream_started` | 流已开始                     |
| `stream_ended`   | 流已结束                     |
| `stream_updated` | 流元数据（标题、描述）已更新 |

#### 客户端处理（Flutter 示例）

```dart
room.onDataReceived = (data) {
  final payload = jsonDecode(utf8.decode(data));

  switch (payload['type']) {
    case 'stream_started':
      showNotification('${payload['title']} 现在正在直播！');
      break;
    case 'stream_ended':
      showNotification('直播已结束');
      break;
    case 'stream_updated':
      updateStreamInfo(
        title: payload['title'],
        description: payload['description'],
      );
      break;
    case 'chat_message':
      // 处理聊天消息（参见聊天部分）
      break;
    case 'timeout':
      // 处理禁言（参见聊天部分）
      break;
  }
};
```

#### 事件载荷

**stream_started：**

```json
{
  "type": "stream_started",
  "livestream_id": "uuid",
  "title": "Stream Title",
  "started_at": "2026-02-19T15:30:00Z"
}
```

**stream_ended：**

```json
{
  "type": "stream_ended",
  "livestream_id": "uuid",
  "ended_at": "2026-02-19T16:00:00Z"
}
```

**stream_updated：**

```json
{
  "type": "stream_updated",
  "livestream_id": "uuid",
  "title": "New Title",
  "description": "New description"
}
```

### 直播打赏

观众可以为直播流打赏积分以示支持。打赏有助于流在发现中的排名。

**打赏分配：** 当直播流结束时，90% 的总正向打赏分配给主播的钱包。负向打赏不计入分配。

#### 获取打赏

返回直播流的打赏历史记录。

```http
GET /sphere/livestreams/{id}/awards?limit=20&offset=0
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": "uuid",
    "amount": 100.00,
    "attitude": "Positive",
    "message": "精彩直播！",
    "live_stream_id": "uuid",
    "account_id": "uuid",
    "created_at": "2026-02-19T15:35:00Z"
  }
]
```

**授权：** 公开，无需身份验证。

#### 打赏直播流

打赏直播流（创建支付订单）。

```http
POST /sphere/livestreams/{id}/awards
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "attitude": "Positive",
  "message": "精彩直播！"
}

Response 200 OK:
{
  "order_id": "uuid"
}
```

**请求字段：**

| 字段      | 类型    | 描述           |
| --------- | ------- | -------------- |
| `amount`  | decimal | 要打赏的积分数 |
| `message` | string  | 可选消息       |

**授权：** 需要身份验证。

**发现排名：** 直播流按 `(TotalAwardScore * 10) + ViewerCount` 排名，因此获得打赏的流在发现中排名更高。

**实时通知：** 当直播流收到打赏时，所有参与者通过 LiveKit 数据包接收 `stream_awarded` 事件。

#### 获取打赏排行榜

返回直播流的顶级贡献者。

```http
GET /sphere/livestreams/{id}/awards/leaderboard?limit=10
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "rank": 1,
    "account_id": "uuid",
    "sender_name": "TopFan",
    "total_amount": 500.00,
    "award_count": 5,
    "account": {
      "id": "uuid",
      "name": "username",
      "nick": "Display Name",
      "picture": {...}
    }
  }
]
```

**授权：** 公开，无需身份验证。

**发现排名：** 直播流按 `(TotalAwardScore * 10) + ViewerCount` 排名，因此获得打赏的流在发现中排名更高。

**实时通知：** 当直播流收到打赏时，所有参与者通过 LiveKit 数据包接收 `stream_awarded` 事件。

#### 获取活跃打赏

返回直播流的活跃打赏及其剩余高亮持续时间。当主播高亮打赏时，打赏变为活跃状态（1 积分 = 2 秒高亮时间）。

```http
GET /sphere/livestreams/{id}/awards/active
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": "uuid",
    "amount": 100.00,
    "attitude": "Positive",
    "message": "精彩直播！",
    "live_stream_id": "uuid",
    "account_id": "uuid",
    "sender_name": "FanUser",
    "created_at": "2026-02-19T15:35:00Z",
    "highlight_duration_seconds": 200,
    "highlight_started_at": "2026-02-19T15:40:00Z",
    "highlight_ends_at": "2026-02-19T15:43:20Z",
    "account": {
      "id": "uuid",
      "name": "username",
      "nick": "Display Name",
      "picture": {...}
    }
  }
]
```

**注意：** `highlight_duration_seconds` 在高亮时计算（金额 × 2 秒），不存储在 DB 中。`highlight_ends_at` 从 `highlight_started_at` + 持续时间计算。

**授权：** 公开，无需身份验证。

## 使用流程

### 对于主播

**RTMP 流媒体（OBS）：**

1. **创建流** → `POST /sphere/livestreams`
2. **开始流媒体** → `POST /sphere/livestreams/{id}/start`（返回 RTMP URL）
3. **配置 OBS** → 设置 RTMP URL 和流密钥
4. **开始直播** → 在 OBS 中开始流媒体
5. **可选：开始 HLS Egress** → 为观众启用 HLS 播放
6. **可选：开始 RTMP Egress** → 推送到 YouTube/Bilibili
7. **结束流** → `POST /sphere/livestreams/{id}/end`

**应用内流媒体（移动/Web）：**

1. **创建流** → `POST /sphere/livestreams`
2. **开始流媒体** → `POST /sphere/livestreams/{id}/start` 并设置 `{"no_ingress": true}`
3. **获取令牌** → `GET /sphere/livestreams/{id}/token?identity=streamer_{userId}`
4. **连接并发布** → 使用 LiveKit SDK 广播
5. **可选：开始 HLS Egress** → 为观众启用 HLS 播放
6. **结束流** → `POST /sphere/livestreams/{id}/end`

**HLS 播放流程：**

1. **开始 HLS Egress** → `POST /sphere/livestreams/{id}/hls`
2. **获取播放列表 URL** → 在响应中返回或 `GET /sphere/livestreams/{id}`
3. **分发 URL** → 与观众分享以进行 HLS 播放
4. **停止 HLS** → `POST /sphere/livestreams/{id}/hls/stop`（流结束后 URL 被保留以供播放）

### 对于观众

1. **浏览流** → `GET /sphere/livestreams`
2. **获取令牌** → `GET /sphere/livestreams/{id}/token`
3. **连接** → 使用 LiveKit Flutter/Web SDK 和令牌
4. **订阅** → 监听轨道并渲染视频

## 安全考虑

1. **授权**：使用基于角色的权限：
   - **创建**：需要在任何发布者中拥有成员身份
   - **管理**（开始、停止）：需要在流的发布者中具有 `Editor` 角色
   - **Egress / HLS**：需要 `Editor` 角色 **AND** 账户上的 `IsSuperuser`（管理员）
   - **聊天**（发送/读取）：需要身份验证且流必须是活跃的
   - **聊天**（删除/禁言）：需要在流的发布者上具有 `Editor` 角色
2. **令牌过期**：生成的令牌默认在 4 小时后过期
3. **可见性**：
   - `Public`：任何人都可以查看和加入
   - `Unlisted`：只能通过直接链接访问
   - `Private`：只有授权观看者
4. **流媒体者检测**：如果用户在发布者上具有编辑者角色，会自动授予流媒体者权限

## 故障排除

### 流未出现在列表中

- 检查 `Status` 是否为 `Active`（不是 `Pending`）
- 验证 OBS 是否已连接并正在流媒体
- 检查 LiveKit 服务器日志以了解入口问题

### 无法更新流

- 流必须处于 `Pending` 或 `Ended` 状态才能更新元数据
- 如果流是 `Active`，必须先结束它：`POST /sphere/livestreams/{id}/end`
- 然后更新：`PATCH /sphere/livestreams/{id}`
- 验证您在发布者上具有编辑者角色

### 删除失败

- 验证您在发布者上具有编辑者角色
- 检查 LiveKit 服务器是否可访问（需要清理资源）
- 如果 LiveKit 已关闭，您可能需要手动清理数据库

### 令牌过期

- 通过 `GET /sphere/livestreams/{id}/token` 重新获取令牌
- 令牌有效期为 4 小时

### Egress 失败

- 确保 egress 服务正在运行
- 验证 RTMP URL 是否有效
- 检查 Redis 连接性（egress 所需）

### HLS 播放问题

- **播放列表无法访问**：确保 `hls_base_url` 可公开访问或配置 CDN
- **段 404**：验证 LiveKit egress 对存储位置有写入权限
- **缓冲/延迟**：增加 `segment_duration` 以获得更稳定的播放（权衡：更高延迟）
- **旧段未删除**：设置 `segment_count` 以限制存储使用（例如 20 个段约 2 分钟历史）

### HLS Egress 已活跃

如果您收到 "HLS egress is already active for this stream"：

1. 停止现有的 HLS egress：`POST /sphere/livestreams/{id}/hls/stop`
2. 等待几秒钟进行清理
3. 再次开始：`POST /sphere/livestreams/{id}/hls`

## 相关文件

如果你想要开发直播房间内的扩展，请参考 [LiveKit 文档](https://docs.livekit.io)

