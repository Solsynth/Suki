---
title: QR Code Login
description: Sign in on web or desktop by scanning a QR code with your mobile device
---

QR Code Login lets you sign in on web or desktop clients by scanning a QR code with your already-authenticated mobile device.

## How It Works

1. On the web/desktop login page, a QR code is displayed
2. Open the Solian app on your mobile device
3. Scan the QR code
4. Approve the login request on your mobile device
5. The web/desktop session is authenticated

## Enabling QR Login

Before you can approve login requests, you must enable the QR Login authentication factor in your **Account Settings** > **Verification Factors**.

QR Login is a first-class authentication factor with trust level 3 — the highest level, equal to TOTP.

## Security Notes

- The QR code expires after 5 minutes
- Approval requires an interactive session on your mobile device
- The web/desktop client polls for status since it can't use WebSocket before authentication
- You can revoke QR Login at any time from your verification factors settings
