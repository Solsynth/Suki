---
title: 权限系统
---

Solar Network 使用细粒度的基于属性的权限模型。每个可变端点声明一个或多个 `[AskPermission("key")]` 属性，中间件在允许请求前检查操作者的权限节点。

## 架构

```
客户端请求
  → [Authorize]（认证）
  → AskPermissionMiddleware（授权）
    → OAuth 作用域门控（如果是 OAuth 会话）
    → 超级用户绕过
    → 权限节点查找（gRPC 或本地数据库）
  → 控制器动作
```

存在两种中间件实现：

| 中间件 | 使用方 | 后端 |
|---|---|---|
| `RemotePermissionMiddleware` | Sphere、Passport、Messager、Develop、Wallet、Ring | gRPC `PermissionService` |
| `LocalPermissionMiddleware` | Padlock | 直接 EF Core 查询 |

两者执行相同的逻辑：遍历所有 `[AskPermission]` 属性，将每个键与操作者的权限节点进行比对，首次失败时返回 403。

## 权限键

命名约定：`{域}.{资源}.{操作}`

示例：
- `posts.create`
- `chat.messages.delete`
- `wallets.balance.modify`

### 完整列表

| 域 | 键 |
|---|-----|
| 账户 | `accounts.view`, `accounts.manage`, `accounts.delete`, `accounts.statuses.create`, `accounts.statuses.update`, `accounts.connections.view` |
| 认证与安全 | `auth.sessions.manage`, `auth.factors.manage`, `auth.api.keys.manage`, `auth.apps.authorize`, `auth.recover` |
| 账户管理 | `account.contacts.manage`, `account.devices.manage`, `account.authorized.apps.manage` |
| 聊天 | `chat.create`, `chat.update`, `chat.delete`, `chat.messages.create`, `chat.messages.update`, `chat.messages.delete`, `chat.messages.react`, `chat.members.manage`, `chat.members.kick`, `chat.members.timeout`, `chat.invites.manage`, `chat.e2ee.manage`, `chat.groups.manage`, `chat.pins.manage`, `chat.read.all`, `chat.sync`, `chat.call.start`, `chat.call.end`, `chat.call.invite`, `chat.call.kick`, `chat.call.mute` |
| 帖子 | `posts.view`, `posts.create`, `posts.update`, `posts.delete`, `posts.publish`, `posts.react`, `posts.boost`, `posts.moderate`, `posts.lock`, `posts.bookmark`, `posts.award`, `posts.sponsor`, `posts.pin`, `posts.batch.delete`, `posts.batch.visibility` |
| 合集 | `post.collections.create`, `post.collections.update`, `post.collections.delete`, `post.collections.posts.manage` |
| 分类与标签 | `post.categories.manage`, `post.categories.subscribe`, `posts.tags.create`, `posts.tags.update`, `posts.tags.assign`, `posts.tags.claim`, `posts.tags.protect`, `posts.tags.event` |
| 订阅 | `post.subscriptions.manage` |
| 发布者 | `publishers.create`, `publishers.update`, `publishers.delete`, `publishers.members.manage`, `publishers.invites.manage`, `publishers.features.manage`, `publishers.fediverse.manage`, `publishers.domains.manage`, `publishers.rewards.settle`, `publishers.rewards.resettle`, `publishers.subscriptions.manage` |
| 时间线 | `timelines.feedback`, `timelines.weights.manage`, `timelines.reset` |
| 联邦宇宙 | `fediverse.moderation.rules.manage`, `fediverse.moderation.check`, `fediverse.keys.manage` |
| 贴图 | `stickers.packs.create`, `stickers.packs.update`, `stickers.packs.delete`, `stickers.packs.own`, `stickers.packs.order`, `stickers.create`, `stickers.update`, `stickers.delete`, `stickers.content.update` |
| 问卷 | `surveys.create`, `surveys.update`, `surveys.delete`, `surveys.publish`, `surveys.archive`, `surveys.clone`, `surveys.answer`, `surveys.subscribe` |
| 钱包 | `wallets.manage`, `wallets.create`, `wallets.delete`, `wallets.balance.modify`, `wallets.funds.manage`, `wallets.transactions.manage`, `wallets.transfer.requests.manage`, `wallets.public.id.manage` |
| 订单 | `orders.create`, `orders.update`, `orders.pay`, `orders.view`, `orders.payouts.manage` |
| 订阅 | `subscriptions.create`, `subscriptions.cancel`, `subscriptions.activate`, `subscriptions.order.manage`, `subscriptions.checkout`, `subscriptions.groups.manage`, `subscription.gifts.purchase`, `subscription.gifts.redeem`, `subscription.gifts.send`, `subscription.gifts.cancel` |
| 通知 | `notifications.send`, `notifications.put`, `notifications.read.all`, `notifications.preferences.manage`, `notifications.subscriptions.manage`, `notifications.sop.subscribe` |
| 社会信用 | `credits.validate.perform`, `credits.manage` |
| 在线状态 | `presences.scan`, `presences.manage`, `presences.activity.manage`, `presences.artwork.manage` |
| 关系 | `relationships.create`, `relationships.update`, `relationships.delete`, `relationships.friends.manage`, `relationships.block.manage`, `relationships.mute.manage`, `relationships.close.friends.manage`, `relationships.alias.manage`, `relationships.inspect`, `relationships.sync` |
| 领域 | `realms.create`, `realms.update`, `realms.delete`, `realms.invites.manage`, `realms.members.manage`, `realms.labels.manage`, `realms.boosts.manage`, `realms.permissions.manage` |
| 特殊日历 | `notable.days.create`, `notable.days.update`, `notable.days.delete` |
| 日历 | `calendar.events.create`, `calendar.events.update`, `calendar.events.delete`, `calendar.subscriptions.manage`, `calendar.checkin.manage` |
| 端到端加密 | `e2ee.keys.manage`, `e2ee.mls.manage`, `e2ee.devices.manage` |
| 开发者 | `developers.create`, `developers.manage`, `custom.apps.create`, `custom.apps.update`, `custom.apps.delete`, `custom.apps.secrets.manage`, `bot.accounts.create`, `bot.accounts.update`, `bot.accounts.delete`, `bot.accounts.keys.manage`, `bot.accounts.chat.manage`, `app.products.create`, `app.products.update`, `app.products.delete`, `dev.projects.create`, `dev.projects.update`, `dev.projects.delete`, `mini.apps.create`, `mini.apps.update`, `mini.apps.delete`, `quotas.manage` |
| 权限管理 | `permissions.check`, `permissions.manage`, `permissions.groups.check`, `permissions.groups.manage`, `permissions.cache.manage` |
| 处罚 | `punishments.view`, `punishments.create`, `punishments.update`, `punishments.delete` |

## OAuth 作用域过滤

当请求来自 OAuth 会话时，Token 的作用域会与所需的权限键进行比对：

| 作用域 | 效果 |
|--------|------|
| `*` | 绕过所有权限检查 |
| `posts.*` | 匹配任何以 `posts.` 为前缀的键（如 `posts.create`、`posts.update`） |
| `posts.create` | 仅匹配精确键 |

由 `PermissionScopeGate.GetMatchedPermissionScope()` 处理。

## 权限节点

每个权限存储为 `SnPermissionNode`：

| 字段 | 说明 |
|------|------|
| Actor | `user:<id>` 或 `group:default` |
| Key | 权限键字符串 |
| Value | JSONB（简单授权为布尔值 `true`） |
| GroupId | 可选的权限组引用 |
| ExpiredAt | 可选的 TTL |
| AffectedAt | 可选的激活时间 |

## 权限组

`SnPermissionGroup` + `SnPermissionGroupMember` 允许一次性为多个操作者分配一组权限。`default` 组在首次迁移时注册，并向所有成员授予所有已注册的权限键。

## 基于处罚的屏蔽

`SnAccountPunishment` 类型为 `PermissionModification` 时可以屏蔽操作者的特定权限键。被屏蔽的权限优先于已授权的节点，包括组成员资格。

## Well-Known 端点

```
GET /.well-known/permissions
```

返回所有已注册的权限键。公开，无需认证。

```json
{
  "count": 247,
  "permissions": [
    { "key": "accounts.connections.view", "name": "AccountsConnectionsView" },
    { "key": "accounts.delete", "name": "AccountsDeletion" }
  ]
}
```
