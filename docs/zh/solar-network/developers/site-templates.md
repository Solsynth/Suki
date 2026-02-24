---
title: 站点模版
---

本指南说明如何为 DysonNetwork.Zone 的 `FullyManaged` 模式构建基于模版的站点。

## 概述

在 `FullyManaged` 模式下，Zone 会在请求时渲染来自站点文件存储的 `.liquid` 文件。

- `.liquid` 文件：由 DotLiquid 渲染
- 非 `.liquid` 文件：作为静态文件提供（css/js/图片/字体等）

## 上传和管理文件

使用以下文件 API：

- `GET /zone/sites/{siteId}/files`
- `POST /zone/sites/{siteId}/files/upload`
- `POST /zone/sites/{siteId}/files/folder`
- `PUT /zone/sites/{siteId}/files/edit/{**relativePath}`
- `DELETE /zone/sites/{siteId}/files/delete/{**relativePath}`
- `POST /zone/sites/{siteId}/files/deploy`（zip 部署）

创建文件夹示例：

```http
POST /zone/sites/{siteId}/files/folder
Content-Type: application/json

{
  "path": "templates/partials"
}
```

## 路由解析规则

Zone 按以下顺序解析路由：

1. 约定查找

- `/` -> `index.html.liquid`
- `/foo` -> `foo.html.liquid`
- `/foo` -> `foo/index.html.liquid`
- 同样的检查也适用于 `templates/` 下

1. 可选清单查找

- `routes.json` 或 `templates/routes.json`

1. 回退 404 模版

- `404.html.liquid` 或 `templates/404.html.liquid`

如果没有任何模版/静态文件匹配，请求将回退到应用默认路由。

## 布局和局部模版

### 布局

如果当前模版不是 `layout.html.liquid`，Zone 将查找：

- `layout.html.liquid`，然后
- `templates/layout.html.liquid`

如果找到，渲染的页面内容将被注入到 `content_for_layout` 中。

布局使用示例：

```liquid
<!doctype html>
<html>
  <body>
    {{ content_for_layout }}
  </body>
</html>
```

### 局部模版

您的主题可以使用 Shopify 风格的 `render`：

```liquid
{% render 'head' %}
{% render 'article', post: post %}
```

Zone 将 `render` 注册到 DotLiquid include 行为中，并解析如下候选文件：

- `templates/head.html.liquid`
- `templates/head.liquid`
- `head.html.liquid`
- `head.liquid`

## `routes.json` 格式

放置在根目录或 `templates/routes.json`。

```json
{
  "routes": [
    {
      "path": "/",
      "template": "templates/index.html.liquid",
      "page_type": "home",
      "data": {
        "mode": "posts_list",
        "order_by": "published_at",
        "order_desc": true,
        "page_size": 10,
        "types": ["article"]
      }
    },
    {
      "path": "/posts/{slug}",
      "template": "templates/post.html.liquid",
      "page_type": "post",
      "data": {
        "mode": "post_detail",
        "slug_param": "slug"
      }
    },
    {
      "path": "/github",
      "redirect_to": "https://github.com/your-org/your-repo",
      "redirect_status": 302
    }
  ]
}
```

支持的路由字段：

- `path`（支持 `{param}` 段占位符）
- `template`
- `redirect_to`（可选重定向目标 URL/路径）
- `redirect_status`（可选；支持 301、302、307、308；默认 302）
- `page_type`（可选）
- `data.mode`：`posts_list` | `post_detail` | `none`
- `data.order_by`、`data.order_desc`、`data.page_size`、`data.types`、`data.publisher_ids`、`data.categories`、`data.tags`、`data.query`、`data.include_replies`、`data.include_forwards`、`data.slug_param`
- `query_defaults` 在模式中被接受，但目前在运行时未应用。

## 可用的模版变量

Zone 注入的顶级变量：

- `site`
- `publisher`
- `route`
- `page`
- `posts`
- `post`
- `page_type`
- `asset_url`
- `base_url`
- `config`
- `theme`
- `locale`
- `now`
- `open_graph_tags`
- `feed_tag`
- `favicon_tag`
- `content_for_layout`（仅在使用布局包装时）

### `site`

- `id`、`slug`、`name`、`description`、`mode`、`publisher_id`、`config`

### `publisher`

- `id`、`type`、`name`、`nick`、`bio`
- `picture_url`、`background_url`
- `picture`（`id`、`name`、`mime_type`、`size`、`url`）（如果存在）
- `background`（`id`、`name`、`mime_type`、`size`、`url`）（如果存在）

### `route`

- `path`
- `query`（字典）
- `params`（来自 `{param}` 的字典）
- `index`、`page`

### `page`（列表页面）

- `title`、`description`、`posts`
- `current`、`total`、`total_size`
- `prev_link`、`next_link`、`pagination_html`

### `post` / `page.posts` 项

- `id`、`title`、`description`、`slug`
- `layout`、`content`、`excerpt`
- `path`、`url`
- `thumbnail_id`、`thumbnail_url`
- `photos`（图片 URL）
- `attachments`（包含 `id`、`name`、`url`、`mime_type`、`size`、`width`、`height`、`is_image` 的对象）
- `word_count`、`published_at`
- `categories[]`、`tags[]`

`thumbnail_url` 解析顺序：

1. `post.meta.thumbnail` 文件 id（`/drive/files/{id}`）
2. `photos` 中的第一张图片（仅限 `article`）
3. `null`

## 最小启动结构

```text
/
  index.html.liquid
  layout.html.liquid
  404.html.liquid
  routes.json
  css/style.css
  js/site.js
  templates/
    head.html.liquid
    article.html.liquid
```

## 示例模版

### `index.html.liquid`

```liquid
<h1>{{ site.name }}</h1>

{% for post in page.posts %}
  {% render 'article', post: post %}
{% endfor %}
```

### `templates/article.html.liquid`

```liquid
<article>
  <h2><a href="{{ post.path }}">{{ post.title }}</a></h2>
  <p>{{ post.excerpt }}</p>
</article>
```

## 主题提示

- 将所有主题局部模版保留在 `templates/` 下以获得可预测的查找。
- 将 CSS/JS/字体/图片放在静态文件夹（`css/`、`js/`、`images/`）中，并使用根相对 URL 引用。
- 使用 `site.config` 进行站点级别的样式切换/内容决策。
- 优先使用路由清单处理文章详情页面（`/posts/{slug}`），而不是在模版中硬编码路径解析。

### 可选的资源最小化

要启用静态 CSS/JS 响应的运行时最小化：

```json
{
  "auto_minify_assets": true
}
```

注意事项：

- 适用于 `FullyManaged` 静态资源和 `SelfManaged` 文件服务。
- 仅 `.css` 和 `.js` 被最小化。
- `*.min.css` 和 `*.min.js` 文件不会被重新最小化。

## 渲染标签、分类和附件

### 分类

```liquid
{% if post.categories and post.categories.size > 0 %}
  <ul class="post-categories">
    {% for category in post.categories %}
      <li><a href="{{ category.path }}">{{ category.name }}</a></li>
    {% endfor %}
  </ul>
{% endif %}
```

### 标签

```liquid
{% if post.tags and post.tags.size > 0 %}
  <ul class="post-tags">
    {% for tag in post.tags %}
      <li><a href="{{ tag.path }}">#{{ tag.name }}</a></li>
    {% endfor %}
  </ul>
{% endif %}
```

### 附件（通用）

```liquid
{% if post.attachments and post.attachments.size > 0 %}
  <ul class="post-attachments">
    {% for file in post.attachments %}
      <li>
        <a href="{{ file.url }}" target="_blank" rel="noopener">
          {{ file.name | default: file.id }}
        </a>
        {% if file.mime_type %} ({{ file.mime_type }}){% endif %}
      </li>
    {% endfor %}
  </ul>
{% endif %}
```

### 附件（仅图片）

```liquid
{% if post.attachments and post.attachments.size > 0 %}
  <div class="post-gallery">
    {% for file in post.attachments %}
      {% if file.is_image %}
        <img src="{{ file.url }}" alt="{{ file.name }}" loading="lazy" />
      {% endif %}
    {% endfor %}
  </div>
{% endif %}
```

### 现有快捷方式：`post.photos`

如果您只需要图片 URL，`post.photos` 仍然可用：

```liquid
{% for image in post.photos %}
  <img src="{{ image }}" alt="" loading="lazy" />
{% endfor %}
```

### 调试嵌套值（`photos`、`attachments`、`tags`、`categories`）

当您直接输出整个对象时，DotLiquid 可能会打印 CLR 类型名称。
使用以下内置过滤器获得可读输出：

```liquid
{{ post | json }}
{{ post.attachments | json }}
{{ post.tags | json }}
{{ post.categories | inspect }}
```

### Markdown 内容中的 LaTeX

Zone Markdown 渲染现在支持 LaTeX 语法：

- 行内：`$E = mc^2$`
- 块级：

```markdown
$$
\int_0^1 x^2 \, dx
$$
```

注意：这解析 Markdown 中的数学语法。您的主题仍然需要前端数学渲染器
如 `layout.html.liquid` 中的 MathJax/KaTeX 来视觉排版公式。

## 当前限制

- `routes.json` 中的 `query_defaults` 尚未应用。
- `asset_url` 目前默认为空字符串；对资源使用根相对路径。
- `open_graph_tags`、`feed_tag` 和 `favicon_tag` 是占位符（默认为空）。

## 每个站点的 RSS 配置

RSS 通过 `site.config.rss`（在站点创建/更新 API 载荷中）配置。
您可以选择性地设置顶级 `base_url` 来控制 RSS 和站点地图中生成的绝对 URL。

示例：

```json
{
  "base_url": "https://blog.example.com",
  "rss": {
    "enabled": true,
    "path": "/feed.xml",
    "source_route_path": "/posts",
    "title": "My Site Feed",
    "description": "Latest updates",
    "order_by": "published_at",
    "order_desc": true,
    "item_limit": 30,
    "types": ["article", "moment"],
    "publisher_ids": [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ],
    "include_replies": false,
    "include_forwards": true,
    "categories": ["tech"],
    "tags": ["dotnet"],
    "query": "release",
    "content_mode": "excerpt",
    "post_url_pattern": "/posts/{slug}"
  }
}
```

字段：

- `enabled`：为此站点打开/关闭 RSS
- `path`：提供 RSS 的请求路径（例如 `/feed.xml`）
- `source_route_path`：可选路由路径（来自 `routes.json`）以重用常规文章页面过滤器
- `title`、`description`：feed 元数据覆盖
- `order_by`、`order_desc`、`item_limit`：文章选择和排序
- `types`：`article` 和/或 `moment`
- `publisher_ids`：feed 的自定义发布者范围（如果为空，仅使用站点发布者）
- `include_replies`：包含/排除回复文章
- `include_forwards`：包含/排除转发文章
- `categories`、`tags`、`query`：额外的文章过滤器
- `content_mode`：`excerpt` | `html` | `none`
- `post_url_pattern`：支持 `{slug}` 和 `{id}`

注意事项：

- RSS 服务适用于 `FullyManaged` 站点（在站点中间件中解析）。
- 请求仍必须针对站点上下文（例如在网关/内部路由流中使用 `X-SiteName`）。
- 当设置 `source_route_path` 时，RSS 可以继承路由 `data` 过滤器（如 `types`、`categories`、`tags`、`query`、`publisher_ids`）；显式 RSS 字段仍优先。
- `base_url`（或 `site.config.base_url`）在构建 feed 链接时覆盖请求主机。

## 每个站点的站点地图配置

站点地图通过站点创建/更新载荷中的顶级 `sitemap` 配置（存储在 `site.config.sitemap` 中）。

示例：

```json
{
  "base_url": "https://blog.example.com",
  "sitemap": {
    "enabled": true,
    "path": "/sitemap.xml",
    "source_route_path": "/posts",
    "item_limit": 2000,
    "order_by": "published_at",
    "order_desc": true,
    "types": ["article", "moment"],
    "publisher_ids": [
      "11111111-1111-1111-1111-111111111111"
    ],
    "include_replies": false,
    "include_forwards": true,
    "categories": ["tech"],
    "tags": ["dotnet"],
    "query": "release",
    "post_url_pattern": "/posts/{slug}",
    "include_home": true,
    "include_route_paths": true
  }
}
```

字段：

- `enabled`：为此站点打开/关闭站点地图
- `path`：提供站点地图的请求路径（例如 `/sitemap.xml`）
- `source_route_path`：可选路由路径（来自 `routes.json`）以重用常规文章页面过滤器
- `item_limit`、`order_by`、`order_desc`：文章选择和排序
- `types`：`article` 和/或 `moment`
- `publisher_ids`：自定义发布者范围（如果为空，仅使用站点发布者）
- `include_replies`、`include_forwards`：包含/排除回复和转发文章
- `categories`、`tags`、`query`：额外的文章过滤器
- `post_url_pattern`：支持 `{slug}` 和 `{id}`
- `include_home`：在站点地图中包含站点根 URL
- `include_route_paths`：包含来自 `routes.json` 的静态路径（仅非参数路由）

注意事项：

- 站点地图服务适用于 `FullyManaged` 站点（在站点中间件中解析）。
- 请求必须针对站点上下文（例如在网关/内部路由流中使用 `X-SiteName`）。
- `base_url`（或 `site.config.base_url`）在构建站点地图 URL 时覆盖请求主机。

## 故障排除

### 模版未找到

- 验证路由约定和实际文件名。
- 检查文件是否上传到站点根目录或 `templates/`。

### 未渲染文章

- 确认 `routes.json` 中的路由 `data.mode` 和 `types`。
- 验证发布者有可用的文章。
