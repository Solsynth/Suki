---
title: ActivityPub
---

# ActivityPub

自 Solar Network 的服务端软件 DysonNetwork commit `fb15930` 开始，
Solar Network 开始提供稳定的 ActivityPub 支持。

这意味着你可以使用 Solar Network 作为联邦社交网络的一员参与和 Mastodon 以及其他软件实例的互动。

## Actor

ActivityPub 协议是构建在 Actor 的基础上。而 Solar Network 的 Actor 不是指用户，而是指发布者。
对于反应帖子等用户等级的操作，我们会尝试寻找用户第一个创建的发布者，并且查询该发布者时候创建了 Actor。

Solar Network 的 ActivityPub 功能是需要用户手动启用的，用户可以前往创作者中心，选择想要启用的发布者
启用对应的 Actor 即可加入联邦网络。

## 支持范围

目前 Solar Network 实现了对以下 Activity 的支持：

- Create
- Update
- Delete
- Follow
- Like
- Accept
    - Follow
- Undo
    - Follow
    - Like

同时 Solar Network 支持将本地帖子的附件在联邦网络上显示，
同时支持显示联邦网络的帖子及附件（需要有适合的网络）。

不过 Solar Network 不支持 Mastodon 的 Content Warning 和投票。
同时也不会将投票以及源点支票等其他 Embed 投递到联邦网络上。

由于 Solar Network 的帖子是以 Markdown 的格式存储富文本的，
而 ActivityPub 通常使用 HTML。因此客户端会对 HTML 转换会 Markdown 来渲染，
服务器也会转换成为 HTML 再投递到 ActivityPub 的 Inbox。
因此部份特殊语法如隐藏、高亮等在联邦网络不可用。

Solar Network 目前没有对 Follower 管理的支持，同时采取自动接受策略。

## Boxes

ActivityPub 的 Inbox 和 Outbox 同样又有 Solar Network 全局的 Rate Limiting (120 reqs/min)。
在构建对 Solar Network 的 ActivityPub 使用的第三方软件还请注意这点。

同时由于 Solar Network 不存储 Activity，所有的 Activity 都是动态构建的。
因此投递的 ActivityId 和 Outbox 提供的 Id 很大可能不相同。建议使用 Object URI 来表示。