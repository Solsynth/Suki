---
title: Semantic Search
description: Search posts using natural language understanding
---

Semantic Search lets you find posts using natural language queries, going beyond simple keyword matching.

## How It Works

Posts are indexed using AI-generated embeddings (vector representations). When you search:

1. Your query is converted to an embedding vector
2. The system finds posts with similar vectors using cosine distance
3. Results are ranked by semantic relevance

## Search Modes

| Mode | Description |
|------|-------------|
| Semantic (default) | Vector-based similarity search |
| Full-text | Traditional keyword search |

You can switch modes using the `searchEngine` query parameter:

```
GET /api/posts?search=your+query
GET /api/posts?search=your+query&searchEngine=fulltext
```

## When to Use Each Mode

- **Semantic:** Best for conceptual queries, finding related content, natural language questions
- **Full-text:** Best for exact keyword matches, specific terms, usernames
