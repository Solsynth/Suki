---
title: Publishers and Published Content
description: Learn about publishing content on Solar Network.
---

# Publishers and Published Content

A Publisher is the primary organizational unit for most publicly shared content on Solar Network. A single account can own or join multiple Publishers.

Before you can publish any content on Solar Network, you need a Publisher identity.

## Creating a Publisher

You can create a Publisher by clicking the empty Publisher avatar on the post creation page (available only if you haven't created one yet), or by navigating to the **Creator Center** through your **Account** page. On desktop, you can access the **Creator Center** directly from the sidebar.

!!! note

      If you see a `Permission required` message when trying to create a Publisher, it means you're missing certain permissions.
      Typically, users must confirm their registration via email. Accounts that haven't completed email verification cannot create Publishers.

A user can own multiple Publishers and can also join different Publishers for collaborative management.

When creating a Publisher, please note the following:

1. **Name** — Like account names, Publisher names must be unique across the entire platform and URL-safe. This cannot be changed after creation.
2. **Avatar and Header Image** — When creating or editing a Publisher, uploaded avatars and header images are not applied immediately. You must click **"Save Changes"** to apply them officially.

## Individual vs. Organization

Publishers come in two types: **Individual** and **Organization**. Both types can invite others for collaborative management, but they differ in several key ways:

- **Individual Publishers** will fall back to using the owner's account information (such as avatar and header) when Publisher-specific information is missing. They also display the owner's status and verification badge.
- **Organization Publishers** have a distinctive rounded rectangle avatar (not circular) and must be affiliated with a **Domain**.

## Collaboration

Since v3, Publishers can invite others for collaborative management with four default permission levels:

1. **Owner** — Has all permissions
2. **Manager** — Has all Editor and Observer permissions, plus the ability to invite new collaborators (with permissions no higher than their own)
3. **Editor** — Can publish content under this Publisher
4. **Observer** — Can view internal statistics for this Publisher

## Developer Publishers

**Developer** is a special variant of Publisher. Through the **Developer Portal**, you can create a **Developer Identity** for a Publisher to access Solar Network's open APIs.

See the **Developer Identity** section for more details.

## Verification Badge

If you're concerned about impersonation on Solar Network, want to publish authoritative information, or wish to showcase your uniqueness, you can apply for a verification badge.

> You must have an active **Stellar Plan** subscription to apply for verification. Applications without this subscription will not be processed. The verification badge will remain even after your Stellar Plan subscription expires.

The application process for Publisher verification is the same as for account verification: send an email explaining your request to `lily[at]solsynth.dev`. Our customer support team will respond within 7 business days.

> For official verification requests, you'll need to provide supporting documentation. More complete documentation leads to higher approval chances.

## Visibility Settings

Visibility settings apply to posts, though different Publisher types have different visibility options available:

- **Public**: Visible to everyone, including unauthenticated users and via API
- **Friends Only**: Only works for Individual Publishers. Makes posts visible only to the Publisher owner's friends. When used on Organization Publishers, this setting behaves like Private.
- **Private**: Only visible to the Publisher itself
- **Unlisted**: Posts won't appear in recommendation feeds or listings (except to the Publisher owner), but can still be accessed directly via post ID or alias

### Domain Posts

Whether Domain posts appear on the homepage depends on whether the user has joined the Domain and the Domain's settings:

- If the Domain has **Public Mode** enabled, Domain posts will be visible to users who haven't joined the Domain
- If Public Mode is disabled, Domain posts will only appear in the homepage feeds of users who have joined the Domain

!!! warning

      Domain posts still respect their original visibility settings. Domain settings only affect whether posts appear in recommendations (and general unsorted post listing APIs)—they don't affect the actual post visibility. Users can still access complete Domain post information when querying with the appropriate Domain parameters, including viewing Domain posts on the Publisher's page.

### Gated Publishers

**Follow Approval Required** and **Content Visible Only to Followers** are exclusive features available to Stellar Plan Nova tier and above, allowing more granular control over content visibility.

- For Publishers with **Content Visible Only to Followers** enabled, users won't see this Publisher's content on their homepage unless they're followers.
- For Publishers with **Follow Approval Required** enabled, users can't follow directly from the Publisher page. Instead, they enter a **Pending** state until the Publisher approves their follow request. If a user later unfollows voluntarily, they'll need to reapply to follow again.

Additionally, for **Follow Approval Required** Publishers, you can manually add users to your follower list. However, note that:

- Users who have previously unfollowed cannot be added again manually
- Manually added followers don't automatically receive notifications

!!! warning

      A post's individual visibility setting overrides **Follow Approval Required**. If your post is marked as Friends Only, friends who haven't followed you can still see it.

## Subscribing to Publishers

You can subscribe to Publishers to view content from those with **Content Visible Only to Followers** enabled.

Since the introduction of the **Content Visible Only to Followers** feature, we've added notification level options for subscriptions. If you only want to maintain visibility access, you can disable notifications.

## Federation Role

Solar Network's federation operates at the Publisher level. Therefore, you need at least one federated Publisher to interact with federated posts/content.

Only your public content is involved in federation. However, **Follow Approval Required** content is still sent to federation servers. If you don't want this behavior, please disable federation for the corresponding Publisher.
