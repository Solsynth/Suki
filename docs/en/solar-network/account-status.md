---
title: Account Status and Online Presence
description: Learn how to manage your online status, customize your personal settings, and view the status of others.
---

# Account Status and Online Presence

Learn how to manage your online status, customize your personal settings, and view the status of others.

## Online Status Types

Solar Network offers four online statuses that you can switch between freely based on your needs:

| Status Type | Value | Description | What Others See |
|-------------|-------|-------------|-----------------|
| Normal | 0 | Normal visible status | Displays "Online" |
| Busy | 1 | Visible busy status | Displays "Busy" |
| Do Not Disturb | 2 | Visible DND status | Displays "Do Not Disturb" |
| Invisible | 3 | Completely hidden status | Displays "Offline" |

### Status Details

- **Normal**: Your default status; others can see that you are online as usual.
- **Busy**: Indicates you are occupied with other things and prefer not to be disturbed.
- **Do Not Disturb**: When enabled, push notifications will be disabled.
- **Invisible**: Completely hides your online status; others will see you as offline.

!!! tip

    If you set your status to "Invisible", others will see "Offline" when viewing your profile, with no way of knowing you are actually online.

## Setting Your Status

### Where to Set
Go to **Account** > Click **Status**.

### Configurable Fields

| Field | Description | Limit |
|-------|-------------|-------|
| Status Type | Select your online status | Required |
| Status Label | Custom status text | Max 1024 characters |
| Icon | Status icon | Max 128 characters |
| Clear After | Time to automatically clear the status | Optional |

### Auto Clear

You can set your status to automatically clear at a specific time. For example:

- Set to "Busy" during a meeting, and automatically revert to "Normal" after 1 hour.
- Set to "Do Not Disturb" while resting, and automatically revert after work hours.

## Status Sentiment

In addition to your online status, you can set a "Status Sentiment" to express your current mood:

| Sentiment Type | Description |
|----------------|-------------|
| Positive | Indicates a positive and upbeat mood |
| Neutral | Indicates a general or neutral mood |
| Negative | Indicates a negative or down mood |

Your status sentiment will be displayed in your activity calendar.

## Online Members in Chat Rooms

In chat rooms, you can view the members who are currently online.

### Group Chat Rooms

In group chat rooms, you can see:

- The number of online users
- A list of nicknames of online members
- Detailed information of online members (click to view)

### Direct Messages (DM)

In private messages, you can see:

- The other party's online status
- Their specific status message (e.g., "In a meeting")
- Their online/offline status

## Online Status FAQ

### Why is my status displaying incorrectly?

Status display might have a slight delay because the system caches your status information. If you just changed your status, please wait a moment before checking.

### Why do others see me as offline when I'm actually online?

This could be because you have set your status to "Invisible". In this case, your online status is hidden from other users.

Alternatively, the client's WebSocket connection might have been disconnected, failing to accurately report your online status to the server.

### Can I set multiple statuses at the same time?

No. You can only have one current status at a time. However, you can set a "Clear After" time to let the status automatically revert to the default after a specified period.
