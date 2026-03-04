import { App, TFile } from "obsidian";
import { DSAFrontmatter } from "../types";

export class FrontmatterParser {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Read and parse frontmatter from a file
   * Returns typed DSAFrontmatter or default values
   */
  async read(file: TFile): Promise<DSAFrontmatter> {
    return new Promise((resolve, reject) => {
      this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        if (!frontmatter) {
          return resolve(this.getDefaultFrontmatter());
        }

        resolve({
          tags: this.parseArray(frontmatter.tags),
          topic: this.parseString(frontmatter.topic, ""),
          difficulty: this.parseDifficulty(frontmatter.difficulty),
          attempts: this.parseNumber(frontmatter.attempts, 0),
          last_attempt: this.parseString(frontmatter.last_attempt, ""),
          time_spent_minutes: this.parseNumber(frontmatter.time_spent_minutes, 0),
          hints_used: this.parseNumber(frontmatter.hints_used, 0),
          next_review: this.parseString(frontmatter.next_review, ""),
          solved: this.parseBoolean(frontmatter.solved, false),
        });
      }).then(() => resolve(this.getDefaultFrontmatter())).catch(reject);
    });
  }

  /**
   * Update frontmatter fields atomically
   */
  async update(
    file: TFile,
    updates: Partial<DSAFrontmatter>
  ): Promise<void> {
    await this.app.fileManager.processFrontMatter(
      file,
      (frontmatter) => {
        if (!frontmatter) {
          frontmatter = {};
        }

        // Update only provided fields
        if (updates.tags !== undefined) {
          frontmatter.tags = updates.tags;
        }
        if (updates.topic !== undefined) {
          frontmatter.topic = updates.topic;
        }
        if (updates.difficulty !== undefined) {
          frontmatter.difficulty = updates.difficulty;
        }
        if (updates.attempts !== undefined) {
          frontmatter.attempts = updates.attempts;
        }
        if (updates.last_attempt !== undefined) {
          frontmatter.last_attempt = updates.last_attempt;
        }
        if (updates.time_spent_minutes !== undefined) {
          frontmatter.time_spent_minutes = updates.time_spent_minutes;
        }
        if (updates.hints_used !== undefined) {
          frontmatter.hints_used = updates.hints_used;
        }
        if (updates.next_review !== undefined) {
          frontmatter.next_review = updates.next_review;
        }
        if (updates.solved !== undefined) {
          frontmatter.solved = updates.solved;
        }

        return frontmatter;
      }
    );
  }

  /**
   * Check if file has the DSA tag
   */
  async hasDsaTag(file: TFile, dsaTag: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        if (!frontmatter || !frontmatter.tags) {
          return resolve(false);
        }

        const tags = this.parseArray(frontmatter.tags);
        return resolve(tags.includes(dsaTag));
      });
    });
  }

  /**
   * Ensure frontmatter exists, create if missing
   */
  async ensureFrontmatter(file: TFile): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!frontmatter) {
        frontmatter = {};
      }
      return frontmatter;
    });
  }

  private getDefaultFrontmatter(): DSAFrontmatter {
    return {
      tags: [],
      topic: "",
      difficulty: "Medium",
      attempts: 0,
      last_attempt: "",
      time_spent_minutes: 0,
      hints_used: 0,
      next_review: "",
      solved: false,
    };
  }

  private parseArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (typeof value === "string") {
      return value.split(",").map((t) => t.trim());
    }
    return [];
  }

  private parseString(value: unknown, defaultValue: string): string {
    if (typeof value === "string") {
      return value;
    }
    return defaultValue;
  }

  private parseNumber(value: unknown, defaultValue: number): number {
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return defaultValue;
  }

  private parseBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    return defaultValue;
  }

  private parseDifficulty(
    value: unknown
  ): "Easy" | "Medium" | "Hard" {
    if (typeof value === "string") {
      if (value === "Easy" || value === "Hard") {
        return value;
      }
    }
    return "Medium";
  }
}
