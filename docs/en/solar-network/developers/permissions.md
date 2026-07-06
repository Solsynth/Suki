---
title: Permission System
---

Solar Network uses a fine-grained, attribute-based permission model. Every mutating endpoint declares one or more `[AskPermission("key")]` attributes, and the middleware checks the actor's permission nodes before allowing the request.

## Architecture

```
Client request
  → [Authorize] (authentication)
  → AskPermissionMiddleware (authorization)
    → OAuth scope gate (if OAuth session)
    → Superuser bypass
    → Permission node lookup (gRPC or local DB)
  → Controller action
```

Two middleware implementations exist:

| Middleware | Used by | Backend |
|---|---|---|
| `RemotePermissionMiddleware` | Sphere, Passport, Messager, Develop, Wallet, Ring | gRPC `PermissionService` |
| `LocalPermissionMiddleware` | Padlock | Direct EF Core query |

Both enforce the same logic: iterate all `[AskPermission]` attributes, check each key against the actor's permission nodes, return 403 on first failure.

## Permission Keys

Convention: `{domain}.{resource}.{action}`

Examples:
- `posts.create`
- `chat.messages.delete`
- `wallets.balance.modify`

### Full list

| Domain | Keys |
|--------|------|
| Accounts | `accounts.view`, `accounts.manage`, `accounts.delete`, `accounts.statuses.create`, `accounts.statuses.update`, `accounts.connections.view` |
| Auth & Security | `auth.sessions.manage`, `auth.factors.manage`, `auth.api.keys.manage`, `auth.apps.authorize`, `auth.recover` |
| Account | `account.contacts.manage`, `account.devices.manage`, `account.authorized.apps.manage` |
| Chat | `chat.create`, `chat.update`, `chat.delete`, `chat.messages.create`, `chat.messages.update`, `chat.messages.delete`, `chat.messages.react`, `chat.members.manage`, `chat.members.kick`, `chat.members.timeout`, `chat.invites.manage`, `chat.e2ee.manage`, `chat.groups.manage`, `chat.pins.manage`, `chat.read.all`, `chat.sync`, `chat.call.start`, `chat.call.end`, `chat.call.invite`, `chat.call.kick`, `chat.call.mute` |
| Posts | `posts.view`, `posts.create`, `posts.update`, `posts.delete`, `posts.publish`, `posts.react`, `posts.boost`, `posts.moderate`, `posts.lock`, `posts.bookmark`, `posts.award`, `posts.sponsor`, `posts.pin`, `posts.batch.delete`, `posts.batch.visibility` |
| Collections | `post.collections.create`, `post.collections.update`, `post.collections.delete`, `post.collections.posts.manage` |
| Categories & Tags | `post.categories.manage`, `post.categories.subscribe`, `posts.tags.create`, `posts.tags.update`, `posts.tags.assign`, `posts.tags.claim`, `posts.tags.protect`, `posts.tags.event` |
| Subscriptions | `post.subscriptions.manage` |
| Publishers | `publishers.create`, `publishers.update`, `publishers.delete`, `publishers.members.manage`, `publishers.invites.manage`, `publishers.features.manage`, `publishers.fediverse.manage`, `publishers.domains.manage`, `publishers.rewards.settle`, `publishers.rewards.resettle`, `publishers.subscriptions.manage` |
| Timelines | `timelines.feedback`, `timelines.weights.manage`, `timelines.reset` |
| Fediverse | `fediverse.moderation.rules.manage`, `fediverse.moderation.check`, `fediverse.keys.manage` |
| Stickers | `stickers.packs.create`, `stickers.packs.update`, `stickers.packs.delete`, `stickers.packs.own`, `stickers.packs.order`, `stickers.create`, `stickers.update`, `stickers.delete`, `stickers.content.update` |
| Surveys | `surveys.create`, `surveys.update`, `surveys.delete`, `surveys.publish`, `surveys.archive`, `surveys.clone`, `surveys.answer`, `surveys.subscribe` |
| Wallet | `wallets.manage`, `wallets.create`, `wallets.delete`, `wallets.balance.modify`, `wallets.funds.manage`, `wallets.transactions.manage`, `wallets.transfer.requests.manage`, `wallets.public.id.manage` |
| Orders | `orders.create`, `orders.update`, `orders.pay`, `orders.view`, `orders.payouts.manage` |
| Subscriptions | `subscriptions.create`, `subscriptions.cancel`, `subscriptions.activate`, `subscriptions.order.manage`, `subscriptions.checkout`, `subscriptions.groups.manage`, `subscription.gifts.purchase`, `subscription.gifts.redeem`, `subscription.gifts.send`, `subscription.gifts.cancel` |
| Notifications | `notifications.send`, `notifications.put`, `notifications.read.all`, `notifications.preferences.manage`, `notifications.subscriptions.manage`, `notifications.sop.subscribe` |
| Social Credits | `credits.validate.perform`, `credits.manage` |
| Presence | `presences.scan`, `presences.manage`, `presences.activity.manage`, `presences.artwork.manage` |
| Relationships | `relationships.create`, `relationships.update`, `relationships.delete`, `relationships.friends.manage`, `relationships.block.manage`, `relationships.mute.manage`, `relationships.close.friends.manage`, `relationships.alias.manage`, `relationships.inspect`, `relationships.sync` |
| Realms | `realms.create`, `realms.update`, `realms.delete`, `realms.invites.manage`, `realms.members.manage`, `realms.labels.manage`, `realms.boosts.manage`, `realms.permissions.manage` |
| Notable Days | `notable.days.create`, `notable.days.update`, `notable.days.delete` |
| Calendar | `calendar.events.create`, `calendar.events.update`, `calendar.events.delete`, `calendar.subscriptions.manage`, `calendar.checkin.manage` |
| E2EE | `e2ee.keys.manage`, `e2ee.mls.manage`, `e2ee.devices.manage` |
| Developers | `developers.create`, `developers.manage`, `custom.apps.create`, `custom.apps.update`, `custom.apps.delete`, `custom.apps.secrets.manage`, `bot.accounts.create`, `bot.accounts.update`, `bot.accounts.delete`, `bot.accounts.keys.manage`, `bot.accounts.chat.manage`, `app.products.create`, `app.products.update`, `app.products.delete`, `dev.projects.create`, `dev.projects.update`, `dev.projects.delete`, `mini.apps.create`, `mini.apps.update`, `mini.apps.delete`, `quotas.manage` |
| Permissions | `permissions.check`, `permissions.manage`, `permissions.groups.check`, `permissions.groups.manage`, `permissions.cache.manage` |
| Punishments | `punishments.view`, `punishments.create`, `punishments.update`, `punishments.delete` |

## OAuth Scope Filtering

When a request comes from an OAuth session, the token's scopes are checked against the required permission keys:

| Scope | Effect |
|-------|--------|
| `*` | Bypasses all permission checks |
| `posts.*` | Matches any key with the `posts.` prefix (e.g. `posts.create`, `posts.update`) |
| `posts.create` | Matches only the exact key |

This is handled by `PermissionScopeGate.GetMatchedPermissionScope()`.

## Permission Nodes

Each permission is stored as an `SnPermissionNode`:

| Field | Description |
|-------|-------------|
| Actor | `user:<id>` or `group:default` |
| Key | Permission key string |
| Value | JSONB (boolean `true` for simple grants) |
| GroupId | Optional permission group reference |
| ExpiredAt | Optional TTL |
| AffectedAt | Optional activation time |

## Permission Groups

`SnPermissionGroup` + `SnPermissionGroupMember` let you assign a set of permissions to multiple actors at once. The `default` group is seeded on first migration and grants all registered permission keys to every member.

## Punishment-Based Blocking

`SnAccountPunishment` with `Type = PermissionModification` can block specific permission keys for an actor. Blocked permissions take precedence over granted nodes, including group memberships.

## Well-Known Endpoint

```
GET /.well-known/permissions
```

Returns all registered permission keys. Public, no auth required.

```json
{
  "count": 247,
  "permissions": [
    { "key": "accounts.connections.view", "name": "AccountsConnectionsView" },
    { "key": "accounts.delete", "name": "AccountsDeletion" }
  ]
}
```
