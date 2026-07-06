---
title: Post Subscriptions API
---

## Overview

Two subscription models exist:

1. **`SnPostCategorySubscription`** — subscribes to categories, tags, or collections
2. **`SnPostSubscription`** — subscribes to a single post for update notifications

They serve different purposes:
- Category/tag/collection subscriptions notify when a new post matches
- Post subscriptions notify when an existing post receives reactions, forwards, or edits

## Collection Subscriptions

Built on top of the existing `post_category_subscriptions` table with an added `CollectionId` column. A row targets exactly one of: `category_id`, `tag_id`, or `collection_id`.

When a post is published, `PublisherSubscriptionService` checks collections containing that post and notifies subscribers of those collections.

### Endpoints

```
POST /api/publishers/{publisherName}/collections/{slug}/subscribe
POST /api/publishers/{publisherName}/collections/{slug}/unsubscribe
GET  /api/publishers/{publisherName}/collections/{slug}/subscription
```

## Post Subscriptions

### Data Model

`SnPostSubscription` stored in `post_subscriptions`:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| post_id | UUID | Target post |
| account_id | UUID | Subscriber |
| notify_reactions | bool | Notify on new reactions (default: true) |
| notify_forwards | bool | Notify on forwards (default: true) |
| notify_edits | bool | Notify on edits (default: true) |

### Rules

- One active subscription per user per post
- Re-subscribing updates existing row
- User must be able to view the post
- Acting user doesn't receive their own triggered notifications

### Endpoints

```
POST   /api/posts/{id}/subscribe
POST   /api/posts/{id}/unsubscribe
GET    /api/posts/{id}/subscription
GET    /api/posts/subscriptions
```

**Subscribe request body** (all optional, default to `true`):

```json
{
  "reactions": true,
  "forwards": true,
  "edits": true
}
```

**List subscriptions response:**

```json
[
  {
    "subscription": {
      "id": "...",
      "post_id": "...",
      "notify_reactions": true,
      "notify_forwards": false,
      "notify_edits": true
    },
    "post": {
      "id": "...",
      "title": "Subscribed post",
      "publisher": { "id": "...", "name": "..." }
    }
  }
]
```

## Notification Triggers

| Event | Topic |
|-------|-------|
| Reaction added | `posts.subscriptions.reactions` |
| Post forwarded | `posts.subscriptions.forwards` |
| Post edited | `posts.subscriptions.edits` |
