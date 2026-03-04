var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/reset/FrontmatterParser.ts
var FrontmatterParser_exports = {};
__export(FrontmatterParser_exports, {
  FrontmatterParser: () => FrontmatterParser
});
var FrontmatterParser;
var init_FrontmatterParser = __esm({
  "src/reset/FrontmatterParser.ts"() {
    FrontmatterParser = class {
      constructor(app) {
        this.app = app;
      }
      /**
       * Read and parse frontmatter from a file
       * Returns typed DSAFrontmatter or default values
       */
      async read(file) {
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
              solved: this.parseBoolean(frontmatter.solved, false)
            });
          }).then(() => resolve(this.getDefaultFrontmatter())).catch(reject);
        });
      }
      /**
       * Update frontmatter fields atomically
       */
      async update(file, updates) {
        await this.app.fileManager.processFrontMatter(
          file,
          (frontmatter) => {
            if (!frontmatter) {
              frontmatter = {};
            }
            if (updates.tags !== void 0) {
              frontmatter.tags = updates.tags;
            }
            if (updates.topic !== void 0) {
              frontmatter.topic = updates.topic;
            }
            if (updates.difficulty !== void 0) {
              frontmatter.difficulty = updates.difficulty;
            }
            if (updates.attempts !== void 0) {
              frontmatter.attempts = updates.attempts;
            }
            if (updates.last_attempt !== void 0) {
              frontmatter.last_attempt = updates.last_attempt;
            }
            if (updates.time_spent_minutes !== void 0) {
              frontmatter.time_spent_minutes = updates.time_spent_minutes;
            }
            if (updates.hints_used !== void 0) {
              frontmatter.hints_used = updates.hints_used;
            }
            if (updates.next_review !== void 0) {
              frontmatter.next_review = updates.next_review;
            }
            if (updates.solved !== void 0) {
              frontmatter.solved = updates.solved;
            }
            return frontmatter;
          }
        );
      }
      /**
       * Check if file has the DSA tag
       */
      async hasDsaTag(file, dsaTag) {
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
      async ensureFrontmatter(file) {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (!frontmatter) {
            frontmatter = {};
          }
          return frontmatter;
        });
      }
      getDefaultFrontmatter() {
        return {
          tags: [],
          topic: "",
          difficulty: "Medium",
          attempts: 0,
          last_attempt: "",
          time_spent_minutes: 0,
          hints_used: 0,
          next_review: "",
          solved: false
        };
      }
      parseArray(value) {
        if (Array.isArray(value)) {
          return value.map(String);
        }
        if (typeof value === "string") {
          return value.split(",").map((t) => t.trim());
        }
        return [];
      }
      parseString(value, defaultValue) {
        if (typeof value === "string") {
          return value;
        }
        return defaultValue;
      }
      parseNumber(value, defaultValue) {
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
      parseBoolean(value, defaultValue) {
        if (typeof value === "boolean") {
          return value;
        }
        return defaultValue;
      }
      parseDifficulty(value) {
        if (typeof value === "string") {
          if (value === "Easy" || value === "Hard") {
            return value;
          }
        }
        return "Medium";
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DSAResetPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/reset/ResetEngine.ts
init_FrontmatterParser();

// src/ui/Notifier.ts
var import_obsidian = require("obsidian");
var Notifier = class {
  static success(message) {
    new import_obsidian.Notice(`\u2705 ${message}`, 3e3);
  }
  static error(message) {
    new import_obsidian.Notice(`\u274C ${message}`, 5e3);
  }
  static info(message) {
    new import_obsidian.Notice(`\u2139\uFE0F ${message}`, 3e3);
  }
};

// src/scheduler/SpacedRepetition.ts
function computeNextReview(attempts, intervalDays) {
  const multiplier = Math.min(attempts, 5);
  const days = intervalDays * multiplier;
  const next = /* @__PURE__ */ new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
}
function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) return false;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return nextReviewDate <= today;
}

// src/reset/ResetEngine.ts
var ResetEngine = class {
  constructor(app, settings, indexer) {
    this.app = app;
    this.settings = settings;
    this.indexer = indexer;
  }
  async run() {
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
    const hasDsa = await parser.hasDsaTag(activeFile, this.settings.dsaTag);
    if (!hasDsa) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }
    try {
      const frontmatter = await parser.read(activeFile);
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const updates = {
        attempts: frontmatter.attempts + 1,
        last_attempt: today
      };
      if (this.settings.spacedRepetitionEnabled) {
        updates.next_review = computeNextReview(
          frontmatter.attempts + 1,
          this.settings.reviewIntervalDays
        );
      }
      await parser.update(activeFile, updates);
      await this.clearSolutionSection(activeFile);
      await this.indexer.refreshFile(activeFile.path);
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
  async clearSolutionSection(file) {
    const vault = this.app.vault;
    const content = await vault.read(file);
    const heading = this.settings.solutionHeading;
    const headingRegex = new RegExp(
      `^(${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*\\n[\\s\\S]*?(?=\\n## |\\n# |\\n*$|$)`,
      "m"
    );
    const match = content.match(headingRegex);
    if (match) {
      const newContent = content.replace(
        headingRegex,
        `${heading}

`
      );
      await vault.modify(file, newContent);
    }
  }
};

// src/vault/VaultIndexer.ts
var import_obsidian2 = require("obsidian");
init_FrontmatterParser();
var VaultIndexer = class {
  constructor(app, settings) {
    this.notes = /* @__PURE__ */ new Map();
    this.app = app;
    this.settings = settings;
    this.parser = new FrontmatterParser(app);
    this.registerEvents();
  }
  registerEvents() {
    this.app.vault.on("modify", (file) => {
      if (file instanceof import_obsidian2.TFile && file.name.endsWith(".md")) {
        this.refreshFile(file.path);
      }
    });
    this.app.vault.on("delete", (file) => {
      if (file instanceof import_obsidian2.TFile) {
        this.notes.delete(file.path);
      }
    });
    this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof import_obsidian2.TFile) {
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
  async buildIndex() {
    this.notes.clear();
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      try {
        const hasDsa = await this.parser.hasDsaTag(file, this.settings.dsaTag);
        if (hasDsa) {
          const frontmatter = await this.parser.read(file);
          this.notes.set(file.path, {
            file,
            frontmatter,
            path: file.path
          });
        }
      } catch (error) {
        console.warn(`Failed to index ${file.path}:`, error);
      }
    }
  }
  /**
   * Refresh a single file in the index
   */
  async refreshFile(filePath) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof import_obsidian2.TFile)) {
      this.notes.delete(filePath);
      return;
    }
    try {
      const hasDsa = await this.parser.hasDsaTag(file, this.settings.dsaTag);
      if (hasDsa) {
        const frontmatter = await this.parser.read(file);
        this.notes.set(filePath, {
          file,
          frontmatter,
          path: filePath
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
  getNotes() {
    return Array.from(this.notes.values());
  }
  /**
   * Get vault statistics
   */
  getStats() {
    const notes = this.getNotes();
    const totalProblems = notes.length;
    const totalAttempts = notes.reduce(
      (sum, note) => sum + note.frontmatter.attempts,
      0
    );
    const solvedCount = notes.filter((n) => n.frontmatter.solved).length;
    const topicBreakdown = {};
    for (const note of notes) {
      const topic = note.frontmatter.topic || "Uncategorized";
      topicBreakdown[topic] = (topicBreakdown[topic] || 0) + 1;
    }
    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0
    };
    for (const note of notes) {
      const diff = note.frontmatter.difficulty;
      difficultyBreakdown[diff] = (difficultyBreakdown[diff] || 0) + 1;
    }
    const mostAttempted = [...notes].sort((a, b) => b.frontmatter.attempts - a.frontmatter.attempts).slice(0, 10);
    const dueForReview = notes.filter((n) => isDueForReview(n.frontmatter.next_review)).sort((a, b) => {
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
      dueForReview
    };
  }
  /**
   * Get notes by topic
   */
  getNotesByTopic(topic) {
    return this.getNotes().filter((n) => n.frontmatter.topic === topic);
  }
  /**
   * Get notes by difficulty
   */
  getNotesByDifficulty(difficulty) {
    return this.getNotes().filter(
      (n) => n.frontmatter.difficulty === difficulty
    );
  }
  /**
   * Get unsolved problems
   */
  getUnsolvedNotes() {
    return this.getNotes().filter((n) => !n.frontmatter.solved);
  }
};

// src/dashboard/DashboardView.ts
var import_obsidian4 = require("obsidian");

// src/creator/ProblemCreatorModal.ts
var import_obsidian3 = require("obsidian");
var TOPICS = [
  "Arrays",
  "Strings",
  "Linked Lists",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Sorting",
  "Searching",
  "Recursion",
  "Sliding Window",
  "Two Pointers",
  "Hash Tables",
  "Stacks & Queues",
  "Heaps"
];
var ProblemCreatorModal = class extends import_obsidian3.Modal {
  constructor(app, settings, indexer) {
    super(app);
    this.settings = settings;
    this.indexer = indexer;
    this.title = "";
    this.topic = "Arrays";
    this.difficulty = "Medium";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New DSA Problem" });
    new import_obsidian3.Setting(contentEl).setName("Problem title").addText((t) => t.setPlaceholder("e.g. Binary Tree Level Order Traversal").onChange((v) => this.title = v));
    new import_obsidian3.Setting(contentEl).setName("Topic").addDropdown((d) => {
      TOPICS.forEach((t) => d.addOption(t, t));
      d.setValue(this.topic).onChange((v) => this.topic = v);
    });
    new import_obsidian3.Setting(contentEl).setName("Difficulty").addDropdown((d) => {
      ["Easy", "Medium", "Hard"].forEach((v) => d.addOption(v, v));
      d.setValue(this.difficulty).onChange((v) => this.difficulty = v);
    });
    new import_obsidian3.Setting(contentEl).addButton((btn) => btn.setButtonText("Create Problem").setCta().onClick(() => this.createNote()));
  }
  async createNote() {
    if (!this.title.trim()) {
      new import_obsidian3.Notice("Please enter a problem title.");
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
    if (this.indexer) {
      await this.indexer.buildIndex();
    }
    new import_obsidian3.Notice(`Created: ${this.title}`);
    this.close();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/dashboard/DashboardView.ts
var DASHBOARD_VIEW_TYPE = "dsa-dashboard";
var DashboardView = class extends import_obsidian4.ItemView {
  constructor(leaf, indexer, plugin) {
    super(leaf);
    this.indexer = indexer;
    this.plugin = plugin;
  }
  getViewType() {
    return DASHBOARD_VIEW_TYPE;
  }
  getDisplayText() {
    return "DSA Dashboard";
  }
  getIcon() {
    return "bar-chart";
  }
  async onOpen() {
    await this.indexer.buildIndex();
    this.render();
  }
  async refresh() {
    await this.indexer.buildIndex();
    this.render();
  }
  async onResize() {
    this.render();
  }
  render() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("dsa-dashboard");
    const stats = this.indexer.getStats();
    const header = containerEl.createDiv("dashboard-header");
    const headerContent = header.createDiv("dashboard-header-content");
    const headerText = headerContent.createDiv("dashboard-header-text");
    headerText.createEl("h2", { text: "DSA Reset Tracker" });
    headerText.createEl("p", { text: "Track your algorithm practice progress" });
    const actions = containerEl.createDiv("dashboard-actions");
    actions.createEl("button", { cls: "dashboard-action-btn", text: "+ New Problem", attr: { "data-action": "new" } });
    actions.createEl("button", { cls: "dashboard-action-btn", text: "Reset Problem", attr: { "data-action": "reset" } });
    actions.createEl("button", { cls: "dashboard-action-btn", text: "Refresh", attr: { "data-action": "dashboard" } });
    const statsGrid = containerEl.createDiv("dashboard-stats");
    this.renderStatCard(statsGrid, "Total Problems", stats.totalProblems.toString(), "stat-total");
    this.renderStatCard(statsGrid, "Total Attempts", stats.totalAttempts.toString(), "stat-attempts");
    this.renderStatCard(statsGrid, "Solved", stats.solvedCount.toString(), "stat-solved");
    this.renderStatCard(statsGrid, "Due for Review", stats.dueForReview.length.toString(), "stat-due");
    const solvedPercent = stats.totalProblems > 0 ? Math.round(stats.solvedCount / stats.totalProblems * 100) : 0;
    const progressSection = containerEl.createDiv("dashboard-section progress-section");
    const progressHeader = progressSection.createDiv("progress-header");
    progressHeader.createEl("h3", { text: "Overall Progress" });
    progressHeader.createEl("span", { cls: "progress-percentage", text: `${solvedPercent}%` });
    const progressBar = progressSection.createDiv("progress-bar-large");
    const progressFill = progressBar.createDiv("progress-bar-fill-large");
    progressFill.style.width = `${solvedPercent}%`;
    progressFill.classList.add(solvedPercent >= 70 ? "progress-high" : solvedPercent >= 40 ? "progress-medium" : "progress-low");
    const columns = containerEl.createDiv("dashboard-columns");
    const leftColumn = columns.createDiv("dashboard-column");
    if (Object.keys(stats.topicBreakdown).length > 0) {
      const topicSection = leftColumn.createDiv("dashboard-section");
      topicSection.createEl("h3", { text: "Topic Breakdown" });
      this.renderTopicBreakdown(topicSection, stats);
    }
    const rightColumn = columns.createDiv("dashboard-column");
    const diffSection = rightColumn.createDiv("dashboard-section");
    diffSection.createEl("h3", { text: "Difficulty Distribution" });
    this.renderDifficultyDistribution(diffSection, stats);
    if (stats.mostAttempted.length > 0) {
      const attemptedSection = containerEl.createDiv("dashboard-section");
      attemptedSection.createEl("h3", { text: "Most Attempted Problems" });
      this.renderMostAttempted(attemptedSection, stats.mostAttempted);
    }
    if (stats.dueForReview.length > 0) {
      const reviewSection = containerEl.createDiv("dashboard-section");
      reviewSection.createEl("h3", { text: "Due for Review" });
      this.renderDueForReview(reviewSection, stats.dueForReview);
    }
    if (stats.totalProblems === 0) {
      const emptyState = containerEl.createDiv("empty-state");
      emptyState.createEl("h3", { text: "No DSA problems yet" });
      emptyState.createEl("p", { text: "Press Ctrl+Shift+N to create your first problem" });
    }
    this.setupActionHandlers(actions, containerEl);
  }
  renderStatCard(parent, label, value, cls) {
    const card = parent.createDiv(`stat-card ${cls || ""}`);
    const content = card.createDiv("stat-content");
    content.createDiv("value").setText(value);
    content.createDiv("label").setText(label);
  }
  renderTopicBreakdown(parent, stats) {
    const topicContainer = parent.createDiv();
    const topics = Object.entries(stats.topicBreakdown).sort(
      (a, b) => b[1] - a[1]
    );
    const maxCount = Math.max(...topics.map(([, count]) => count));
    for (const [topic, count] of topics) {
      const row = topicContainer.createDiv("topic-row");
      row.createDiv("topic-name").setText(topic);
      const barContainer = row.createDiv("topic-bar-container");
      const bar = barContainer.createDiv("progress-bar");
      const fill = bar.createDiv("progress-bar-fill");
      fill.style.width = `${count / maxCount * 100}%`;
      row.createDiv("topic-count").setText(count.toString());
    }
  }
  renderDifficultyDistribution(parent, stats) {
    const { difficultyBreakdown, totalProblems } = stats;
    const container = parent.createDiv("difficulty-grid");
    const difficulties = [
      { key: "Easy", class: "difficulty-easy" },
      { key: "Medium", class: "difficulty-medium" },
      { key: "Hard", class: "difficulty-hard" }
    ];
    for (const { key, class: diffClass } of difficulties) {
      const count = difficultyBreakdown[key] || 0;
      const percentage = totalProblems > 0 ? Math.round(count / totalProblems * 100) : 0;
      const item = container.createDiv("difficulty-item");
      item.createDiv("difficulty-label").setText(key);
      const barWrapper = item.createDiv("difficulty-bar-wrapper");
      const bar = barWrapper.createDiv("difficulty-bar");
      const fill = bar.createDiv("difficulty-bar-fill");
      fill.style.width = `${percentage}%`;
      item.createDiv("difficulty-count").setText(`${count}`);
    }
  }
  renderMostAttempted(parent, notes) {
    const table = parent.createEl("table", "dashboard-table");
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Problem" });
    headerRow.createEl("th", { text: "Topic" });
    headerRow.createEl("th", { text: "Difficulty" });
    headerRow.createEl("th", { text: "Attempts" });
    const tbody = table.createEl("tbody");
    for (const note of notes) {
      const row = tbody.createEl("tr");
      const title = note.file.basename;
      const problemCell = row.createEl("td");
      const link = problemCell.createEl("a", {
        text: title,
        href: "#"
      });
      link.onclick = (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(title, note.path, "tab");
      };
      row.createEl("td").setText(note.frontmatter.topic || "Uncategorized");
      const diffCell = row.createEl("td");
      const diff = note.frontmatter.difficulty;
      const diffClass = diff === "Easy" ? "difficulty-easy" : diff === "Hard" ? "difficulty-hard" : "difficulty-medium";
      diffCell.createSpan(`difficulty-badge ${diffClass}`).setText(diff);
      row.createEl("td").setText(note.frontmatter.attempts.toString());
    }
  }
  renderDueForReview(parent, notes) {
    const table = parent.createEl("table", "dashboard-table");
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Problem" });
    headerRow.createEl("th", { text: "Due Date" });
    headerRow.createEl("th", { text: "Topic" });
    const tbody = table.createEl("tbody");
    for (const note of notes.slice(0, 10)) {
      const row = tbody.createEl("tr");
      const title = note.file.basename;
      const problemCell = row.createEl("td");
      const link = problemCell.createEl("a", {
        text: title,
        href: "#"
      });
      link.onclick = (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(title, note.path, "tab");
      };
      row.createEl("td").setText(note.frontmatter.next_review || "N/A");
      row.createEl("td").setText(note.frontmatter.topic || "Uncategorized");
    }
  }
  setupActionHandlers(actions, container) {
    const buttons = actions.querySelectorAll(".dashboard-action-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.getAttribute("data-action");
        if (action === "dashboard") {
          await this.refresh();
        } else if (action === "new") {
          new ProblemCreatorModal(this.app, this.plugin.settings, this.indexer).open();
        } else if (action === "reset") {
          const engine = new ResetEngine(this.app, this.plugin.settings, this.indexer);
          await engine.run();
          await this.refresh();
        }
      });
    });
  }
};

// src/settings/SettingsTab.ts
var import_obsidian5 = require("obsidian");
var DSASettingsTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "DSA Reset Tracker Settings" });
    new import_obsidian5.Setting(containerEl).setName("Solution heading").setDesc("The heading to clear when resetting a problem").addText(
      (text) => text.setPlaceholder("## My Solution").setValue(this.plugin.settings.solutionHeading).onChange(async (value) => {
        this.plugin.settings.solutionHeading = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("DSA tag").setDesc("Tag used to identify DSA problem notes").addText(
      (text) => text.setPlaceholder("dsa").setValue(this.plugin.settings.dsaTag).onChange(async (value) => {
        this.plugin.settings.dsaTag = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Track time spent").setDesc("Track time spent on each problem").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.trackTimeSpent).onChange(async (value) => {
        this.plugin.settings.trackTimeSpent = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Track hints used").setDesc("Track number of hints used for each problem").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.trackHintsUsed).onChange(async (value) => {
        this.plugin.settings.trackHintsUsed = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Enable spaced repetition").setDesc("Automatically schedule review dates after each reset").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.spacedRepetitionEnabled).onChange(async (value) => {
        this.plugin.settings.spacedRepetitionEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Review interval (days)").setDesc("Base interval for spaced repetition").addSlider(
      (slider) => slider.setLimits(1, 30, 1).setValue(this.plugin.settings.reviewIntervalDays).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.reviewIntervalDays = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Dashboard default sort").setDesc("Default field to sort problems by in the dashboard").addDropdown(
      (dropdown) => dropdown.addOptions({
        attempts: "Attempts",
        last_attempt: "Last Attempt",
        topic: "Topic",
        difficulty: "Difficulty"
      }).setValue(this.plugin.settings.dashboardSortField).onChange(async (value) => {
        this.plugin.settings.dashboardSortField = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/types/index.ts
var DEFAULT_SETTINGS = {
  solutionHeading: "## My Solution",
  trackTimeSpent: true,
  trackHintsUsed: true,
  dsaTag: "dsa",
  spacedRepetitionEnabled: false,
  reviewIntervalDays: 7,
  dashboardSortField: "attempts"
};

// src/ui/StatusBar.ts
var StatusBarController = class {
  constructor(element) {
    this.element = element;
  }
  update(stats) {
    if (!stats) {
      this.element.setText("DSA | Loading...");
      return;
    }
    const { totalProblems, totalAttempts } = stats;
    this.element.setText(`DSA | ${totalProblems} problems | ${totalAttempts} attempts`);
  }
  clear() {
    this.element.setText("");
  }
};

// src/main.ts
var DSAResetPlugin = class extends import_obsidian6.Plugin {
  async onload() {
    await this.loadSettings();
    this.indexer = new VaultIndexer(this.app, this.settings);
    this.statusBar = new StatusBarController(this.addStatusBarItem());
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => {
      return new DashboardView(leaf, this.indexer, this);
    });
    this.addCommand({
      id: "reset-dsa-problem",
      name: "Reset DSA Problem",
      callback: () => {
        const engine = new ResetEngine(
          this.app,
          this.settings,
          this.indexer
        );
        engine.run().then(() => {
          this.statusBar.update(this.indexer.getStats());
        });
      }
    });
    this.addCommand({
      id: "open-dsa-dashboard",
      name: "Open DSA Dashboard",
      callback: () => {
        this.activateDashboard();
      }
    });
    this.addCommand({
      id: "index-dsa-vault",
      name: "Re-index DSA Vault",
      callback: async () => {
        Notifier.info("Re-indexing DSA notes...");
        await this.indexer.buildIndex();
        this.statusBar.update(this.indexer.getStats());
        Notifier.success(`Indexed ${this.indexer.getStats().totalProblems} problems`);
      }
    });
    this.addCommand({
      id: "mark-dsa-solved",
      name: "Mark Problem as Solved",
      callback: async () => {
        await this.markAsSolved();
      }
    });
    this.addCommand({
      id: "create-dsa-problem",
      name: "Create New DSA Problem",
      hotkeys: [{ key: "P", modifiers: ["Ctrl", "Shift"] }],
      callback: () => {
        new ProblemCreatorModal(this.app, this.settings, this.indexer).open();
      }
    });
    this.addSettingTab(new DSASettingsTab(this.app, this));
    await this.indexer.buildIndex();
    this.statusBar.update(this.indexer.getStats());
    console.log("DSA Reset Tracker loaded");
  }
  async onunload() {
    console.log("DSA Reset Tracker unloaded");
  }
  async activateDashboard() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(
      DASHBOARD_VIEW_TYPE
    )[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: DASHBOARD_VIEW_TYPE,
          active: true
        });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    await this.indexer.buildIndex();
    this.statusBar.update(this.indexer.getStats());
  }
  /**
   * Mark the current problem as solved
   */
  async markAsSolved() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      Notifier.error("No file is open.");
      return;
    }
    if (!activeFile.name.endsWith(".md")) {
      Notifier.error("Not a markdown file.");
      return;
    }
    const { FrontmatterParser: FrontmatterParser2 } = await Promise.resolve().then(() => (init_FrontmatterParser(), FrontmatterParser_exports));
    const parser = new FrontmatterParser2(this.app);
    const hasDsa = await parser.hasDsaTag(activeFile, this.settings.dsaTag);
    if (!hasDsa) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }
    try {
      await parser.update(activeFile, { solved: true });
      await this.indexer.refreshFile(activeFile.path);
      this.statusBar.update(this.indexer.getStats());
      Notifier.success("Problem marked as solved!");
    } catch (error) {
      console.error("Failed to mark as solved:", error);
      Notifier.error("Failed to mark as solved. Check console for details.");
    }
  }
};
