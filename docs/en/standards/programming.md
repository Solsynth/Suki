---
title: Coding Standards
description: Learn about Solsynth Works' coding standards and best practices.
---

Solsynth started as a software company, 
making the coding standards at Solsynth Works particularly critical.
We have established a set of coding standards to ensure code quality, 
consistency, and maintainability.

## Code Style

We adopt a unified code style guide to ensure consistency across the entire project.

1. Braces
    - Use K&R style braces.
    - The opening brace for function definitions and control structures should be on the same line as the keyword.
    - Example:
      ```c
      if (condition) {
          // code
      } else {
          // code
      }
      ```
2. Indentation
    - Use 4 spaces for indentation.
    - Do not use tabs.
3. Naming Conventions
    - Use camelCase for variables and functions.
        - Special languages (e.g., C#) follow their community conventions.
    - Use ALL_CAPS with underscores for constants (e.g., `MAX_VALUE`).
        - For C#, use PascalCase (e.g., `MaxValue`).
        - For Dart, use camelCase with a leading <kbd>k</kbd> (e.g., `kMaxValue`).
4. Comments
    - We Solsynthizers pride ourselves on having good coding habits and always writing Clean Code.
    - Therefore, we refrain from adding comments to our code unless dealing with highly complex logic/algorithms or specific edge cases.
    - Our philosophy is that our code is self-documenting. If an AI can understand our code but you can't, it simply means you need to improve your programming skills.
    - For external contributors: If a Solsynthizer cannot understand your code during a PR review, and you haven't provided comments, we suggest you work on your programming skills, close that PR, and call it a night.

## Implementation Style

While over-engineering is discouraged, 
Solsynthizers should still strive for elegant and efficient code implementation.
Furthermore, judging by our current Team Leader's preferences, 
if you are building a system (e.g., an account activation module) that could be reused elsewhere (e.g., for password resets using the same data structure and logic), 
you should ensure sufficient extensibility during development. This includes, but is not limited to:

1. Neutral Naming
    - Avoid overly specific names to ensure the code can be reused across different scenarios.
2. Modular Design
    - Break functionality into independent modules for easier maintenance and reuse.
3. Sufficient Configurability
    - Provide configuration options to adapt to various use cases.
