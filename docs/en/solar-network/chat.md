---
title: Chat Features
description: Organize chat rooms, pin messages, and use reactions
---

## Chat Groups

Chat Groups let you organize your chat rooms into custom folders or categories for easier navigation.

### Overview

- Groups are per-user — you can organize the same room differently from other users
- Each chat room can belong to at most one group at a time
- Groups support custom names, colors, icons, and sort order

### Creating a Group

1. Go to your chat settings
2. Create a new group with a name, color, and icon
3. Assign chat rooms to the group

### Managing Groups

- Edit group name, color, or icon at any time
- Add or remove rooms from a group
- Reorder groups for your preferred display
- Delete a group (rooms are not deleted, just ungrouped)

---

## Chat Pins

Chat Pins allow room administrators to pin important messages for everyone to see.

### Permissions

| Room Type | Who Can Pin |
|-----------|-------------|
| Group (non-realm) | Room owner |
| Group (realm-linked) | Realm moderator or above |
| Direct Message | Any member |

### Pinning a Message

1. Select a message in the chat room
2. Choose to pin it
3. Optionally set an expiry time

### Features

- Multiple messages can be pinned simultaneously
- Pins can be permanent or time-limited
- Pin events are broadcast to all room members via WebSocket
- Pinned messages are displayed in a dedicated pins panel
- Unpin a message at any time (same permissions required)
