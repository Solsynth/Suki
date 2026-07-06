---
title: Multi-Factor Login
description: How Solar Network's multi-factor authentication system works
---

Solar Network uses a self-developed **Multi-Factor Authentication (MFA)** system. Unlike traditional 2FA that requires exactly two steps, our system is flexible — you can configure multiple verification factors and use any of them to log in.

## How Login Works

### Step 1: Identity

First, provide your identity (username or email) and your password.

### Step 2: Verification

Once your password is verified, the system checks which authentication factors you have configured. You can then choose any one of those factors to complete login.

### Step 3: Token Exchange

After successful verification, you receive an access token (and optionally a refresh token) for API authentication.

## Authentication Factors

| Factor | How It Works | Trust Level |
|--------|--------------|-------------|
| Password | Your account password | 1 |
| Email Verification Code | One-time code sent to your email | 2 |
| TOTP | Code from an authenticator app (Google Authenticator, Authy, etc.) | 3 |
| In-App Notification | Push notification with one-time code | 2 |
| Passkey | Biometric (fingerprint, Face ID) or device passcode | 3 |
| Physical Security Key | Hardware security key from our store/events | 3 |
| QR Login | Scan with your authenticated mobile device | 3 |
| Recovery Code | Single-use backup code | 0 |

## Trust Levels

Each factor has a trust level. The system uses these levels to determine how many verification steps are needed in high-security scenarios:

| Level | Description |
|-------|-------------|
| 0 | Recovery only (cannot log in) |
| 1 | Basic (password, PIN) |
| 2 | Standard (email, in-app notification) |
| 3 | Highest (TOTP, passkey, security key, QR login) |

## Cross-Device Login Approval

If you have other devices logged in, you can approve a login attempt from another device without completing the second factor yourself:

1. Start login on Device A (e.g., a new phone)
2. After password verification, Device A shows "Waiting for approval"
3. Device B (your already-logged-in device) receives a notification
4. On Device B, review the login details (device name, IP, platform)
5. Tap **Approve** or **Decline** (PIN may be required)
6. On approval, Device A receives the event via WebSocket and exchanges tokens immediately

This is useful when you don't have access to your second factor on the new device.

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `auth.challenge.pending` | Server → Other devices | A new login challenge is awaiting approval |
| `auth.challenge.approved` | Server → Initiating device | Login was approved from another device |
| `auth.challenge.declined` | Server → Initiating device | Login was declined from another device |

## Session Management

When a login is approved from another device, the new session becomes a **child session** of the approving device. You can view and manage all your active sessions (and revoke them) from your account security settings.

## Token Model

Solar Network uses unified JWT authentication:

- **Access token:** Short-lived (1 hour), used as `Authorization: Bearer <token>`
- **Refresh token:** Long-lived (30 days), used to mint new access tokens
- Tokens are RS256 JWTs validated locally by each service
- Revocation is tracked via Redis (`auth:revoked:jti:{jti}`)

## Recommended Setup

1. **Recovery Code** (required) — your safety net
2. **Passkey or TOTP** (recommended) — daily driver
3. **Email or In-App Notification** — backup method

This gives you: fast login (passkey), offline capability (TOTP), and fallback options (email, recovery code).
