---
title: Chat Sync & Messaging
---

Chat messages are handled by the `DysonNetwork.Messager` service. When accessing via the gateway, replace `/api` with `/messager/chat`.

## Architecture Overview

Real-time delivery flows through WebSocket. Sync endpoints exist for offline-first recovery:

```
Client <-- WebSocket (Ring) --> Messager (real-time messages)
Client <-- HTTP POST --> Messager (sync / missing message recovery)
```

All WebSocket packets are sent through the Ring WebSocket gateway with `endpoint = "DysonNetwork.Messager"`.

## WebSocket Packets

### Outbound (Client → Server)

| Type | Purpose | Response |
|------|---------|----------|
| `messages.send` | Send a chat message | `messages.delivered` (ack) + `messages.new` (broadcast) |
| `messages.typing` | Typing/speaking/uploading indicator | Broadcast to room |

### Inbound (Server → Client)

| Type | Payload |
|------|---------|
| `messages.new` | New chat message |
| `messages.update` | Edited message |
| `messages.delete` | Deleted message |
| `messages.delivered` | Send confirmation (full persisted `SnChatMessage`) |
| `messages.typing` | Typing indicator |
| `messages.reaction.added` | Reaction added |
| `messages.reaction.removed` | Reaction removed |

### WebSocket Packet Structure

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

## Chat Reactions

### Default Reaction Symbols

| Symbol | Description |
|--------|-------------|
| `thumb_up` | Thumbs up |
| `thumb_down` | Thumbs down |
| `just_okay` | Just okay |
| `cry` | Crying face |
| `confuse` | Confused face |
| `clap` | Clapping hands |
| `laugh` | Laughing face |
| `angry` | Angry face |
| `party` | Party/celebration |
| `pray` | Praying hands |
| `heart` | Heart/like |

Custom reaction symbols require an active subscription.

### Endpoints

#### List Reactions

```
GET /messager/chat/{roomId}/messages/{messageId}/reactions
```

Query params: `symbol` (filter), `offset`, `take`, `order` (use `created` for newest-first). Returns `SnChatReaction` objects with `X-Total` header.

#### Add or Toggle Reaction

```
POST /messager/chat/{roomId}/messages/{messageId}/reactions
```

**Request:**

```json
{
  "symbol": "heart",
  "attitude": 0
}
```

`attitude`: `0` = Positive, `1` = Neutral, `2` = Negative.

**Toggle behavior:** If the user already added the same symbol, calling this endpoint **removes** the reaction (returns `204 No Content`).

#### Remove Reaction

```
DELETE /messager/chat/{roomId}/messages/{messageId}/reactions/{symbol}
```

Returns `204 No Content`.

### Real-time Sync

Added reactions broadcast `messages.reaction.added`, removals broadcast `messages.reaction.removed`. Both include the updated `reactions_count` snapshot in `meta`.

**Reaction added payload:**

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

**Reaction removed payload:**

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

### Persistence Model

- `chat_reactions` table: source of truth for individual user reactions
- `chat_messages.reactions_count`: JSONB summary cache on the message row (e.g. `{"heart": 3, "thumb_up": 1}`)
- Add/remove operations update both in the same write flow
- Messages also expose `reactions_made` (per-requesting-user dict of symbols the current user has reacted with)

### Sync Integration

Reaction changes are stored as sync messages in the room. When syncing via the global sync endpoint, reaction changes are delivered as `messages.reaction.added` / `messages.reaction.removed` message types. The `meta.reactions_count` already includes the updated snapshot — no second enrichment pass needed.

Recommended client behavior:
- Use `meta.message_id` to locate the target message
- Replace local `reactions_count` with `meta.reactions_count`
- Apply user-specific toggles from refreshed message payloads

## Room Sequence Sync

Each message gets a monotonic `room_sequence` (int64) within its room. This enables gap detection and recovery:

```
Received: [1000, 1001, 1003]
Missing:  [1002] → request recovery
```

- `room_sequence` is assigned by the backend at persistence time
- Unique per room (not cross-room)
- Used for gap detection, not as a global ordering
- Old messages are backfilled with `ROW_NUMBER()` based on `created_at`

## Sync Endpoints

### 1. Room List Sync

Sync the user's joined room list (not messages).

```
POST /messager/chat/rooms/sync
```

**Request:**

```json
{ "last_sync_timestamp": 1706745600000 }
```

Use `0` for first sync. Store `current_timestamp` from the response for the next request.

**Response:**

| Field | Description |
|-------|-------------|
| `changes` | Room list changes: `joined`, `updated`, `removed` |
| `summaries` | Unread count + last message per affected room |
| `current_timestamp` | Save for next sync |
| `total_count` | Number of changes |

Each `change` includes the hydrated `SnChatRoom` and the current user's `SnChatMember`. Limit: 500 changes per request.

### 2. Message Sync (Per-Room)

Sync messages within a specific room. Supports both timestamp and sequence-based recovery.

```
POST /messager/chat/{roomId}/sync
```

**Timestamp mode** (normal incremental sync):

```json
{ "last_sync_timestamp": 1706745600000 }
```

**Sequence recovery mode** (gap filling):

```json
{
  "last_sync_timestamp": 1706745600000,
  "missing_sequences": [1002, 1005],
  "missing_sequence_ranges": [
    { "start_sequence": 2000, "end_sequence": 2050 }
  ]
}
```

When sequences or ranges are provided, the server switches to exact-gap recovery. Ranges are normalized and merged server-side.

**Response:**

| Field | Description |
|-------|-------------|
| `messages` | Matching messages ordered by `room_sequence` ASC |
| `current_timestamp` | Latest timestamp in results |
| `total_count` | Count before limit |

### 3. Global Sync

Sync messages across all rooms (timestamp-based only).

```
POST /messager/chat/sync
```

**Request:**

```json
{ "last_sync_timestamp": 1706745600000 }
```

**Response:**

| Field | Description |
|-------|-------------|
| `messages` | Messages from all rooms, sorted by `created_at` ASC |
| `current_timestamp` | Save for next sync |
| `total_count` | Number of messages |

Limit: 500 messages per room. E2EE messages are returned encrypted for client-side decryption.

## Recommended Client Flow

```
1. Connect WebSocket → receive real-time messages
2. Store room_sequence per message per room
3. On WebSocket disconnect:
   a. Reconnect WebSocket
   b. Call room list sync → get joined/updated/removed rooms
   c. Call global sync → catch missed messages across rooms
   d. Detect sequence gaps per room
   e. Call room sync with missing_sequences → fill gaps
4. On WebSocket messages arriving:
   a. Check for gaps in room_sequence
   b. If gap detected → call room sync with missing_sequences/ranges
```

## Typing Indicators

Send transient activity status:

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

Activity types: `typing`, `speaking`, `uploading`. Broadcast to all room members except sender.

## Message Redirect

Copy a section of chat history into another room:

```
POST /api/chat/{roomId}/messages/redirect
```

```json
{
  "message_ids": ["msg-id-1", "msg-id-2"]
}
```

- All messages must come from the same source room
- Server rebuilds transcript in chronological order
- Currently text messages only

## System Messages

Backend-generated events delivered as `messages.new` packets:

| Type | Purpose |
|------|---------|
| `system.member.joined` | Member joined room |
| `system.member.left` | Member left/removed |
| `system.chat.updated` | Room settings changed |
| `system.e2ee.enabled` | MLS encryption enabled |
| `system.mls.epoch_changed` | MLS epoch advanced |
| `system.mls.reshare_required` | MLS re-share needed |
| `system.call.member.joined` | Call participant joined |
| `system.call.member.left` | Call participant left |

## Encryption (MLS Hard-Cut)

Encrypted rooms use MLS (Message Layer Security) exclusively:

- Encryption modes: `None (0)` or `E2eeMls (3)`
- Enable: `POST /api/chat/{id}/mls/enable` (one-way, cannot disable)
- Writing to MLS rooms requires header: `X-Client-Ability: chat.mls.v2`
- Encrypted messages carry: `ciphertext`, `encryption_epoch`, `encryption_scheme: "chat.mls.v2"`
- Unencrypted file attachments are still allowed in encrypted messages
- Push notifications show generic text: "Encrypted message"
