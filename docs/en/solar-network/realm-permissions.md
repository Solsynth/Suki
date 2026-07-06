---
title: Realm Permissions
description: Manage access control for your realm members
---

The Realm Permissions System provides fine-grained access control for realm members. As a realm owner, you can configure what actions different roles and individual users can perform.

## Roles

Each realm has three default roles:

| Role | Level | Description |
|------|-------|-------------|
| Owner | 100 | Full control over the realm |
| Moderator | 50 | Can moderate content and members |
| Normal | 0 | Default role for new joiners |

## Available Permissions

| Permission | Normal | Moderator | Owner |
|------------|--------|-----------|-------|
| Chat (send messages) | ✅ | ✅ | ✅ |
| Post (create posts) | ✅ | ✅ | ✅ |
| Comment (reply to posts) | ✅ | ✅ | ✅ |
| Upload media | ✅ | ✅ | ✅ |
| Moderate posts | ❌ | ✅ | ✅ |
| Moderate chat (delete messages, timeout users) | ❌ | ✅ | ✅ |
| Manage members (invite, remove, change roles) | ❌ | ✅ | ✅ |
| Manage realm (edit info, labels, settings) | ❌ | ❌ | ✅ |

## User-Specific Overrides

Beyond role-based permissions, you can set permission overrides for individual users. These overrides take precedence over the user's role permissions.

A user permission value of `null` means "fall back to role-based permission."

## Managing Permissions

### View/Update Role Permissions

Navigate to your realm's settings to view and modify what each role can do.

### Set User Overrides

In the members list, you can override specific permissions for individual members — granting extra capabilities or restricting specific actions regardless of their role.

## Post Moderation

Moderators and owners can remove posts from the realm. Each moderation action creates a log entry with:

- Moderator account ID
- Reason for removal
- Timestamp

You can view the moderation log in your realm settings.
