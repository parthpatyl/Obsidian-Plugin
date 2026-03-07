# Obsidian DSA Tracker Plugin

Track, manage, and execute Data Structures and Algorithms (DSA) practice problems directly in Obsidian, featuring built-in analytics, Java code execution, and automatic spaced repetition.

## Supported Features

-   **Dashboard & Analytics**: View a global summary of your DSA progress, including total problems, attempt counts, solved statuses, and a breakdown by topics and difficulties.
-   **In-Built Code Runner**: Execute Java code blocks directly against custom test cases formatted in your markdown notes.
-   **Automated Tracking**: The plugin dynamically tracks `time_spent_minutes`, increments `attempts`, and records the `last_attempt` date whenever you practice or run solutions.
-   **Spaced Repetition**: Automatically calculates and schedules the `next_review` date based on built-in spaced repetition intervals for effective learning.
-   **Problem Resetting**: Clear your previous solutions and start fresh on a problem with a single command to enforce repetition and mastery.
-   **Problem Creator**: Quickly scaffold new DSA problem notes with all required frontmatter and formatting applied.

## Usage & Commands

You can access the plugin's features via the command palette (Cmd/Ctrl + P):

-   **Open DSA Dashboard**: View your overall progress and analytics.
-   **Create New DSA Problem** (*Cmd/Ctrl + Shift + P*): Scaffolds a new note with required structure.
-   **Run Solution** (*Cmd/Ctrl + Shift + R*): Compiles and runs the Java code block in your active note against your defined test cases.
-   **Reset DSA Problem**: Clears the solution block in the active note to let you solve it again from scratch.
-   **Mark Problem as Solved**: Flags the current problem as solved and schedules the next review.
-   **Re-index DSA Vault**: Forces an update of the global analytics index.

## Writing Test Cases

To use the **In-Built Code Runner**, format your `Examples` section precisely with test cases like so:

```markdown
### Examples

- **Input:** `nums = [2,7,11,15]`, `target = 9`
- **Output:** `[0,1]`

- **Input:** `nums = [3,2,4]`, `target = 6`
- **Output:** `[1,2]`
```
Your solution logic must be contained entirely within a ```` ```java ```` block and must contain a `class Solution` with a public method.

## Required Frontmatter

The plugin relies on the following YAML frontmatter properties to function correctly. The **Problem Creator** command adds these automatically:

```yaml
tags: [dsa]
topic: Array
difficulty: Easy
attempts: 0
last_attempt: ""
time_spent_minutes: 0
next_review: ""
solved: false
```
