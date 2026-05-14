---
title: Stickers & Sticker Packs
description: Learn about the sticker system on Solar Network
---

Stickers are custom emojis on Solar Network.
You can upload images to create emojis, which can be used in almost all places that support Markdown rich text.

## Creation

Stickers belong to Sticker Packs, and Sticker Packs belong to Publishers. Therefore, you need a Publisher to create stickers.
You can refer to the "Publishers" section to learn more.

Sticker Packs support custom icons. If no icon is specified, the first sticker in the pack will be used as the Sticker Pack's icon.

## Rendering Logic

Stickers on Solar Network feature adaptive sizing. If a block of text contains only a single sticker, it will be rendered in an enlarged size; otherwise, it will use the normal size.

- Enlarged: `80x80`
- Normal: `20x20`

Therefore, you need to upload images that are at least `80x80` pixels to ensure they display clearly.

## Usage

In the Solian App, the chat box provides an expandable panel on the left, which helps you select and insert stickers into your messages.
For other places, you can use stickers by manually typing the sticker placeholder. The format is `:prefix+slug:`.
Here, `prefix` is the Sticker Pack prefix, and `slug` is the alias set when the sticker was created.

In most input fields, as soon as you type the first colon and wait a moment, Solian will trigger autocomplete to help you complete the sticker placeholder.

Stickers from all Sticker Packs will appear in autocomplete regardless of subscription status, while only subscribed Sticker Packs will be displayed in the sticker picker.
However, subscription status does not affect whether a sticker is rendered or not.
