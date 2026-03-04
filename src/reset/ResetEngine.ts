import { App, TFile, Vault } from "obsidian";
import { PluginSettings } from "../types";
import { FrontmatterParser } from "./FrontmatterParser";
import { Notifier } from "../ui/Notifier";
import { computeNextReview } from "../scheduler/SpacedRepetition";
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

    // Check if file has DSA tag
    const hasDsa = await parser.hasDsaTag(activeFile, this.settings.dsaTag);
    if (!hasDsa) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }

    try {
      // Read current frontmatter
      const frontmatter = await parser.read(activeFile);
      const today = new Date().toISOString().split("T")[0];

      // Calculate updates
      const updates: Parameters<typeof parser.update>[1] = {
        attempts: frontmatter.attempts + 1,
        last_attempt: today,
      };

      // Compute next review date if spaced repetition is enabled
      if (this.settings.spacedRepetitionEnabled) {
        updates.next_review = computeNextReview(
          frontmatter.attempts + 1,
          this.settings.reviewIntervalDays
        );
      }

      // Update frontmatter
      await parser.update(activeFile, updates);

      // Clear the solution section
      await this.clearSolutionSection(activeFile);

      // Refresh the indexer
      await this.indexer.refreshFile(activeFile.path);

      // Notify success
      Notifier.success(
        `Problem reset! Attempts: ${frontmatter.attempts + 1}`
      );
    } catch (error) {
      console.error("Reset failed:", error);
      Notifier.error("Failed to reset problem. Check console for details.");
    }
  }

  /**
   * Clear the solution section content while preserving the heading
   */
  private async clearSolutionSection(file: TFile): Promise<void> {
    const vault = this.app.vault;
    const content = await vault.read(file);

    const heading = this.settings.solutionHeading;
    const headingRegex = new RegExp(
      `^(${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*\\n[\\s\\S]*?(?=\\n## |\\n# |\\n*$|$)`,
      "m"
    );

    const match = content.match(headingRegex);

    if (match) {
      // Keep the heading, clear the content after it
      const newContent = content.replace(
        headingRegex,
        `${heading}\n\n`
      );
      await vault.modify(file, newContent);
    }
  }
}
