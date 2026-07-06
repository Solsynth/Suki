---
title: Chat Reactions API
---

## Data Model

- `chat_reactions` table: source of truth for individual user reactions
- `chat_messages.reactions_count`: JSONB summary cache on the message row (e.g. `{"heart": 3, "thumb_up": 1}`)
- Add/remove operations update both in the same write flow

### Message Fields

| Field | Type | Description |
|-------|------|-------------|
| reactions_count | dict | Symbol → count mapping |
| reactions_made | dict? | Symbols the current user has reacted with (only with user context) |

## Endpoints

All endpoints prefixed with `/messager/chat` (gateway) or `/api/chat` (local).

### List Reactions

```
GET /messager/chat/{roomId}/messages/{messageId}/reactions
```

| Param | Description |
|-------|-------------|
| symbol | Filter to a single reaction symbol |
| offset | Pagination offset (default: 0) |
| take | Page size (default: 20) |
| order | `created` for newest-first; otherwise sorted by symbol then newest-first |

Returns `SnChatReaction` objects with hydrated `sender`. `X-Total` header contains total count.

Auth optional for public unencrypted rooms. Required for private/encrypted rooms.

### Add or Toggle Reaction

```
POST /messager/chat/{roomId}/messages/{messageId}/reactions
```

```json
{
  "symbol": "heart",
  "attitude": 0
}
```

`attitude`: `0` = Positive, `1` = Neutral, `2` = Negative.

**Toggle behavior:** if the user already added the same symbol, this **removes** the reaction and returns `204 No Content`.

Custom symbols require an active subscription (returns `400` otherwise).

### Remove Reaction

```
DELETE /messager/chat/{roomId}/messages/{messageId}/reactions/{symbol}
```

Returns `204 No Content`.

## WebSocket Events

### Reaction Added

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

### Reaction Removed

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

## Sync Integration

Reaction changes are stored as sync messages in the room. When syncing via the global sync endpoint (`POST /messager/chat/sync`), reaction changes are delivered as `messages.reaction.added` / `messages.reaction.removed` message types.

The `meta.reactions_count` already includes the updated snapshot — no second enrichment pass needed.

### Recommended Client Behavior

- Use `meta.message_id` to locate the target message
- Replace local `reactions_count` with `meta.reactions_count` from the sync payload
- Apply user-specific toggles from refreshed message payloads as needed
