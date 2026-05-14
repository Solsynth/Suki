---
title: Posts, Publishing & Discovery
description: Learn about Posts, the primary community feature on Solar Network.
---

# Posts, Publishing & Discovery

Posts are the main content type featured on the Explore page. Posts belong to Publishers and will respect the Publisher's specific settings.

## Content

Solar Network posts support full CommonMark, parts of GitHub Flavored Markdown, as well as some custom syntax.

### Solar Network Flavored Markdown

This section introduces Solar Network's special Markdown syntax.

#### Highlight
Similar to Obsidian, use the `==Text==` syntax.

#### Spoiler / Hidden Text
Use the `=!Text!=` syntax. Click to reveal.

!!! warning

    If you use this syntax in a post, please include some introductory text at the beginning (around 80 characters). Otherwise, push notifications might accidentally "spoil" the hidden content!

#### Stickers
You can use stickers in your posts as well—simply type the placeholder, for example: `:prefix+slug:`.

#### Post Attachments
Use the standard Markdown syntax `![](url)`.
However, if you enter `solian://files/<id>` as the URL, it will load our native attachment preview for a better display experience, including features like zooming.

### Attachments

Solar Network posts support a wide variety of file types, from images and audio to general files. All are supported, and you can mix and match them, adding up to 16 attachments at once! <del>Way ahead of the competition.</del>

For posts containing only images, the client will use a featured carousel display. For posts with mixed attachments, the client will fall back to a standard horizontal scroll list to ensure usability.

### Tags & Categories

Adding tags and categories to your posts helps our recommendation algorithm suggest your content to interested users, increasing your initial exposure.

However, abusing tags and categories violates the ToS and may result in warnings or suspension. Don't be naughty!

## Feed Ranking Algorithm

Solar Network's feed (timeline) ranking uses a multi-level scoring system to ensure we recommend the most relevant and interesting content to you.

### Ranking Modes

You can choose different browsing modes:

| Mode | Description |
|------|-------------|
| Personalized | Recommends content based on your interests (Default) |
| Trending | Sorted by interaction热度 (popularity) |
| Latest | Sorted in reverse chronological order by publish time |

### Scoring Factors

#### Base Score
Posts are first assigned a base score calculated from the following factors:
- **Reaction Score**: Calculated based on the sentiment of reactions.
    - Positive reaction: +2 points
    - Neutral reaction: +1 point
    - Negative reaction: -2 points
- **Reply Count**: The number of replies a post receives.
- **Appreciation Score**: Appreciation received on the post.
- **Article Bonus**: Article-type posts receive extra base points.
- **Time Decay**: As time passes, the score of older posts gradually decreases.

#### Personalized Score
For logged-in users, the system further adjusts the ranking based on your interests:

**Interest Sources**:
- Reactions you add to posts.
- Replies you publish.
- Posts you have viewed (limited per user per day).
- Content you explicitly mark as "Interested" or "Not Interested".

**Interest Tags**:
The system tracks your interest in the following:
- Tags
- Categories
- Publishers

Interests decay over time, so your recent behavior influences recommendations more than your past behavior.

#### Publisher Bonus
A Publisher's Social Trust Score also provides an additional ranking bonus for their posts. Publishers with higher trust scores receive a slight boost in recommendations.

#### Filtering & Diversity
In Personalized mode, the system also applies:
1. **Strength Filtering**: Filters out posts with low interest matching.
2. **Diversity Protection**: Ensures your feed isn't dominated by content from a single publisher.

### Feedback & Adjustment

You can influence recommendations in the following ways:
- Liking or Disliking posts.
- Choosing to "Hide" a publisher.
- Adjusting interest preferences in settings.

These actions directly affect the recommended content you see subsequently.

### Why wasn't my post recommended?

If your post wasn't recommended, it could be due to the following reasons:
1. **Late Posting**: Time decay causes older posts to lose score.
2. **Low Interaction**: Reactions, replies, and appreciation all affect the score.
3. **Low Interest Match**: Your post might not match the interests of the target audience.
4. **Low Publisher Trust Score**: This affects the base ranking bonus.
5. **Marked as Not Interested**: If you or your followers have expressed disinterest in similar content.

## Publishing Settings

You can configure the default publisher used when posting, replying, and interacting with the Fediverse.

### Where to Set
Go to **Account** > **Account Settings** > **Publishing Settings**.

### Configurable Items

| Setting | Description |
|---------|-------------|
| Default Post Publisher | The publisher used when creating new posts. |
| Default Reply Publisher | The publisher used when replying to posts. |
| Default Fediverse Publisher | The publisher used for Fediverse (e.g., Mastodon) interactions like following, boosting, and reacting. |

### Setting Priority
When you perform an action, the system selects a publisher in the following order:
1. **Manual Selection**: If you explicitly choose a publisher while posting, your choice takes precedence.
2. **Default Settings**: If you have configured a default publisher, the system uses your set default.
3. **Auto Selection**: Uses the first eligible publisher you own.

### Usage Scenarios

**Scenario 1: Separating Personal and Organization Identities**
You have two publishers:
- `@MyPersonalAccount` (Individual Publisher)
- `@MyCompany` (Organization Publisher)

You want to:
- Use `@MyPersonalAccount` for personal posts.
- Use `@MyCompany` when replying to others.
- Use `@MyCompany` for Fediverse interactions.

Simply configure these three items separately in your publishing settings.

**Scenario 2: Only One Publisher**
If you only have one publisher, the system will automatically use it, and no extra configuration is needed.

**Scenario 3: Fediverse Publisher**
After configuring a default Fediverse publisher, it will be automatically used for the following actions on platforms like Mastodon:
- Following/Unfollowing users.
- Boosting posts.
- Adding reactions to posts.

### Notes
- You must be a member of a publisher to set it as default.
- A Fediverse publisher must have Fediverse functionality enabled before it can be set as default.
- If your set Fediverse publisher later disables this feature, the system will automatically fall back to another available publisher.
