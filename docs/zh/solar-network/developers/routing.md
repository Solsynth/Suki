---
title: 路由及网关
description: 了解 Solar Network API 路由的方式
---

众所周知，Solar Network 的服务器是一个微服务项目，所以在访问 API 的时候，您需要注意路径的指定。

其构造基本为 `<BaseURL>/<ServiceID>/<Path>`

例如，你需要访问推送服务 (DysonNetwork.Ring) 的通知 API。

```bash
export BASE_URL="https://api.solian.app"
export SERVICE_ID="ring"
export PATH="/notifications"
echo $BASE_URL/$SERVICE_ID$PATH
# https://api.solian.app/ring/notifications
```

## 服务分工

目前来说，Solar Network 服务端有四个各司其职的服务。

- Pass 负责身份验证（使用 `id` 访问）
- Ring 负责推送和通知
- Sphere 负责聊天和帖子以及领域相关的功能
- Develop 负责开发者相关功能
- Drive 负责文件上传

其各服务的服务 ID 即为小写服务名（不包含 DysonNetwork. 前缀）

## WebSocket

WebSocket 由推送服务负责，但是不使用 `/ring` 服务 ID 访问，网关直接处理 `/ws` 的请求。

WebSocket 的消息都会使用 WebSocketPacket 结构，其结构如下：

```json
{
    "type": "包类型",
    "data": "包数据，可能为任何结构、类型",
    "endpoint": "包需要请求的服务，在服务器传来的包不会携带此项；若客户端需要向服务器发送数据包，需要将此项填写为对应服务的 ID 以帮助网关转发此包",
    "error_message": "服务器回传包的错误信息"
}
```

在访问 WebSocket 网关的时候，有两种授权方式，一种是通用的 `Authorization` 头。但是由于浏览器无法给 WebSocket 设置请求头，从而提供另一种兼容性选择，将访问令牌放置于 `?tk=` 查询参数中。
