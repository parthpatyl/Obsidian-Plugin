import { App, TFile } from "obsidian";
import { PluginSettings } from "../types";
import { FrontmatterParser } from "./FrontmatterParser";
import { Notifier } from "../ui/Notifier";
import { VaultIndexer } from "../vault/VaultIndexer";

export class ResetEngine {
  private app: App;
  private settings: PluginSettings;
  private indexer: VaultIndexer;

  constructor(app: App, settings: PluginSettings, indexer: VaultIndexer) {
    this.app = app;
    this.settings = settings;
    this.indexer = indexer;
  }

  async run(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      Notifier.error("No file is open.");
      return;
    }

    if (!activeFile.name.endsWith(".md")) {
      Notifier.error("Not a markdown file.");
      return;
    }

    const parser = new FrontmatterParser(this.app);

    // Check if file has DSA tag - synchronous check
    if (!parser.hasDsaTag(activeFile, this.settings.dsaTag)) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }

    try {
      // Read current frontmatter to get existing attempt count
      const current = parser.read(activeFile);
      const newAttempts = current.attempts + 1;
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Compute next review date based on spaced repetition settings
      let nextReview = "";
      if (this.settings.spacedRepetitionEnabled) {
        const interval = this.settings.reviewIntervalDays * newAttempts;
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() + interval);
        nextReview = reviewDate.toISOString().split("T")[0];
      }

      // Update frontmatter: bump attempts and dates; zero out time/hints for fresh attempt
      const updates = {
        attempts: newAttempts,
        last_attempt: today,
        time_spent_minutes: 0,
        next_review: nextReview,
        solved: false,
      };

      // Apply frontmatter updates
      await parser.update(activeFile, updates);

      // Robustly clear the solution section in the file content
      await this.clearSolutionSection(activeFile);

      // Refresh the indexer
      await this.indexer.refreshFile(activeFile.path);

      // Notify success
      Notifier.success(`Problem reset! Attempt #${newAttempts} — good luck!`);
    } catch (error) {
      console.error("Reset failed:", error);
      Notifier.error("Failed to reset problem. Check console for details.");
    }
  }


  /**
   * Clear the solution section content while preserving the heading.
   * Uses indexOf for completely predictable string matching — no regex pitfalls.
   */
  private async clearSolutionSection(file: TFile): Promise<void> {
    const vault = this.app.vault;
    const content = await vault.read(file);

    const heading = this.settings.solutionHeading; // e.g. "## My Solution"

    // Find where the heading starts
    const headingIdx = content.indexOf(`\n${heading}`);
    if (headingIdx === -1) return;

    // The heading line ends after heading text + possible trailing whitespace
    const headingLineEnd = content.indexOf("\n", headingIdx + 1);
    if (headingLineEnd === -1) {
      // Heading is the last line in the file — just keep the heading
      const newContent = content.substring(0, headingIdx + 1) + heading + "\n\n";
      await vault.modify(file, newContent);
      return;
    }

    // Search for the next heading (## or #) after the solution heading
    const afterHeading = content.substring(headingLineEnd + 1);
    const nextHeadingMatch = afterHeading.match(/^#{1,6} /m);
    const sectionContent = nextHeadingMatch && nextHeadingMatch.index !== undefined
      ? afterHeading.substring(0, nextHeadingMatch.index)
      : afterHeading;

    // Try to extract and preserve the Java template
    let preservedTemplate = "";
    const javaMatch = sectionContent.match(/```java\n([\s\S]*?)```/);
    if (javaMatch) {
      const code = javaMatch[1];
      // Regex to find: class Solution { ... public ReturnType methodName(Args) {
      const classMethodMatch = code.match(/(class\s+Solution\s*\{[\s\S]*?public\s+[\w<>[\]\s]+\s+\w+\s*\([^)]*\)\s*\{)/);
      if (classMethodMatch) {
        preservedTemplate = `\n\`\`\`java\n${classMethodMatch[1]}\n        \n    }\n}\n\`\`\`\n`;
      }
    }

    let newContent: string;
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      // Keep everything before heading + heading + preserved template + everything from next heading onward
      const remainingContent = afterHeading.substring(nextHeadingMatch.index);
      newContent = content.substring(0, headingIdx + 1) + heading + "\n" + preservedTemplate + "\n" + remainingContent;
    } else {
      // No subsequent heading — clear everything after the solution heading, insert template
      newContent = content.substring(0, headingIdx + 1) + heading + "\n" + preservedTemplate + "\n";
    }

    await vault.modify(file, newContent);
  }

}
