---
title: Sponsored Posts
description: Promote your posts with the ad bidding system
---

Sponsored posts allow you to boost visibility of your public posts using **Golden Points (Golds)**.

## How It Works

Sponsored posts use a competitive bidding system. You spend golds to bid on ad placement for your post. Every hour, a weighted auction determines which sponsored post wins the ad slot.

## Bidding

- **Minimum bid:** 5 golds
- **Bid duration:** 24 hours from confirmation
- **Auction cycle:** Every hour (at the top of each UTC hour)

Multiple users can bid on the same post — their bids pool together to increase that post's total weight. You can also place multiple bids on the same post over time.

## Winner Selection

At each hourly auction, the winning post is selected by weighted random:

- Posts with higher total active bids have proportionally higher chances of winning
- The winner is displayed at a fixed position in the timeline feed
- The post carries a `"sponsored": true` label in the API response

## Ad Cadence

Sponsored posts don't appear in every timeline request. The frequency depends on the viewer's perk level:

| Perk Level | Ad Frequency |
|------------|--------------|
| Normal | ~1 ad per 5 timeline requests |
| Perk 1 | ~1 ad per 10 requests |
| Perk 2 | ~1 ad per 20 requests |
| Perk 3+ | No ads |

## Analytics

Publisher members can view per-post ad performance including total bids, placements, and impression counts.
