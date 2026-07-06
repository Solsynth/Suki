---
title: OAuth Authentication
---

Solar Network uses OAuth 2.0 / OpenID Connect for third-party app authentication. This guide covers the two main flows: **Authorization Code** (for apps with a backend) and **Device Code** (for CLI/TV/limited-input devices).

## Endpoints

All OAuth endpoints are served through the gateway. For the most up-to-date list of endpoints, always check the discovery document:

```
https://api.solian.app/.well-known/openid-configuration
```

Common endpoints include:

| Purpose | URL |
|---------|-----|
| Discovery | `https://api.solian.app/.well-known/openid-configuration` |
| Authorization | `https://api.solian.app/padlock/auth/open/authorize` |
| Token | `https://api.solian.app/padlock/auth/open/token` |
| User Info | `https://api.solian.app/padlock/auth/open/userinfo` |
| JWKS | `https://api.solian.app/.well-known/jwks` |
| Device Authorization | `https://api.solian.app/padlock/auth/open/device/code` |
| Verification Page | `https://solian.app/auth/device` |

## Client Configuration

When you create a Custom App in the Developer Portal, configure its OAuth settings:

```json
{
  "oauth_config": {
    "client_uri": "https://myapp.example.com",
    "redirect_uris": ["https://myapp.example.com/callback"],
    "post_logout_redirect_uris": ["https://myapp.example.com/logout"],
    "allowed_scopes": ["openid", "profile", "email"],
    "allowed_grant_types": ["authorization_code", "refresh_token"],
    "require_pkce": true,
    "allow_offline_access": false,
    "is_public_client": true
  }
}
```

### Client Types

| Type | `is_public_client` | Secret Required | PKCE Required |
|------|---------------------|-----------------|---------------|
| **Confidential** (server-side apps) | `false` | Yes | Optional |
| **Public** (SPA, mobile, desktop, CLI) | `true` | No | Yes (enforced) |

---

## Authorization Code Flow

Use this flow for applications that can securely store credentials or run a backend server. For public clients (SPA, mobile), PKCE is required.

### With PKCE (Recommended for all clients)

#### Step 1: Generate PKCE Verifier and Challenge

Before starting the authorization flow, generate a code verifier and challenge:

```javascript
// Generate a random code verifier (43-128 characters)
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer) {
  let str = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

#### Step 2: Redirect to Authorization Endpoint

Send the user to the authorization URL:

```
GET /padlock/auth/open/authorize?
    client_id={client_slug}&
    response_type=code&
    redirect_uri={redirect_uri}&
    scope=openid profile email&
    state={random_state}&
    code_challenge={code_challenge}&
    code_challenge_method=S256
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Your app's slug |
| `response_type` | Yes | Must be `code` |
| `redirect_uri` | Yes | Must match registered URI |
| `scope` | No | Requested scopes (space-separated) |
| `state` | Recommended | CSRF protection value |
| `code_challenge` | Yes (public clients) | PKCE S256 hash of verifier |
| `code_challenge_method` | Yes (public clients) | Must be `S256` |

#### Step 3: User Authenticates and Consents

The user will:
1. Authenticate if not already logged in
2. Review the requested permissions
3. Approve or deny the authorization

#### Step 4: Authorization Code Response

On approval, the user is redirected back:

```
{redirect_uri}?code={authorization_code}&state={state}
```

#### Step 5: Exchange Code for Tokens

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorization_code}
&redirect_uri={redirect_uri}
&client_id={client_slug}
&code_verifier={code_verifier}
```

For **confidential clients**, also include your `client_secret`:

```text
&client_secret={your_secret}
```

For **public clients**, `client_secret` is NOT required (and will be rejected if provided).

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

### Without PKCE (Confidential Clients Only)

For server-side applications that can securely store a client secret:

```
GET /padlock/auth/open/authorize?
    client_id={client_slug}&
    response_type=code&
    redirect_uri={redirect_uri}&
    scope=openid profile email&
    state={random_state}
```

Token exchange:

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorization_code}
&redirect_uri={redirect_uri}
&client_id={client_slug}
&client_secret={your_secret}
```

---

## Device Code Flow

Use this flow for CLI tools, TV apps, or any device with limited input capability. The user authorizes on a separate device (e.g., their phone or browser).

### Step 1: Request a Device Code

```http
POST /padlock/auth/open/device/code
Content-Type: application/x-www-form-urlencoded

client_id={client_slug}&scope=openid profile email
```

**Response:**

```json
{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://solian.app/auth/device",
  "verification_uri_complete": "https://solian.app/auth/device?code=WDJB-MJHT",
  "expires_in": 600,
  "interval": 5
}
```

| Field | Description |
|-------|-------------|
| `device_code` | Internal code for token polling |
| `user_code` | Display code for the user (format: `XXXX-XXXX`) |
| `verification_uri` | URL the user should visit |
| `verification_uri_complete` | URL with pre-filled code |
| `expires_in` | Code lifetime in seconds (600 = 10 minutes) |
| `interval` | Minimum seconds between polling attempts |

For **confidential clients**, also include `client_secret`.

### Step 2: Display Instructions to the User

In your application:

```
Open https://solian.app/auth/device
Enter code: WDJB-MJHT
```

If your device can open a URL, redirect to `verification_uri_complete` for a pre-filled experience.

### Step 3: Poll the Token Endpoint

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code={device_code}
&client_id={client_slug}
```

For **confidential clients**, also include `client_secret`.

**While waiting for user approval:**

```json
{"error": "authorization_pending", "error_description": "Authorization pending."}
```

**On success:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "openid profile email"
}
```

### Polling Errors

| Error | Description | Action |
|-------|-------------|--------|
| `authorization_pending` | User hasn't approved yet | Wait and poll again |
| `slow_down` | Polling too fast | Add 5 seconds before next attempt |
| `access_denied` | User declined | Stop polling |
| `expired_token` | Code expired (10 min) | Stop polling, start new flow |
| `invalid_grant` | Code invalid or already used | Stop polling |

### Polling Best Practices

1. Wait for the returned `interval` (default 5s) before the first poll
2. On `authorization_pending`, wait the same interval and try again
3. On `slow_down`, add at least 5 seconds before the next attempt
4. Stop polling on any terminal error

### Optional: Custom Verification UI

If you're building your own browser-side verification experience:

- `GET /padlock/auth/open/device/code/{user_code}` — fetch request details
- `POST /padlock/auth/open/device/code/{user_code}/approve` — approve (requires logged-in session)
- `POST /padlock/auth/open/device/code/{user_code}/decline` — decline

Verification status response:

```json
{
  "user_code": "WDJB-MJHT",
  "client_id": "my-cli-tool",
  "client_name": "My CLI Tool",
  "scopes": ["openid", "profile", "email"],
  "status": "pending",
  "expires_at": "2026-07-06T12:15:00Z",
  "expires_in": 534,
  "interval": 5,
  "verification_uri": "https://solian.app/auth/device"
}
```

---

## Refreshing Tokens

Both flows return a `refresh_token`. Use it to get a new access token without user interaction:

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_slug}
```

For confidential clients, also include `client_secret`.

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Token Lifetime

| Token | Lifetime |
|-------|----------|
| Access token | 1 hour |
| Refresh token | 30 days |

---

## Using the Access Token

Include the token in API requests:

```http
GET /api/...
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Available Scopes

| Scope | Description |
|-------|-------------|
| `openid` | Required for OIDC; returns ID token |
| `profile` | Access to user profile (nickname, avatar, etc.) |
| `email` | Access to email address |
| `offline_access` | Request refresh token (must be enabled in config) |

---

## User Info Endpoint

```http
GET /padlock/auth/open/userinfo
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "sub": "account-uuid",
  "nickname": "LittleSheep",
  "email": "lily@solsynth.dev",
  "picture": "https://..."
}
```

---

## OIDC Discovery

Always refer to the discovery document as the source of truth for endpoint URLs and supported features:

```
https://api.solian.app/.well-known/openid-configuration
```

Key fields to look for:

```json
{
  "issuer": "https://api.solian.app",
  "authorization_endpoint": "https://api.solian.app/padlock/auth/open/authorize",
  "token_endpoint": "https://api.solian.app/padlock/auth/open/token",
  "userinfo_endpoint": "https://api.solian.app/padlock/auth/open/userinfo",
  "jwks_uri": "https://api.solian.app/.well-known/jwks",
  "device_authorization_endpoint": "https://api.solian.app/padlock/auth/open/device/code",
  "grant_types_supported": [
    "authorization_code",
    "refresh_token",
    "urn:ietf:params:oauth:grant-type:device_code"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "none"
  ],
  "code_challenge_methods_supported": ["S256"]
}
```

The `"none"` in `token_endpoint_auth_methods_supported` confirms public client support.

---

## Example: Single-Page Application (PKCE)

```javascript
class OAuthClient {
  constructor(clientId, redirectUri) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.codeVerifier = null;
  }

  async startAuth() {
    // Generate PKCE parameters
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
    const state = this.generateState();

    // Store verifier and state for callback
    sessionStorage.setItem('pkce_verifier', this.codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // Redirect to authorization endpoint
    window.location.href = `/padlock/auth/open/authorize?${params}`;
  }

  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Verify state to prevent CSRF
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State mismatch');
    }

    const codeVerifier = sessionStorage.getItem('pkce_verifier');

    // Exchange code for tokens
    const response = await fetch('/padlock/auth/open/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier
      })
    });

    return response.json();
  }

  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  base64UrlEncode(buffer) {
    let str = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
```

## Example: Device Code Flow (CLI Tool)

```javascript
// Step 1: Request device code
const device = await fetch("https://api.solian.app/padlock/auth/open/device/code", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: "my-cli-tool",
    scope: "openid profile email"
  })
}).then((res) => res.json());

console.log(`Visit ${device.verification_uri} and enter code ${device.user_code}`);

// Step 2: Poll for tokens
let intervalMs = device.interval * 1000;

while (true) {
  await new Promise((resolve) => setTimeout(resolve, intervalMs));

  const tokenResponse = await fetch("https://api.solian.app/padlock/auth/open/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
      client_id: "my-cli-tool"
    })
  });

  const payload = await tokenResponse.json();

  if (payload.error === "authorization_pending") {
    continue;
  }

  if (payload.error === "slow_down") {
    intervalMs += 5000;
    continue;
  }

  if (payload.error) {
    throw new Error(`${payload.error}: ${payload.error_description ?? ""}`);
  }

  console.log("Authenticated:", payload.access_token);
  break;
}
```

---

## Security Considerations

### State Parameter

Always use a random `state` value to prevent CSRF attacks. Verify it matches in the callback before exchanging the code.

### PKCE

- Public clients **must** use PKCE
- Confidential clients should use PKCE as a best practice
- Never expose `client_secret` in frontend code or mobile apps

### Redirect URI Validation

| App Status | Validation |
|------------|------------|
| Developing | Disabled (any URI allowed) |
| Staging | Disabled (any URI allowed) |
| Production | Enabled (must match registered URIs) |

Store your tokens securely. Access tokens expire in 1 hour; use refresh tokens to maintain sessions.

---

## Error Responses

| Error | Description |
|-------|-------------|
| `invalid_request` | Missing or invalid parameter |
| `unauthorized_client` | Client not found or not authorized |
| `invalid_client` | Invalid client credentials |
| `invalid_grant` | Invalid or expired authorization/refresh code |
| `unsupported_grant_type` | Grant type not supported by client |
