import { App, Modal, Setting, Notice } from "obsidian";
import { PluginSettings } from "../types";
import { VaultIndexer } from "../vault/VaultIndexer";

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
  "Dynamic Programming", "Sorting", "Searching", "Recursion",
  "Sliding Window", "Two Pointers", "Hash Tables", "Stacks & Queues", "Heaps"
];

export class ProblemCreatorModal extends Modal {
  private title = "";
  private topic = "Arrays";
  private difficulty: "Easy" | "Medium" | "Hard" = "Medium";

  constructor(app: App, private settings: PluginSettings, private indexer: VaultIndexer) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New DSA Problem" });

    new Setting(contentEl)
      .setName("Problem title")
      .addText(t => t.setPlaceholder("e.g. Binary Tree Level Order Traversal")
        .onChange(v => this.title = v));

    new Setting(contentEl)
      .setName("Topic")
      .addDropdown(d => {
        TOPICS.forEach(t => d.addOption(t, t));
        d.setValue(this.topic).onChange(v => this.topic = v);
      });

    new Setting(contentEl)
      .setName("Difficulty")
      .addDropdown(d => {
        ["Easy", "Medium", "Hard"].forEach(v => d.addOption(v, v));
        d.setValue(this.difficulty)
         .onChange(v => this.difficulty = v as "Easy" | "Medium" | "Hard");
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Create Problem")
        .setCta()
        .onClick(() => this.createNote()));
  }

  private async createNote() {
    if (!this.title.trim()) {
      new Notice("Please enter a problem title.");
      return;
    }

    const filename = this.title.trim().replace(/[\\/:*?"<>|]/g, "-");

    const content = `---
tags: [${this.settings.dsaTag}]
topic: ${this.topic}
difficulty: ${this.difficulty}
attempts: 0
last_attempt: ""
time_spent_minutes: 0
hints_used: 0
next_review: ""
solved: false
---

# ${this.title}

## Problem Statement



## Examples



## Constraints



${this.settings.solutionHeading}

\`\`\`typescript
// Your solution here
\`\`\`

## Notes / Reflection

`;

    const file = await this.app.vault.create(`${filename}.md`, content);
    await this.app.workspace.getLeaf().openFile(file);

    // Refresh the index to include the new problem
    if (this.indexer) {
      await this.indexer.buildIndex();
    }

    new Notice(`Created: ${this.title}`);
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}
