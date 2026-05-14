# App Connect 认证协议

本文档介绍使用 Solian 应用进行原生应用认证的推荐方式，即 App Connect 协议。
通过深度链接协议处理：

- `solian://auth/web`

该协议专为需要通过 Solian 应用进行挑战和令牌交换的原生应用设计（例如 iOS/Android 自定义 URI 方案）。

## 准备工作

在您的系统中安装 Solian 应用，并在开发者控制台中创建应用（Custom Apps）和密钥，密钥类型选择 App Connect。

## 概述

支持两种深度链接调用：

1. 挑战请求
2. 令牌交换请求

两种调用都需要 `redirect_uri`，以便 Solian 将结果数据返回给您的应用。

## 挑战请求

使用以下 URL 格式：

```text
solian://auth/web?app=<app_slug>&redirect_uri=<encoded_redirect_uri>&state=<optional_state>
```

参数：

- `app`：应用 slug（必填）。Solian 通过 `/develop/apps/<slug>` 解析应用元数据。
- `redirect_uri`：您的应用回调 URI（必须包含方案），例如 `acme://auth/callback`。
- `state`（可选）：Solian 会回显的不透明值。

成功回调：

```text
<redirect_uri>?status=ok&challenge=<challenge>&state=<state>
```

拒绝回调：

```text
<redirect_uri>?status=denied&state=<state>
```

错误回调：

```text
<redirect_uri>?status=error&error=<reason>&state=<state>
```

## 令牌交换请求

在您的应用使用 App Connect 密钥签署挑战后，使用：

```text
solian://auth/web?signed_challenge=<signature>&redirect_uri=<encoded_redirect_uri>&state=<optional_state>
```

参数：

- `signed_challenge`：App Connect 签名（蛇形命名字段）。
- `redirect_uri`：您的应用回调 URI。
- `state`（可选）：回显的不透明值。

成功回调：

```text
<redirect_uri>?status=success&token=<session_token>&state=<state>
```

错误回调：

```text
<redirect_uri>?status=error&error=<reason>&state=<state>
```

## SDK 辅助工具

`WebAuthClient` 提供辅助构建器：

- `getProtocolChallengeUrl({ appSlug, redirectUri, state })`
- `getProtocolExchangeUrl({ signedChallenge, redirectUri, state })`

这些方法会生成正确编码的 `solian://auth/web` URL。

## Flutter 示例代码

<details>
<summary>点击展开 Flutter 示例代码</summary>

### 1. 构建深度链接 URL

```dart
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

class AppConnectHelper {
  static const String _scheme = 'solian';
  static const String _host = 'auth/web';

  /// 构建挑战请求 URL
  static Uri buildChallengeUrl({
    required String appSlug,
    required String redirectUri,
    String? state,
  }) {
    final params = {
      'app': appSlug,
      'redirect_uri': redirectUri,
      if (state != null) 'state': state,
    };

    return Uri(
      scheme: _scheme,
      host: _host,
      queryParameters: params,
    );
  }

  /// 构建令牌交换请求 URL
  static Uri buildExchangeUrl({
    required String signedChallenge,
    required String redirectUri,
    String? state,
  }) {
    final params = {
      'signed_challenge': signedChallenge,
      'redirect_uri': redirectUri,
      if (state != null) 'state': state,
    };

    return Uri(
      scheme: _scheme,
      host: _host,
      queryParameters: params,
    );
  }
}
```

### 2. 发起认证流程

```dart
class AuthService {
  final String _appSlug = 'your-app-slug';
  final String _redirectUri = 'myapp://auth/callback';

  /// 步骤 1: 请求挑战
  Future<String?> requestChallenge() async {
    final state = DateTime.now().millisecondsSinceEpoch.toString();
    final url = AppConnectHelper.buildChallengeUrl(
      appSlug: _appSlug,
      redirectUri: _redirectUri,
      state: state,
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      return state;
    }
    throw Exception('无法打开 Solian 应用');
  }

  /// 步骤 2: 交换令牌
  Future<String?> exchangeToken(String signedChallenge) async {
    final state = DateTime.now().millisecondsSinceEpoch.toString();
    final url = AppConnectHelper.buildExchangeUrl(
      signedChallenge: signedChallenge,
      redirectUri: _redirectUri,
      state: state,
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      return state;
    }
    throw Exception('无法打开 Solian 应用');
  }
}
```

### 3. 处理回调

```dart
import 'package:uni_links/uni_links.dart';

class CallbackHandler {
  StreamSubscription? _subscription;

  /// 监听深度链接回调
  void listen(void Function(Uri? uri) onCallback) {
    _subscription = uriLinkStream.listen((uri) {
      onCallback(uri);
    });
  }

  /// 解析回调参数
  static Map<String, String> parseCallback(Uri uri) {
    return uri.queryParameters;
  }

  /// 处理挑战回调
  static ChallengeResult handleChallengeCallback(Uri uri) {
    final params = parseCallback(uri);
    final status = params['status'];

    if (status == 'ok') {
      return ChallengeResult.success(
        challenge: params['challenge']!,
        state: params['state'],
      );
    } else if (status == 'denied') {
      return ChallengeResult.denied(state: params['state']);
    } else {
      return ChallengeResult.error(
        error: params['error'] ?? '未知错误',
        state: params['state'],
      );
    }
  }

  /// 处理令牌交换回调
  static ExchangeResult handleExchangeCallback(Uri uri) {
    final params = parseCallback(uri);
    final status = params['status'];

    if (status == 'success') {
      return ExchangeResult.success(
        token: params['token']!,
        state: params['state'],
      );
    } else {
      return ExchangeResult.error(
        error: params['error'] ?? '未知错误',
        state: params['state'],
      );
    }
  }

  void dispose() {
    _subscription?.cancel();
  }
}

/// 挑战回调结果
class ChallengeResult {
  final ChallengeStatus status;
  final String? challenge;
  final String? error;
  final String? state;

  ChallengeResult._({
    required this.status,
    this.challenge,
    this.error,
    this.state,
  });

  factory ChallengeResult.success({
    required String challenge,
    String? state,
  }) =>
      ChallengeResult._(
        status: ChallengeStatus.success,
        challenge: challenge,
        state: state,
      );

  factory ChallengeResult.denied({String? state}) =>
      ChallengeResult._(
        status: ChallengeStatus.denied,
        state: state,
      );

  factory ChallengeResult.error({
    required String error,
    String? state,
  }) =>
      ChallengeResult._(
        status: ChallengeStatus.error,
        error: error,
        state: state,
      );
}

enum ChallengeStatus { success, denied, error }

/// 令牌交换回调结果
class ExchangeResult {
  final ExchangeStatus status;
  final String? token;
  final String? error;
  final String? state;

  ExchangeResult._({
    required this.status,
    this.token,
    this.error,
    this.state,
  });

  factory ExchangeResult.success({
    required String token,
    String? state,
  }) =>
      ExchangeResult._(
        status: ExchangeStatus.success,
        token: token,
        state: state,
      );

  factory ExchangeResult.error({
    required String error,
    String? state,
  }) =>
      ExchangeResult._(
        status: ExchangeStatus.error,
        error: error,
        state: state,
      );
}

enum ExchangeStatus { success, error }
```

### 4. 完整使用示例

```dart
class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final AuthService _authService = AuthService();
  final CallbackHandler _callbackHandler = CallbackHandler();
  String? _pendingState;

  @override
  void initState() {
    super.initState();
    _callbackHandler.listen(_handleCallback);
  }

  @override
  void dispose() {
    _callbackHandler.dispose();
    super.dispose();
  }

  Future<void> _handleCallback(Uri? uri) async {
    if (uri == null) return;

    final result = CallbackHandler.handleChallengeCallback(uri);

    if (result.status == ChallengeStatus.success) {
      // 使用 App Connect 密钥签署挑战
      final signedChallenge = await _signChallenge(result.challenge!);

      // 交换令牌
      await _authService.exchangeToken(signedChallenge);
    } else if (result.status == ChallengeStatus.denied) {
      // 用户拒绝授权
    } else {
      // 发生错误
    }
  }

  Future<String> _signChallenge(String challenge) async {
    // 使用您的 App Connect 密钥签署挑战
    final key = 'your_app_connect_secret';
    final hmac = Hmac(sha256, utf8.encode(key));
    final digest = hmac.convert(utf8.encode(challenge));
    return digest.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('登录')),
      body: Center(
        child: ElevatedButton(
          onPressed: () async {
            _pendingState = await _authService.requestChallenge();
          },
          child: Text('使用 Solian 登录'),
        ),
      ),
    );
  }
}
```

</details>

## 注意事项

- Solian 期望 App Connect 负载使用蛇形命名字段。
- `redirect_uri` 必须是带有方案的有效 URI。
- 在回调中保留并验证 `state` 以防止请求混淆。
