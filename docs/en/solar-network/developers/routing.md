---
title: Routing and Gateway
description: Learn how Solar Network API routing works
---

As you may know, Solar Network's server is a microservices project, so you need to pay attention to path specification when accessing APIs.

The basic structure is `<BaseURL>/<ServiceID>/<Path>`

For example, to access the notification API of the push service (DysonNetwork.Ring):

```bash
export BASE_URL="https://api.solian.app"
export SERVICE_ID="ring"
export PATH="/notifications"
echo $BASE_URL/$SERVICE_ID$PATH
# https://api.solian.app/ring/notifications
```

## Service Responsibilities

Currently, Solar Network's server side has several services, each with its own responsibilities:

- Pass: Handles authentication (access via `id`)
- Ring: Handles push notifications
- Sphere: Handles chat, posts, and realm-related features
- Develop: Handles developer-related features
- Drive (DysonFS): Handles file uploads and storage
- Personality (PersonalityCore): Handles AI agents and intelligence

The service ID for each service is its lowercase name (without the `DysonNetwork.` prefix). Note: PersonalityCore is accessed via `/personality` directly, not `/api/personality`.

## WebSocket

WebSocket is handled by the push service, but is not accessed using the `/ring` service ID. The gateway handles `/ws` requests directly.

WebSocket messages use the `WebSocketPacket` structure:

```json
{
    "type": "packet type",
    "data": "packet data, may be any structure or type",
    "endpoint": "the service this packet targets; not present in server-sent packets; if the client needs to send a packet to the server, fill this with the corresponding service ID to help the gateway forward the packet",
    "error_message": "error message in server-returned packets"
}
}
```

When accessing the WebSocket gateway, there are two authorization methods: the common `Authorization` header. However, since browsers cannot set request headers for WebSocket, a compatibility alternative is provided: place the access token in the `?tk=` query parameter.
