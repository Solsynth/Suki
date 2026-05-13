---
title: Typography
description: Learn about Solsynth Works' typography standards and best practices.
---

Typography encompasses not only physical print publications but also the presentation of digital content.
Good typography enhances the readability and user experience of content. 
Solsynth Works has established a set of typography standards to ensure that all products and documentation achieve a consistently high level of visual and functional quality.

## Font Selection

- Use readable sans-serif fonts as the primary typeface. For example, the iconic brand font for Solar Network is **Nunito**. For CJK (Chinese, Japanese, and Korean) languages, the **Noto Sans** series can be used as a supplement.
- Avoid using too many different fonts; typically, limit usage to no more than two fonts (one for headings and one for body text) to maintain consistency.
- For scenarios requiring serif fonts, do not mix sans-serif and serif fonts on the same visually observable plane.

## Font Size and Line Height

- The recommended body font size is between 16px and 18px to ensure good readability.
- Heading font sizes should be adjusted according to their hierarchy to ensure a clear structure.
- Line height should not be set excessively large to avoid wasting space with too much whitespace and creating visual disconnection.
- A margin of 2x to 3x the font size can be added between different paragraphs to distinguish content blocks.
- When using non-CJK characters within Chinese text, add a space before and after them.
    - ✅ `这是一个 Solsynth Works 标准的例子。我们的稳定性达到了 100%，真是可喜可贺！` (This is an example of a Solsynth Works standard. Our stability has reached 100%, which is truly gratifying!)
    - ❌ `这是一个Solsynth Works标准的例子。我们的稳定性达到了100%，真是可喜可贺！`
- Pay attention to languages with case distinctions (such as English) and use the correct capitalization for brand names.
    - ✅ `Solian / Solar Network / iPhone / iOS / macOS`
    - ❌ `solian / solar network / Iphone / ios / MacOS`
    - For brand names without a clearly defined capitalization, use Title Case (capitalize the first letter of each word).
    - ✅ `Open Source / Pull Request / Code Review / Android`
    - ❌ `open source / pull request / code review / android`

## Wording and Diction

- Use concise and clear language, avoiding complex sentence structures.
- Avoid excessive jargon. Ensure content is accessible to a broad audience by providing clear explanations when technical terms are first mentioned. Additionally, it is recommended to include the original term in parentheses after the first mention of foreign words.
- If using honorifics (polite language), ensure they are used consistently throughout the entire article. If using non-honorifics, maintain that tone throughout; avoid mixing them.
- Use appropriate punctuation. Choose between Chinese and English punctuation based on the primary language of the sentence, and avoid mixing them.
- Since emojis display inconsistently across different platforms and devices—and most of them aren't particularly cute—it is recommended to avoid using emojis in formal documentation. Instead, use Kaomoji or ASCII art to express emotions or emphasize content.

## Markdown Writing

Most of Solsynth Works' documentation and content are written in Markdown format.
Due to the specific nature of Markdown, 
an additional blank line is required to be treated as a new paragraph.
Therefore, without using soft breaks, 
please ensure that each line in the source file does not exceed 80 characters, 
and must not exceed the editor width of VS Code with default sidebars enabled on a 14-inch screen.
Additionally, please ensure there is a blank line between different syntax blocks to ensure correct rendering and clear readability of the source file.
