---
title: SOP Push
description: Solar Network's native push notification system
---

SOP (Solar Network Push) is the platform's native notification delivery system. Unlike third-party push services (APNs, FCM), SOP doesn't require external push tokens — it works directly with your authenticated session.

## How SOP Works

1. **Authenticate** with your normal Solar Network session
2. **Register** SOP for your device/session
3. **Fetch** notification history for initial sync
4. **Stream** real-time notifications via SSE (Server-Sent Events)
5. **Re-sync** on disconnect

## Why Use SOP

- No third-party push token required
- Works on any platform with an HTTP client
- Account-scoped notification listing as source of truth
- Real-time delivery via SSE stream

## Key Behaviors

- SOP has device-aware deduplication — if SOP is active, other real-time paths may not duplicate events
- The list API is the source of truth for missed notifications
- SSE is the live-update channel
- Always reconnect and re-sync after disconnection
