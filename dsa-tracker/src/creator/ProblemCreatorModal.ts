import { App, Modal, Setting, Notice, TFolder, ButtonComponent, TextComponent, DropdownComponent } from "obsidian";
import { PluginSettings } from "../types";
import { VaultIndexer } from "../vault/VaultIndexer";
import { LeetCodeFetcher } from "./LeetCodeFetcher";

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
  "Dynamic Programming", "Sorting", "Searching", "Recursion",
  "Sliding Window", "Two Pointers", "Hash Tables", "Stacks & Queues", "Heaps",
];

export class ProblemCreatorModal extends Modal {
  private title = "";
  private topic = "Arrays";
  private difficulty: "Easy" | "Medium" | "Hard" = "Medium";
  private leetcodeUrl = "";
  private fetchedContent = "";
  private fetchedTemplate = "";

  // UI element references for updating after fetch
  private titleInput: TextComponent | null = null;
  private topicDropdown: DropdownComponent | null = null;
  private difficultyDropdown: DropdownComponent | null = null;
  private statusEl: HTMLElement | null = null;

  constructor(app: App, private settings: PluginSettings, private indexer: VaultIndexer) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New DSA Problem" });

    // LeetCode URL Fetcher row
    new Setting(contentEl)
      .setName("LeetCode URL")
      .setDesc("Optional. Auto-fills problem details from LeetCode.")
      .addText(t => {
        t.setPlaceholder("https://leetcode.com/problems/...")
          .onChange(v => this.leetcodeUrl = v);
        if (this.leetcodeUrl) t.setValue(this.leetcodeUrl);
      })
      .addButton(btn => btn
        .setButtonText("Fetch")
        .setCta()
        .onClick(async () => await this.handleFetch(btn)));

    // Status line (shows after successful fetch)
    this.statusEl = contentEl.createEl("p", { cls: "dsa-fetch-status" });
    if (this.fetchedContent) {
      this.statusEl.setText(`✅ Fetched: ${this.title}`);
      this.statusEl.style.color = "var(--color-green)";
    }

    // Title input
    new Setting(contentEl)
      .setName("Problem title")
      .addText(t => {
        t.setPlaceholder("e.g. Binary Tree Level Order Traversal")
          .onChange(v => this.title = v);
        if (this.title) t.setValue(this.title);
        this.titleInput = t;
      });

    // Topic dropdown
    new Setting(contentEl)
      .setName("Topic")
      .addDropdown(d => {
        TOPICS.forEach(t => d.addOption(t, t));
        d.setValue(this.topic).onChange(v => this.topic = v);
        this.topicDropdown = d;
      });

    // Difficulty dropdown
    new Setting(contentEl)
      .setName("Difficulty")
      .addDropdown(d => {
        ["Easy", "Medium", "Hard"].forEach(v => d.addOption(v, v));
        d.setValue(this.difficulty)
          .onChange(v => this.difficulty = v as "Easy" | "Medium" | "Hard");
        this.difficultyDropdown = d;
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Create Problem")
        .setCta()
        .onClick(() => this.createNote()));
  }

  private async handleFetch(btn: ButtonComponent) {
    if (!this.leetcodeUrl.trim()) {
      new Notice("Please enter a LeetCode URL.");
      return;
    }

    const slug = LeetCodeFetcher.extractSlug(this.leetcodeUrl);
    if (!slug) {
      new Notice("Invalid LeetCode URL format.");
      return;
    }

    btn.setButtonText("Fetching...").setDisabled(true);

    try {
      const data = await LeetCodeFetcher.fetchProblemData(slug);
      if (data) {
        this.title = data.title;
        this.difficulty = data.difficulty;

        // Find best matching topic from the default list
        const mainTopic = data.topics.find((t: string) => TOPICS.includes(t)) || "Arrays";
        this.topic = mainTopic;

        this.fetchedContent = LeetCodeFetcher.htmlToMarkdown(data.content);
        this.fetchedTemplate = data.javaTemplate;

        // Update UI elements in-place without re-rendering
        if (this.titleInput) this.titleInput.setValue(this.title);
        if (this.topicDropdown) this.topicDropdown.setValue(this.topic);
        if (this.difficultyDropdown) this.difficultyDropdown.setValue(this.difficulty);
        if (this.statusEl) {
          this.statusEl.setText(`✅ Fetched: ${this.title}`);
          this.statusEl.style.color = "var(--color-green)";
        }

        new Notice(`✅ Fetched: ${this.title}`);
      } else {
        new Notice("❌ Failed to fetch. Problem might be premium or API blocked.");
        if (this.statusEl) {
          this.statusEl.setText("❌ Fetch failed.");
          this.statusEl.style.color = "var(--color-red)";
        }
      }
    } catch (e: any) {
      console.error(e);
      new Notice("Error occurred during fetch: " + (e.message || e));
    } finally {
      btn.setButtonText("Fetch").setDisabled(false);
    }
  }

  private async createNote() {
    if (!this.title.trim()) {
      new Notice("Please enter a problem title.");
      return;
    }

    const filename = this.title.trim().replace(/[\\/:*?"<>|]/g, "-");

    // Ensure the problems folder exists
    const folderPath = this.settings.problemsFolder || "Problems";
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    } else if (!(folder instanceof TFolder)) {
      new Notice(`"${folderPath}" exists but is not a folder.`);
      return;
    }

    const filePath = `${folderPath}/${filename}.md`;

    // Check for duplicates
    if (this.app.vault.getAbstractFileByPath(filePath)) {
      new Notice(`Problem "${this.title}" already exists.`);
      return;
    }

    const problemStatement = this.fetchedContent
      ? this.fetchedContent
      : "\n## Examples\n\n**Example 1:**\n- **Input:** ``\n- **Output:** ``\n\n## Constraints\n\n";

    const javaTemplate = this.fetchedTemplate
      ? this.fetchedTemplate
      : "class Solution {\n    public void solve() {\n        // Your solution here\n    }\n}";

    const content = `---
tags: [${this.settings.dsaTag}]
topic: ${this.topic}
difficulty: ${this.difficulty}
attempts: 0
last_attempt: ""
time_spent_minutes: 0
next_review: ""
solved: false
---

# ${this.title}

## Problem Statement

${problemStatement}

${this.settings.solutionHeading}

\`\`\`java
${javaTemplate}
\`\`\`

### Approaches
1.  **Brute Force:** 
2.  **Optimal:** 

## Notes / Reflection

`;

    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf().openFile(file);

    if (this.indexer) {
      await this.indexer.buildIndex();
    }

    new Notice(`✅ Created: ${this.title}`);
    this.close();
  }

  onClose() {
    this.contentEl.empty();
    this.titleInput = null;
    this.topicDropdown = null;
    this.difficultyDropdown = null;
    this.statusEl = null;
  }
}
