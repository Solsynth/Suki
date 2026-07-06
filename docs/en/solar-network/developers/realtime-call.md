---
title: Realtime Call
---

This document describes the Realtime Call API for voice/video calls in DysonNetwork. The implementation uses LiveKit as the underlying real-time communication provider.

## Overview

The Realtime Call API provides the following endpoints:

- Start/end calls
- Join calls with authentication tokens
- Manage call participants (kick, mute)
- Get participant information through periodic polling

**Note:** Webhooks have been replaced by regular GET requests for participant synchronization.

## Base URL

```
/messager/chat/realtime
```

## Authentication

All endpoints require a valid Bearer token in the `Authorization` header.

## Endpoints

### 1. Get Ongoing Call

Gets information about the ongoing call in a chat room.

**Endpoint:** `GET /{roomId:guid}`

**Response:** `SnRealtimeCall`

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

### 2. Join Call

Join an ongoing call and get a LiveKit authentication token.

**Endpoint:** `GET /{roomId:guid}/join`

**Response:** `JoinCallResponse`

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

**Note:** The `isAdmin` field indicates whether the user can kick/mute participants. The following users are admins:

- Chat room owner
- Direct message conversations (both parties are admins)

---

### 3. Get Participants

Gets the current participants in the call. This endpoint syncs participants from LiveKit to the cache.

**Endpoint:** `GET /{roomId:guid}/participants`

**Response:** `List<CallParticipant>`

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

**Usage:** Poll this endpoint periodically (e.g., every 5-10 seconds) to get updated participant lists instead of relying on webhooks.

---

### 4. Start Call

Start a new call in a chat room.

**Endpoint:** `POST /{roomId:guid}`

**Response:** `SnRealtimeCall`

**Errors:**

- `403` - Not a member or timed out
- `423` - Call already in progress

---

### 5. End Call

End an ongoing call.

**Endpoint:** `DELETE /{roomId:guid}`

**Response:** `204 No Content`

---

### 6. Kick Participant

Kick a participant from the call. Optionally ban them from the chat room.

**Endpoint:** `POST /{roomId:guid}/kick/{targetAccountId:guid}`

**Request Body:**

```json
{
  "banDurationMinutes": 30,
  "reason": "Violation of community guidelines"
}
```

| Field                 | Type   | Required | Description                                        |
| -------------------- | ------ | -------- | -------------------------------------------------- |
| `banDurationMinutes` | int    | No       | Duration to ban from chat room (0 or null = no ban) |
| `reason`             | string | No       | Reason for kick/ban                                |

**Response:** `204 No Content`

**Authorization:** Only the chat room owner/admin can kick participants.

**Behavior:**

- Removes the participant from the LiveKit room
- If `banDurationMinutes > 0`, sets `TimeoutUntil` on the member to prevent rejoining

---

### 7. Mute Participant

Mute a participant's audio track.

**Endpoint:** `POST /{roomId:guid}/mute/{targetAccountId:guid}`

**Response:** `204 No Content`

---

### 8. Unmute Participant

Unmute a participant's audio track.

**Endpoint:** `POST /{roomId:guid}/unmute/{targetAccountId:guid}`

**Response:** `204 No Content`

---

## Data Model

### JoinCallResponse

```csharp
public class JoinCallResponse
{
    public string Provider { get; set; }      // e.g., "LiveKit"
    public string Endpoint { get; set; }        // LiveKit WebSocket endpoint
    public string Token { get; set; }          // JWT token for authentication
    public Guid CallId { get; set; }           // Call identifier
    public string RoomName { get; set; }       // LiveKit room name
    public bool IsAdmin { get; set; }          // Whether user can manage participants
    public List<CallParticipant> Participants { get; set; }
}
```

### CallParticipant

```csharp
public class CallParticipant
{
    public string Identity { get; set; }       // LiveKit identity (username)
    public string Name { get; set; }          // Display name
    public Guid? AccountId { get; set; }      // DysonNetwork account ID
    public DateTime JoinedAt { get; set; }     // When participant joined
    public string? TrackSid { get; set; }      // Track SID for muting
    public SnChatMember? Profile { get; set; } // Chat member profile
}
```

### KickParticipantRequest

```csharp
public class KickParticipantRequest
{
    public int? BanDurationMinutes { get; set; }  // Ban duration (minutes)
    public string? Reason { get; set; }           // Reason for kick/ban
}
```

---

## Client Implementation Guide

### Joining a Call

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

### Polling Participants

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

// Poll every 5 seconds
setInterval(async () => {
  const participants = await getParticipants(roomId, authToken);
  updateParticipantList(participants);
}, 5000);
```

### Kicking a Participant

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

### Muting a Participant

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

## Best Practices

1. **Polling Strategy**: Poll `/participants` every 5-10 seconds to get accurate participant lists. Do not rely on webhooks (they are not used).

2. **Token Refresh**: LiveKit tokens expire after 1 hour. Re-fetch the join endpoint to get a new token.

3. **Permission Check**: Only show kick/mute buttons for admin users (`isAdmin: true` in the join response).

4. **Track Handling**: When calling mute/unmute endpoints, use the `trackSid` from the participant data. Note that `trackSid` may be null if the participant has not published any tracks yet.

5. **Error Handling**: Properly handle 403 (unauthorized), 404 (no ongoing call), and network errors.

6. **Reconnection**: Implement reconnection logic - if the call ends (getting participants returns 404), show appropriate UI.

---

## Migration from Webhooks

The previous implementation used LiveKit webhooks for participant updates. This has been replaced by periodic polling:

| Before                    | After                          |
| ------------------------- | ------------------------------ |
| Webhook endpoint receives events | Client polls GET /participants |
| Real-time updates via webhook | Poll every 5-10 seconds        |
| Server-side participant tracking | Client fetches and polls on join |

**Migration Steps:**

1. Remove webhook receiver code
2. Implement polling on the client
3. Call `/participants` when joining a call
4. Set up interval polling for `/participants`

---

## Related Documents

If you need to develop extension features, please refer to the [LiveKit documentation](https://docs.livekit.io)
