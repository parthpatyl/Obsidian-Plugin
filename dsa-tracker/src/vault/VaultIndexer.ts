import { App, TFile, Vault } from "obsidian";
import { DSANote, DSAFrontmatter, PluginSettings, VaultStats } from "../types";
import { FrontmatterParser } from "../reset/FrontmatterParser";
import { isDueForReview } from "../scheduler/SpacedRepetition";

export class VaultIndexer {
  private app: App;
  private settings: PluginSettings;
  private notes: Map<string, DSANote> = new Map();
  private parser: FrontmatterParser;

  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
    this.parser = new FrontmatterParser(app);

    // Register vault event listeners
    this.registerEvents();
  }

  private registerEvents(): void {
    // Invalidate cache when files are modified
    this.app.vault.on("modify", (file) => {
      if (file instanceof TFile && file.name.endsWith(".md")) {
        this.refreshFile(file.path);
      }
    });

    // Remove from cache when files are deleted
    this.app.vault.on("delete", (file) => {
      if (file instanceof TFile) {
        this.notes.delete(file.path);
      }
    });

    // Handle renamed files
    this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof TFile) {
        const note = this.notes.get(oldPath);
        if (note) {
          this.notes.delete(oldPath);
          this.notes.set(file.path, { ...note, path: file.path });
        }
      }
    });
  }

  /**
   * Build or rebuild the entire index
   */
  async buildIndex(): Promise<void> {
    this.notes.clear();

    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      try {
        const hasDsa = this.parser.hasDsaTag(file, this.settings.dsaTag);
        if (hasDsa) {
          const frontmatter = this.parser.read(file);
          this.notes.set(file.path, {
            file,
            frontmatter,
            path: file.path,
          });
        }
      } catch (error) {
        console.warn(`Failed to index ${file.path}:`, error);
        // Skip files that fail to parse
      }
    }
  }

  /**
   * Refresh a single file in the index
   */
  async refreshFile(filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      this.notes.delete(filePath);
      return;
    }

    try {
      const hasDsa = this.parser.hasDsaTag(file, this.settings.dsaTag);
      if (hasDsa) {
        const frontmatter = this.parser.read(file);
        this.notes.set(filePath, {
          file,
          frontmatter,
          path: filePath,
        });
      } else {
        this.notes.delete(filePath);
      }
    } catch (error) {
      console.warn(`Failed to refresh ${filePath}:`, error);
      this.notes.delete(filePath);
    }
  }

  /**
   * Get all indexed DSA notes
   */
  getNotes(): DSANote[] {
    return Array.from(this.notes.values());
  }

  /**
   * Get vault statistics
   */
  getStats(): VaultStats {
    const notes = this.getNotes();

    const totalProblems = notes.length;
    const totalAttempts = notes.reduce(
      (sum, note) => sum + note.frontmatter.attempts,
      0
    );
    const solvedCount = notes.filter((n) => n.frontmatter.solved).length;

    // Topic breakdown
    const topicBreakdown: Record<string, number> = {};
    for (const note of notes) {
      const topic = note.frontmatter.topic || "Uncategorized";
      topicBreakdown[topic] = (topicBreakdown[topic] || 0) + 1;
    }

    // Difficulty breakdown
    const difficultyBreakdown: Record<string, number> = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };
    for (const note of notes) {
      const diff = note.frontmatter.difficulty;
      difficultyBreakdown[diff] = (difficultyBreakdown[diff] || 0) + 1;
    }

    // Most attempted problems
    const mostAttempted = [...notes]
      .sort((a, b) => b.frontmatter.attempts - a.frontmatter.attempts)
      .slice(0, 10);

    // Due for review
    const dueForReview = notes
      .filter((n) => isDueForReview(n.frontmatter.next_review))
      .sort((a, b) => {
        if (!a.frontmatter.next_review) return 1;
        if (!b.frontmatter.next_review) return -1;
        return a.frontmatter.next_review.localeCompare(b.frontmatter.next_review);
      });

    return {
      totalProblems,
      totalAttempts,
      solvedCount,
      topicBreakdown,
      difficultyBreakdown,
      mostAttempted,
      dueForReview,
    };
  }

  /**
   * Get notes by topic
   */
  getNotesByTopic(topic: string): DSANote[] {
    return this.getNotes().filter((n) => n.frontmatter.topic === topic);
  }

  /**
   * Get notes by difficulty
   */
  getNotesByDifficulty(
    difficulty: "Easy" | "Medium" | "Hard"
  ): DSANote[] {
    return this.getNotes().filter(
      (n) => n.frontmatter.difficulty === difficulty
    );
  }

  /**
   * Get unsolved problems
   */
  getUnsolvedNotes(): DSANote[] {
    return this.getNotes().filter((n) => !n.frontmatter.solved);
  }
}
