---
title: OAuth 认证
---

Solar Network 使用 OAuth 2.0 / OpenID Connect 进行第三方应用认证。本指南涵盖两种主要流程：**授权码**（适用于有后端的应用）和**设备码**（适用于 CLI/电视/输入受限设备）。

## 端点

所有 OAuth 端点通过网关提供。要获取最新的端点列表，请始终查看 discovery 文档：

```
https://api.solian.app/.well-known/openid-configuration
```

常用端点：

| 用途 | URL |
|------|-----|
| Discovery | `https://api.solian.app/.well-known/openid-configuration` |
| 授权 | `https://api.solian.app/padlock/auth/open/authorize` |
| Token | `https://api.solian.app/padlock/auth/open/token` |
| 用户信息 | `https://api.solian.app/padlock/auth/open/userinfo` |
| JWKS | `https://api.solian.app/.well-known/jwks` |
| 设备授权 | `https://api.solian.app/padlock/auth/open/device/code` |
| 验证页面 | `https://solian.app/auth/device` |

## 客户端配置

在开发者门户创建自定义应用时，配置其 OAuth 设置：

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

### 客户端类型

| 类型 | `is_public_client` | 需要密钥 | 需要 PKCE |
|------|---------------------|----------|-----------|
| **机密客户端**（服务端应用） | `false` | 是 | 可选 |
| **公开客户端**（SPA、移动端、桌面端、CLI） | `true` | 否 | 是（强制） |

---

## 授权码流程

适用于能安全存储凭据或运行后端服务器的应用。对于公开客户端（SPA、移动端），PKCE 是必需的。

### 使用 PKCE（推荐所有客户端使用）

#### 步骤 1：生成 PKCE 验证器和挑战码

在开始授权流程前，生成 code verifier 和 code challenge：

```javascript
// 生成随机 code verifier（43-128 字符）
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// 从 verifier 生成 code challenge
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

#### 步骤 2：重定向到授权端点

将用户引导至授权 URL：

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

| 参数 | 必填 | 说明 |
|------|------|------|
| `client_id` | 是 | 应用的 slug |
| `response_type` | 是 | 必须为 `code` |
| `redirect_uri` | 是 | 必须与注册的 URI 匹配 |
| `scope` | 否 | 请求的作用域（空格分隔） |
| `state` | 推荐 | CSRF 防护值 |
| `code_challenge` | 是（公开客户端） | PKCE S256 哈希值 |
| `code_challenge_method` | 是（公开客户端） | 必须为 `S256` |

#### 步骤 3：用户认证并授权

用户将：
1. 如果未登录则进行登录
2. 查看请求的权限
3. 批准或拒绝授权

#### 步骤 4：授权码响应

用户批准后会被重定向回：

```
{redirect_uri}?code={authorization_code}&state={state}
```

#### 步骤 5：用授权码换取 Token

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorization_code}
&redirect_uri={redirect_uri}
&client_id={client_slug}
&code_verifier={code_verifier}
```

对于**机密客户端**，还需包含 `client_secret`：

```text
&client_secret={your_secret}
```

对于**公开客户端**，不需要 `client_secret`（提供会被拒绝）。

**响应：**

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

### 不使用 PKCE（仅机密客户端）

对于能安全存储客户端密钥的服务端应用：

```
GET /padlock/auth/open/authorize?
    client_id={client_slug}&
    response_type=code&
    redirect_uri={redirect_uri}&
    scope=openid profile email&
    state={random_state}
```

Token 交换：

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

## 设备码流程

适用于 CLI 工具、电视应用或任何输入能力受限的设备。用户在单独的设备（如手机或浏览器）上授权。

### 步骤 1：请求设备码

```http
POST /padlock/auth/open/device/code
Content-Type: application/x-www-form-urlencoded

client_id={client_slug}&scope=openid profile email
```

**响应：**

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

| 字段 | 说明 |
|------|------|
| `device_code` | 用于轮询 token 的内部代码 |
| `user_code` | 展示给用户的代码（格式：`XXXX-XXXX`） |
| `verification_uri` | 用户应访问的 URL |
| `verification_uri_complete` | 预填了代码的 URL |
| `expires_in` | 代码有效期（秒，600 = 10 分钟） |
| `interval` | 轮询间隔（秒） |

对于**机密客户端**，还需包含 `client_secret`。

### 步骤 2：向用户展示说明

在应用中显示：

```
请访问 https://solian.app/auth/device
输入代码：WDJB-MJHT
```

如果设备可以打开 URL，使用 `verification_uri_complete` 可预填代码。

### 步骤 3：轮询 Token 端点

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code={device_code}
&client_id={client_slug}
```

对于**机密客户端**，还需包含 `client_secret`。

**等待用户批准时：**

```json
{"error": "authorization_pending", "error_description": "等待授权中。"}
```

**成功时：**

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

### 轮询错误

| 错误 | 说明 | 操作 |
|------|------|------|
| `authorization_pending` | 用户尚未批准 | 等待后重新轮询 |
| `slow_down` | 轮询过快 | 增加至少 5 秒后再试 |
| `access_denied` | 用户拒绝 | 停止轮询 |
| `expired_token` | 代码已过期（10 分钟） | 停止轮询，重新开始 |
| `invalid_grant` | 代码无效或已使用 | 停止轮询 |

### 轮询最佳实践

1. 首次轮询前等待返回的 `interval`（默认 5 秒）
2. 收到 `authorization_pending` 时，等待相同间隔后重试
3. 收到 `slow_down` 时，至少增加 5 秒后再试
4. 收到任何终止性错误时停止轮询

### 可选：自定义验证 UI

如果要构建自己的浏览器端验证体验：

- `GET /padlock/auth/open/device/code/{user_code}` — 获取请求详情
- `POST /padlock/auth/open/device/code/{user_code}/approve` — 批准（需要已登录会话）
- `POST /padlock/auth/open/device/code/{user_code}/decline` — 拒绝

验证状态响应：

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

## 刷新 Token

两种流程都返回 `refresh_token`。用它获取新的 access token 而无需用户交互：

```http
POST /padlock/auth/open/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_slug}
```

对于机密客户端，还需包含 `client_secret`。

**响应：**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Token 有效期

| Token | 有效期 |
|-------|--------|
| Access token | 1 小时 |
| Refresh token | 30 天 |

---

## 使用 Access Token

在 API 请求中包含 token：

```http
GET /api/...
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 可用作用域

| 作用域 | 说明 |
|--------|------|
| `openid` | OIDC 必需；返回 ID token |
| `profile` | 访问用户资料（昵称、头像等） |
| `email` | 访问邮箱地址 |
| `offline_access` | 请求 refresh token（需在配置中启用） |

---

## 用户信息端点

```http
GET /padlock/auth/open/userinfo
Authorization: Bearer {access_token}
```

**响应：**

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

始终以 discovery 文档作为端点 URL 和支持功能的真实来源：

```
https://api.solian.app/.well-known/openid-configuration
```

需要关注的关键字段：

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

`token_endpoint_auth_methods_supported` 中的 `"none"` 表示支持公开客户端。

---

## 示例：单页应用（PKCE）

```javascript
class OAuthClient {
  constructor(clientId, redirectUri) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.codeVerifier = null;
  }

  async startAuth() {
    // 生成 PKCE 参数
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
    const state = this.generateState();

    // 存储 verifier 和 state 供回调使用
    sessionStorage.setItem('pkce_verifier', this.codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // 构建授权 URL
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // 重定向到授权端点
    window.location.href = `/padlock/auth/open/authorize?${params}`;
  }

  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // 验证 state 防止 CSRF
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State 不匹配');
    }

    const codeVerifier = sessionStorage.getItem('pkce_verifier');

    // 用授权码换取 token
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

## 示例：设备码流程（CLI 工具）

```javascript
// 步骤 1：请求设备码
const device = await fetch("https://api.solian.app/padlock/auth/open/device/code", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: "my-cli-tool",
    scope: "openid profile email"
  })
}).then((res) => res.json());

console.log(`请访问 ${device.verification_uri} 并输入代码 ${device.user_code}`);

// 步骤 2：轮询获取 token
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

  console.log("认证成功:", payload.access_token);
  break;
}
```

---

## 安全注意事项

### State 参数

始终使用随机的 `state` 值来防止 CSRF 攻击。在回调中验证其匹配后再交换代码。

### PKCE

- 公开客户端**必须**使用 PKCE
- 机密客户端也应使用 PKCE 作为最佳实践
- 永远不要在前端代码或移动应用中暴露 `client_secret`

### 重定向 URI 验证

| 应用状态 | 验证 |
|----------|------|
| 开发中 | 关闭（允许任何 URI） |
| 预发布 | 关闭（允许任何 URI） |
| 生产 | 启用（必须匹配注册的 URI） |

请安全地存储你的 token。Access token 1 小时后过期；使用 refresh token 维持会话。

---

## 错误响应

| 错误 | 说明 |
|------|------|
| `invalid_request` | 缺少或无效的参数 |
| `unauthorized_client` | 客户端未找到或未授权 |
| `invalid_client` | 客户端凭据无效 |
| `invalid_grant` | 授权码/刷新码无效或已过期 |
| `unsupported_grant_type` | 客户端不支持该授权类型 |
