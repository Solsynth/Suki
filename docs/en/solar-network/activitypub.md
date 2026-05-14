---
title: ActivityPub
---

# ActivityPub

Starting from DysonNetwork commit `fb15930`, Solar Network's server-side software began providing stable ActivityPub support.

This means you can use Solar Network as a member of the Fediverse to interact with Mastodon and other software instances.

## Actor

The ActivityPub protocol is built upon Actors. On Solar Network, the Actor is not the user, but the **Publisher**. 
For user-level actions such as reacting to posts, we will attempt to find the first Publisher created by the user and check if that Publisher has an Actor enabled.

Solar Network's ActivityPub feature requires manual activation by the user. You can go to the Creator Center, select the Publisher you wish to enable, and activate the corresponding Actor to join the Fediverse.

## Supported Scope

Currently, Solar Network supports the following Activities:

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

Additionally, Solar Network supports displaying local post attachments on the Fediverse, as well as displaying posts and attachments from the Fediverse (a suitable network connection is required).

However, Solar Network does not support Mastodon's Content Warning or Polls. It also will not deliver polls, source checks, or other embeds to the Fediverse.

Since Solar Network posts store rich text in Markdown format, while ActivityPub typically uses HTML, the client converts HTML to Markdown for rendering, and the server converts it to HTML before delivering it to the ActivityPub Inbox. Therefore, certain special syntaxes, such as spoilers and highlights, are unavailable on the Fediverse.

Solar Network currently does not support Follower management and adopts an auto-accept strategy.

## Boxes

ActivityPub's Inbox and Outbox are subject to Solar Network's global Rate Limiting (120 reqs/min). Please keep this in mind when building third-party software that interacts with Solar Network's ActivityPub.

Additionally, since Solar Network does not store Activities, all Activities are dynamically constructed. Therefore, the delivered ActivityId and the Id provided in the Outbox are highly likely to be different. It is recommended to use the Object URI for identification.
