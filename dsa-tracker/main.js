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
       * Read and parse frontmatter from a file using metadataCache
       * This is much faster and more reliable for reading than processFrontMatter
       */
      read(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache == null ? void 0 : cache.frontmatter;
        if (!frontmatter) {
          return this.getDefaultFrontmatter();
        }
        return {
          tags: this.parseArray(frontmatter.tags),
          topic: this.parseString(frontmatter.topic, ""),
          difficulty: this.parseDifficulty(frontmatter.difficulty),
          attempts: this.parseNumber(frontmatter.attempts, 0),
          last_attempt: this.parseString(frontmatter.last_attempt, ""),
          time_spent_minutes: this.parseNumber(frontmatter.time_spent_minutes, 0),
          next_review: this.parseString(frontmatter.next_review, ""),
          solved: this.parseBoolean(frontmatter.solved, false)
        };
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
       * Check if file has the DSA tag using metadataCache
       */
      hasDsaTag(file, dsaTag) {
        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache == null ? void 0 : cache.frontmatter;
        if (!frontmatter || !frontmatter.tags) {
          return false;
        }
        const tags = this.parseArray(frontmatter.tags);
        return tags.includes(dsaTag);
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

// src/ui/Notifier.ts
var Notifier_exports = {};
__export(Notifier_exports, {
  Notifier: () => Notifier
});
var import_obsidian, Notifier;
var init_Notifier = __esm({
  "src/ui/Notifier.ts"() {
    import_obsidian = require("obsidian");
    Notifier = class {
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
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DSAResetPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/reset/ResetEngine.ts
init_FrontmatterParser();
init_Notifier();
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
    if (!parser.hasDsaTag(activeFile, this.settings.dsaTag)) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }
    try {
      const current = parser.read(activeFile);
      const newAttempts = current.attempts + 1;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let nextReview = "";
      if (this.settings.spacedRepetitionEnabled) {
        const interval = this.settings.reviewIntervalDays * newAttempts;
        const reviewDate = /* @__PURE__ */ new Date();
        reviewDate.setDate(reviewDate.getDate() + interval);
        nextReview = reviewDate.toISOString().split("T")[0];
      }
      const updates = {
        attempts: newAttempts,
        last_attempt: today,
        time_spent_minutes: 0,
        next_review: nextReview,
        solved: false
      };
      await parser.update(activeFile, updates);
      await this.clearSolutionSection(activeFile);
      await this.indexer.refreshFile(activeFile.path);
      Notifier.success(`Problem reset! Attempt #${newAttempts} \u2014 good luck!`);
    } catch (error) {
      console.error("Reset failed:", error);
      Notifier.error("Failed to reset problem. Check console for details.");
    }
  }
  /**
   * Clear the solution section content while preserving the heading.
   * Uses indexOf for completely predictable string matching — no regex pitfalls.
   */
  async clearSolutionSection(file) {
    const vault = this.app.vault;
    const content = await vault.read(file);
    const heading = this.settings.solutionHeading;
    const headingIdx = content.indexOf(`
${heading}`);
    if (headingIdx === -1) return;
    const headingLineEnd = content.indexOf("\n", headingIdx + 1);
    if (headingLineEnd === -1) {
      const newContent2 = content.substring(0, headingIdx + 1) + heading + "\n\n";
      await vault.modify(file, newContent2);
      return;
    }
    const afterHeading = content.substring(headingLineEnd + 1);
    const nextHeadingMatch = afterHeading.match(/^#{1,6} /m);
    const sectionContent = nextHeadingMatch && nextHeadingMatch.index !== void 0 ? afterHeading.substring(0, nextHeadingMatch.index) : afterHeading;
    let preservedTemplate = "";
    const javaMatch = sectionContent.match(/```java\n([\s\S]*?)```/);
    if (javaMatch) {
      const code = javaMatch[1];
      const classMethodMatch = code.match(/(class\s+Solution\s*\{[\s\S]*?public\s+[\w<>[\]\s]+\s+\w+\s*\([^)]*\)\s*\{)/);
      if (classMethodMatch) {
        preservedTemplate = `
\`\`\`java
${classMethodMatch[1]}
        
    }
}
\`\`\`
`;
      }
    }
    let newContent;
    if (nextHeadingMatch && nextHeadingMatch.index !== void 0) {
      const remainingContent = afterHeading.substring(nextHeadingMatch.index);
      newContent = content.substring(0, headingIdx + 1) + heading + "\n" + preservedTemplate + "\n" + remainingContent;
    } else {
      newContent = content.substring(0, headingIdx + 1) + heading + "\n" + preservedTemplate + "\n";
    }
    await vault.modify(file, newContent);
  }
};

// src/vault/VaultIndexer.ts
var import_obsidian2 = require("obsidian");
init_FrontmatterParser();

// src/scheduler/SpacedRepetition.ts
function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) return false;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return nextReviewDate <= today;
}

// src/vault/VaultIndexer.ts
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
        const hasDsa = this.parser.hasDsaTag(file, this.settings.dsaTag);
        if (hasDsa) {
          const frontmatter = this.parser.read(file);
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
      const hasDsa = this.parser.hasDsaTag(file, this.settings.dsaTag);
      if (hasDsa) {
        const frontmatter = this.parser.read(file);
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
var import_obsidian5 = require("obsidian");

// src/creator/ProblemCreatorModal.ts
var import_obsidian4 = require("obsidian");

// src/creator/LeetCodeFetcher.ts
var import_obsidian3 = require("obsidian");
var LeetCodeFetcher = class {
  /**
   * Extracts the problem slug from a LeetCode URL.
   * Works with "https://leetcode.com/problems/two-sum/" -> "two-sum"
   */
  static extractSlug(url) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "problems" && pathParts[1]) {
        return pathParts[1];
      }
    } catch (e) {
    }
    return null;
  }
  /**
   * Fetch problem data from LeetCode GraphQL API.
   */
  static async fetchProblemData(slug) {
    const query = `
            query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    title
                    difficulty
                    topicTags {
                        name
                    }
                    content
                    codeSnippets {
                        lang
                        code
                    }
                }
            }
        `;
    try {
      const response = await (0, import_obsidian3.requestUrl)({
        url: "https://leetcode.com/graphql",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify({
          operationName: "questionData",
          variables: { titleSlug: slug },
          query
        })
      });
      if (response.status !== 200 || !response.json || !response.json.data || !response.json.data.question) {
        console.error("Failed to fetch LeetCode data", response);
        return null;
      }
      const q = response.json.data.question;
      let javaTemplate = "class Solution {\n    public void solve() {\n        // Your solution here\n    }\n}";
      if (q.codeSnippets) {
        const javaSnippet = q.codeSnippets.find((s) => s.lang === "Java");
        if (javaSnippet) {
          javaTemplate = javaSnippet.code;
        }
      }
      return {
        title: q.title || "Unknown Title",
        difficulty: q.difficulty || "Medium",
        topics: q.topicTags ? q.topicTags.map((t) => t.name) : ["Arrays"],
        content: q.content || "Problem statement not found.",
        javaTemplate
      };
    } catch (error) {
      console.error("Error fetching from LeetCode GraphQL:", error);
      return null;
    }
  }
  /**
   * Quick and dirty conversion of LeetCode HTML to Markdown.
   * We don't need perfect conversion, just good enough for readability.
   */
  static htmlToMarkdown(html) {
    let md = html;
    md = md.replace(/<strong[^>]*>/gi, "**");
    md = md.replace(/<\/strong>/gi, "**");
    md = md.replace(/<b[^>]*>/gi, "**");
    md = md.replace(/<\/b>/gi, "**");
    md = md.replace(/<em[^>]*>/gi, "*");
    md = md.replace(/<\/em>/gi, "*");
    md = md.replace(/<i[^>]*>/gi, "*");
    md = md.replace(/<\/i>/gi, "*");
    md = md.replace(/<code[^>]*>/gi, "`");
    md = md.replace(/<\/code>/gi, "`");
    md = md.replace(/<img[^>]*\/?>/gi, "");
    md = md.replace(/<sup>/gi, "^");
    md = md.replace(/<\/sup>/gi, "");
    md = md.replace(/<pre[^>]*>/gi, "\n");
    md = md.replace(/<\/pre>/gi, "\n");
    md = md.replace(/\*\*Input:?\*\*\s*([^\n]+)/gi, "- **Input:** `$1`");
    md = md.replace(/\*\*Output:?\*\*\s*([^\n]+)/gi, "- **Output:** `$1`");
    md = md.replace(/\*\*Explanation:?\*\*\s*([^\n]+)/gi, "- **Explanation:** $1");
    md = md.replace(/\*\*Constraints:?\*\*/gi, "## Constraints");
    md = md.replace(/\*\*(Example\s+\d+):?\*\*/gi, "**$1:**");
    md = md.replace(/<ul[^>]*>/gi, "");
    md = md.replace(/<\/ul>/gi, "");
    md = md.replace(/<li[^>]*>/gi, "- ");
    md = md.replace(/<\/li>/gi, "\n");
    md = md.replace(/<p[^>]*>/gi, "");
    md = md.replace(/<\/p>/gi, "\n\n");
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "[$2]($1)");
    md = md.replace(/<[^>]+>/g, "");
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/&lt;/g, "<");
    md = md.replace(/&gt;/g, ">");
    md = md.replace(/&amp;/g, "&");
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");
    md = md.replace(/^[ \t]+(- )/gm, "$1");
    md = md.replace(/\n{3,}/g, "\n\n");
    md = md.replace(/^\*+\s*$/gm, "");
    return md.trim();
  }
};

// src/creator/ProblemCreatorModal.ts
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
var ProblemCreatorModal = class extends import_obsidian4.Modal {
  constructor(app, settings, indexer) {
    super(app);
    this.settings = settings;
    this.indexer = indexer;
    this.title = "";
    this.topic = "Arrays";
    this.difficulty = "Medium";
    this.leetcodeUrl = "";
    this.fetchedContent = "";
    this.fetchedTemplate = "";
    // UI element references for updating after fetch
    this.titleInput = null;
    this.topicDropdown = null;
    this.difficultyDropdown = null;
    this.statusEl = null;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New DSA Problem" });
    new import_obsidian4.Setting(contentEl).setName("LeetCode URL").setDesc("Optional. Auto-fills problem details from LeetCode.").addText((t) => {
      t.setPlaceholder("https://leetcode.com/problems/...").onChange((v) => this.leetcodeUrl = v);
      if (this.leetcodeUrl) t.setValue(this.leetcodeUrl);
    }).addButton((btn) => btn.setButtonText("Fetch").setCta().onClick(async () => await this.handleFetch(btn)));
    this.statusEl = contentEl.createEl("p", { cls: "dsa-fetch-status" });
    if (this.fetchedContent) {
      this.statusEl.setText(`\u2705 Fetched: ${this.title}`);
      this.statusEl.style.color = "var(--color-green)";
    }
    new import_obsidian4.Setting(contentEl).setName("Problem title").addText((t) => {
      t.setPlaceholder("e.g. Binary Tree Level Order Traversal").onChange((v) => this.title = v);
      if (this.title) t.setValue(this.title);
      this.titleInput = t;
    });
    new import_obsidian4.Setting(contentEl).setName("Topic").addDropdown((d) => {
      TOPICS.forEach((t) => d.addOption(t, t));
      d.setValue(this.topic).onChange((v) => this.topic = v);
      this.topicDropdown = d;
    });
    new import_obsidian4.Setting(contentEl).setName("Difficulty").addDropdown((d) => {
      ["Easy", "Medium", "Hard"].forEach((v) => d.addOption(v, v));
      d.setValue(this.difficulty).onChange((v) => this.difficulty = v);
      this.difficultyDropdown = d;
    });
    new import_obsidian4.Setting(contentEl).addButton((btn) => btn.setButtonText("Create Problem").setCta().onClick(() => this.createNote()));
  }
  async handleFetch(btn) {
    if (!this.leetcodeUrl.trim()) {
      new import_obsidian4.Notice("Please enter a LeetCode URL.");
      return;
    }
    const slug = LeetCodeFetcher.extractSlug(this.leetcodeUrl);
    if (!slug) {
      new import_obsidian4.Notice("Invalid LeetCode URL format.");
      return;
    }
    btn.setButtonText("Fetching...").setDisabled(true);
    try {
      const data = await LeetCodeFetcher.fetchProblemData(slug);
      if (data) {
        this.title = data.title;
        this.difficulty = data.difficulty;
        const mainTopic = data.topics.find((t) => TOPICS.includes(t)) || "Arrays";
        this.topic = mainTopic;
        this.fetchedContent = LeetCodeFetcher.htmlToMarkdown(data.content);
        this.fetchedTemplate = data.javaTemplate;
        if (this.titleInput) this.titleInput.setValue(this.title);
        if (this.topicDropdown) this.topicDropdown.setValue(this.topic);
        if (this.difficultyDropdown) this.difficultyDropdown.setValue(this.difficulty);
        if (this.statusEl) {
          this.statusEl.setText(`\u2705 Fetched: ${this.title}`);
          this.statusEl.style.color = "var(--color-green)";
        }
        new import_obsidian4.Notice(`\u2705 Fetched: ${this.title}`);
      } else {
        new import_obsidian4.Notice("\u274C Failed to fetch. Problem might be premium or API blocked.");
        if (this.statusEl) {
          this.statusEl.setText("\u274C Fetch failed.");
          this.statusEl.style.color = "var(--color-red)";
        }
      }
    } catch (e) {
      console.error(e);
      new import_obsidian4.Notice("Error occurred during fetch: " + (e.message || e));
    } finally {
      btn.setButtonText("Fetch").setDisabled(false);
    }
  }
  async createNote() {
    if (!this.title.trim()) {
      new import_obsidian4.Notice("Please enter a problem title.");
      return;
    }
    const filename = this.title.trim().replace(/[\\/:*?"<>|]/g, "-");
    const folderPath = this.settings.problemsFolder || "Problems";
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    } else if (!(folder instanceof import_obsidian4.TFolder)) {
      new import_obsidian4.Notice(`"${folderPath}" exists but is not a folder.`);
      return;
    }
    const filePath = `${folderPath}/${filename}.md`;
    if (this.app.vault.getAbstractFileByPath(filePath)) {
      new import_obsidian4.Notice(`Problem "${this.title}" already exists.`);
      return;
    }
    const problemStatement = this.fetchedContent ? this.fetchedContent : "\n## Examples\n\n**Example 1:**\n- **Input:** ``\n- **Output:** ``\n\n## Constraints\n\n";
    const javaTemplate = this.fetchedTemplate ? this.fetchedTemplate : "class Solution {\n    public void solve() {\n        // Your solution here\n    }\n}";
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
    new import_obsidian4.Notice(`\u2705 Created: ${this.title}`);
    this.close();
  }
  onClose() {
    this.contentEl.empty();
    this.titleInput = null;
    this.topicDropdown = null;
    this.difficultyDropdown = null;
    this.statusEl = null;
  }
};

// src/dashboard/DashboardView.ts
var DASHBOARD_VIEW_TYPE = "dsa-dashboard";
var DashboardView = class extends import_obsidian5.ItemView {
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
    actions.createEl("button", { cls: "dashboard-action-btn run-solution-btn", text: "\u25B6 Run Solution", attr: { "data-action": "run" } });
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
          const activeFile = this.app.workspace.getActiveFile();
          if (!activeFile) {
            const { Notifier: Notifier2 } = await Promise.resolve().then(() => (init_Notifier(), Notifier_exports));
            Notifier2.error("Open a DSA problem file first to reset it.");
            return;
          }
          const engine = new ResetEngine(this.app, this.plugin.settings, this.indexer);
          await engine.run();
          await this.refresh();
        } else if (action === "run") {
          await this.plugin.runSolution();
        }
      });
    });
  }
};

// src/settings/SettingsTab.ts
var import_obsidian6 = require("obsidian");
var DSASettingsTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "DSA Reset Tracker Settings" });
    new import_obsidian6.Setting(containerEl).setName("Problems folder").setDesc("Folder where new problems are created (e.g. Problems)").addText(
      (text) => text.setPlaceholder("Problems").setValue(this.plugin.settings.problemsFolder).onChange(async (value) => {
        this.plugin.settings.problemsFolder = value.trim() || "Problems";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Solution heading").setDesc("The heading to clear when resetting a problem").addText(
      (text) => text.setPlaceholder("## My Solution").setValue(this.plugin.settings.solutionHeading).onChange(async (value) => {
        this.plugin.settings.solutionHeading = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("DSA tag").setDesc("Tag used to identify DSA problem notes").addText(
      (text) => text.setPlaceholder("dsa").setValue(this.plugin.settings.dsaTag).onChange(async (value) => {
        this.plugin.settings.dsaTag = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Track time spent").setDesc("Track time spent on each problem").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.trackTimeSpent).onChange(async (value) => {
        this.plugin.settings.trackTimeSpent = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Enable spaced repetition").setDesc("Automatically schedule review dates after each reset").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.spacedRepetitionEnabled).onChange(async (value) => {
        this.plugin.settings.spacedRepetitionEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Review interval (days)").setDesc("Base interval for spaced repetition").addSlider(
      (slider) => slider.setLimits(1, 30, 1).setValue(this.plugin.settings.reviewIntervalDays).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.reviewIntervalDays = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Dashboard default sort").setDesc("Default field to sort problems by in the dashboard").addDropdown(
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
  dsaTag: "dsa",
  spacedRepetitionEnabled: false,
  reviewIntervalDays: 7,
  dashboardSortField: "attempts",
  problemsFolder: "Problems"
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
init_Notifier();

// src/runner/SolutionRunner.ts
var SolutionRunner = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }
  /**
   * Run the solution from the given file and return results.
   */
  async run(file) {
    const content = await this.app.vault.read(file);
    const javaCode = this.extractJavaCode(content);
    if (!javaCode) {
      return this.errorResult("No Java code block found in the file. Wrap your solution in ```java ... ```.");
    }
    const testCases = this.parseTestCases(content);
    if (testCases.length === 0) {
      return this.errorResult("No test cases found. Use **Input:** `var = value` and **Output:** `value` format in the Examples section.");
    }
    const methodInfo = this.detectMethod(javaCode);
    if (!methodInfo) {
      return this.errorResult("Could not detect a public method in the Solution class.");
    }
    const testHarness = this.generateTestHarness(javaCode, testCases, methodInfo);
    return await this.compileAndRun(testHarness, testCases);
  }
  /**
   * Extract the first ```java code block from the markdown content.
   */
  extractJavaCode(content) {
    const match = content.match(/```java\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  }
  /**
   * Parse test cases from the markdown Examples section.
   * Expects format like:
   *   - **Input:** `height = [0,1,0,2]`
   *   - **Output:** `6`
   */
  parseTestCases(content) {
    const testCases = [];
    const lines = content.split("\n");
    let currentInputs = [];
    let testIndex = 0;
    for (const line of lines) {
      const inputMatch = line.match(/\*\*Input:?\*\*/i);
      if (inputMatch) {
        const backtickValues = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
        currentInputs = [];
        for (const val of backtickValues) {
          const assignMatch = val.match(/^(\w+)\s*=\s*(.+)$/);
          if (assignMatch) {
            currentInputs.push({
              name: assignMatch[1].trim(),
              rawValue: assignMatch[2].trim()
            });
          } else {
            currentInputs.push({
              name: "input",
              rawValue: val.trim()
            });
          }
        }
        continue;
      }
      const outputMatch = line.match(/\*\*Output:?\*\*/i);
      if (outputMatch && currentInputs.length > 0) {
        const backtickValues = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
        if (backtickValues.length > 0) {
          testIndex++;
          testCases.push({
            index: testIndex,
            inputs: [...currentInputs],
            expectedOutput: backtickValues[0].trim()
          });
        }
        continue;
      }
    }
    return testCases;
  }
  /**
   * Detect the first public non-constructor method in the Solution class.
   * Returns the method name, return type, and parameter types.
   */
  detectMethod(javaCode) {
    const methodRegex = /public\s+([\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = methodRegex.exec(javaCode)) !== null) {
      const returnType = match[1].trim();
      const methodName = match[2].trim();
      const paramsStr = match[3].trim();
      if (javaCode.includes(`class ${methodName}`)) continue;
      const params = [];
      if (paramsStr) {
        const paramParts = this.splitParams(paramsStr);
        for (const part of paramParts) {
          const trimmed = part.trim();
          const lastSpace = trimmed.lastIndexOf(" ");
          if (lastSpace !== -1) {
            params.push({
              type: trimmed.substring(0, lastSpace).trim(),
              name: trimmed.substring(lastSpace + 1).trim()
            });
          }
        }
      }
      return { methodName, returnType, params };
    }
    return null;
  }
  /**
   * Split parameter string handling generics like List<List<Integer>>
   */
  splitParams(paramsStr) {
    const params = [];
    let depth = 0;
    let current = "";
    for (const ch of paramsStr) {
      if (ch === "<") depth++;
      else if (ch === ">") depth--;
      else if (ch === "," && depth === 0) {
        params.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    if (current.trim()) params.push(current);
    return params;
  }
  /**
   * Generate a Java test harness that wraps the solution with test cases.
   */
  generateTestHarness(javaCode, testCases, method) {
    const lines = [];
    lines.push("import java.util.*;");
    lines.push("");
    lines.push(javaCode);
    lines.push("");
    lines.push("class TestRunner {");
    lines.push("    public static void main(String[] args) {");
    lines.push("        Solution sol = new Solution();");
    lines.push("        int passed = 0, failed = 0;");
    lines.push("");
    for (const tc of testCases) {
      lines.push(`        // Test case ${tc.index}`);
      lines.push("        {");
      const callArgs = [];
      for (let i = 0; i < method.params.length; i++) {
        const param = method.params[i];
        const input = tc.inputs[i] || tc.inputs[0];
        const javaDecl = this.toJavaDeclaration(param.type, `tc${tc.index}_${param.name}`, input.rawValue);
        lines.push(`            ${javaDecl}`);
        callArgs.push(`tc${tc.index}_${param.name}`);
      }
      if (method.returnType === "void") {
        lines.push(`            sol.${method.methodName}(${callArgs.join(", ")});`);
        const firstParam = method.params[0];
        const firstArg = callArgs[0];
        const resultStr = this.toStringExpr(firstParam.type, firstArg);
        const expectedStr = this.normalizeExpected(firstParam.type, tc.expectedOutput);
        lines.push(`            String actual = ${resultStr};`);
        lines.push(`            String expected = ${expectedStr};`);
      } else {
        const resultVar = `result${tc.index}`;
        lines.push(`            ${method.returnType} ${resultVar} = sol.${method.methodName}(${callArgs.join(", ")});`);
        const resultStr = this.toStringExpr(method.returnType, resultVar);
        const expectedStr = this.normalizeExpected(method.returnType, tc.expectedOutput);
        lines.push(`            String actual = ${resultStr};`);
        lines.push(`            String expected = ${expectedStr};`);
      }
      lines.push(`            if (actual.equals(expected)) {`);
      lines.push(`                System.out.println("PASS:${tc.index}:" + actual);`);
      lines.push(`                passed++;`);
      lines.push(`            } else {`);
      lines.push(`                System.out.println("FAIL:${tc.index}:" + actual + ":EXPECTED:" + expected);`);
      lines.push(`                failed++;`);
      lines.push(`            }`);
      lines.push("        }");
      lines.push("");
    }
    lines.push('        System.out.println("SUMMARY:" + passed + ":" + failed);');
    lines.push("    }");
    lines.push("}");
    return lines.join("\n");
  }
  /**
   * Generate a Java variable declaration from markdown input value.
   */
  toJavaDeclaration(type, varName, rawValue) {
    if (type === "int[]") {
      const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
      return `int[] ${varName} = new int[]{${inner}};`;
    }
    if (type === "int[][]") {
      const parsed = this.parse2DArray(rawValue);
      return `int[][] ${varName} = new int[][]{${parsed}};`;
    }
    if (type === "String[]") {
      const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
      const items = inner.split(",").map((s) => `"${s.trim().replace(/"/g, "").replace(/'/g, "")}"`).join(", ");
      return `String[] ${varName} = new String[]{${items}};`;
    }
    if (type === "String") {
      const cleaned = rawValue.replace(/^"/, "").replace(/"$/, "");
      return `String ${varName} = "${cleaned}";`;
    }
    if (type === "char") {
      const cleaned = rawValue.replace(/^'/, "").replace(/'$/, "").replace(/^"/, "").replace(/"$/, "");
      return `char ${varName} = '${cleaned}';`;
    }
    if (type === "char[]") {
      const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
      const items = inner.split(",").map((s) => {
        const cleaned = s.trim().replace(/"/g, "").replace(/'/g, "");
        return `'${cleaned}'`;
      }).join(", ");
      return `char[] ${varName} = new char[]{${items}};`;
    }
    if (type === "List<Integer>") {
      const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
      return `List<Integer> ${varName} = Arrays.asList(${inner});`;
    }
    if (type === "List<String>") {
      const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
      const items = inner.split(",").map((s) => `"${s.trim().replace(/"/g, "")}"`).join(", ");
      return `List<String> ${varName} = Arrays.asList(${items});`;
    }
    if (type === "List<List<Integer>>") {
      const arrays = this.parseNestedArrays(rawValue);
      const lists = arrays.map((arr) => `Arrays.asList(${arr})`).join(", ");
      return `List<List<Integer>> ${varName} = Arrays.asList(${lists});`;
    }
    if (type === "boolean") {
      return `boolean ${varName} = ${rawValue.toLowerCase()};`;
    }
    if (type === "double" || type === "float") {
      return `${type} ${varName} = ${rawValue};`;
    }
    if (type === "long") {
      return `long ${varName} = ${rawValue}L;`;
    }
    return `${type} ${varName} = ${rawValue};`;
  }
  /**
   * Convert a result variable to its string representation for comparison.
   */
  toStringExpr(type, varName) {
    if (type === "int[]") return `Arrays.toString(${varName})`;
    if (type === "int[][]") return `Arrays.deepToString(${varName})`;
    if (type === "char[]") return `Arrays.toString(${varName})`;
    if (type === "String[]") return `Arrays.toString(${varName})`;
    if (type === "boolean") return `String.valueOf(${varName})`;
    if (type === "String") return varName;
    if (type.startsWith("List")) return `${varName}.toString()`;
    return `String.valueOf(${varName})`;
  }
  /**
   * Normalize expected output for string comparison.
   */
  normalizeExpected(returnType, expected) {
    if (returnType === "int[]") {
      return `"${expected.replace(/\s+/g, " ")}"`;
    }
    if (returnType === "int[][]") {
      return `"${expected.replace(/\s+/g, " ")}"`;
    }
    if (returnType === "char[]") {
      const inner = expected.replace(/^\[/, "").replace(/\]$/, "");
      const items = inner.split(",").map((s) => s.trim().replace(/"/g, "").replace(/'/g, ""));
      return `"[${items.join(", ")}]"`;
    }
    if (returnType === "String") {
      const cleaned = expected.replace(/^"/, "").replace(/"$/, "");
      return `"${cleaned}"`;
    }
    if (returnType === "boolean") {
      return `"${expected.toLowerCase()}"`;
    }
    return `"${expected}"`;
  }
  /**
   * Parse [[1,2],[3,4]] into Java 2D array syntax.
   */
  parse2DArray(raw) {
    const innerArrays = this.parseNestedArrays(raw);
    return innerArrays.map((arr) => `{${arr}}`).join(", ");
  }
  /**
   * Parse nested arrays like [[1,2],[3,4]] into individual inner strings.
   */
  parseNestedArrays(raw) {
    const results = [];
    const trimmed = raw.replace(/^\[/, "").replace(/\]$/, "");
    let depth = 0;
    let current = "";
    for (const ch of trimmed) {
      if (ch === "[") {
        depth++;
        if (depth === 1) {
          current = "";
          continue;
        }
      } else if (ch === "]") {
        depth--;
        if (depth === 0) {
          results.push(current);
          current = "";
          continue;
        }
      } else if (ch === "," && depth === 0) {
        continue;
      }
      current += ch;
    }
    return results;
  }
  /**
   * Compile and run the test harness using system Java.
   */
  async compileAndRun(source, testCases) {
    const { execSync } = require("child_process");
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-"));
    try {
      const sourceFile = path.join(tmpDir, "TestRunner.java");
      fs.writeFileSync(sourceFile, source, "utf-8");
      try {
        execSync(`javac "${sourceFile}"`, {
          cwd: tmpDir,
          timeout: 15e3,
          encoding: "utf-8"
        });
      } catch (err) {
        return {
          success: false,
          testResults: [],
          compilationError: err.stderr || err.message || "Compilation failed",
          summary: { passed: 0, failed: testCases.length, total: testCases.length }
        };
      }
      let stdout;
      try {
        stdout = execSync(`java -cp "${tmpDir}" TestRunner`, {
          cwd: tmpDir,
          timeout: 1e4,
          encoding: "utf-8"
        });
      } catch (err) {
        return {
          success: false,
          testResults: [],
          runtimeError: err.stderr || err.stdout || err.message || "Runtime error",
          summary: { passed: 0, failed: testCases.length, total: testCases.length }
        };
      }
      return this.parseOutput(stdout, testCases);
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
      }
    }
  }
  /**
   * Parse the stdout from the test runner.
   */
  parseOutput(stdout, testCases) {
    const lines = stdout.trim().split("\n");
    const testResults = [];
    let passed = 0, failed = 0;
    for (const line of lines) {
      if (line.startsWith("PASS:")) {
        const parts = line.split(":");
        const idx = parseInt(parts[1]);
        const actual = parts.slice(2).join(":");
        const tc = testCases.find((t) => t.index === idx);
        if (tc) {
          testResults.push({ testCase: tc, passed: true, actualOutput: actual });
          passed++;
        }
      } else if (line.startsWith("FAIL:")) {
        const parts = line.split(":EXPECTED:");
        const prefix = parts[0];
        const prefixParts = prefix.split(":");
        const idx = parseInt(prefixParts[1]);
        const actual = prefixParts.slice(2).join(":");
        const tc = testCases.find((t) => t.index === idx);
        if (tc) {
          testResults.push({ testCase: tc, passed: false, actualOutput: actual });
          failed++;
        }
      }
    }
    return {
      success: failed === 0,
      testResults,
      summary: { passed, failed, total: passed + failed }
    };
  }
  /**
   * Create an error result with a message.
   */
  errorResult(message) {
    return {
      success: false,
      testResults: [],
      compilationError: message,
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }
};

// src/runner/RunResultModal.ts
var import_obsidian7 = require("obsidian");
var RunResultModal = class extends import_obsidian7.Modal {
  constructor(app, result) {
    super(app);
    this.result = result;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("dsa-run-result-modal");
    const header = contentEl.createDiv("run-result-header");
    const icon = this.result.success ? "\u2705" : "\u274C";
    header.createEl("h2", { text: `${icon} Test Results` });
    if (this.result.compilationError) {
      const errorSection = contentEl.createDiv("run-result-error");
      errorSection.createEl("h4", { text: "\u26A0\uFE0F Compilation Error" });
      errorSection.createEl("pre", {
        text: this.result.compilationError,
        cls: "run-error-output"
      });
      return;
    }
    if (this.result.runtimeError) {
      const errorSection = contentEl.createDiv("run-result-error");
      errorSection.createEl("h4", { text: "\u{1F4A5} Runtime Error" });
      errorSection.createEl("pre", {
        text: this.result.runtimeError,
        cls: "run-error-output"
      });
      return;
    }
    const { passed, failed, total } = this.result.summary;
    const summaryBar = contentEl.createDiv("run-result-summary");
    const summaryClass = failed === 0 ? "summary-all-pass" : "summary-has-fail";
    summaryBar.addClass(summaryClass);
    summaryBar.createSpan({ text: `${passed}/${total} tests passed` });
    const resultsContainer = contentEl.createDiv("run-result-cases");
    for (const tr of this.result.testResults) {
      const card = resultsContainer.createDiv("run-test-card");
      card.addClass(tr.passed ? "test-passed" : "test-failed");
      const cardHeader = card.createDiv("test-card-header");
      const statusIcon = tr.passed ? "\u2705" : "\u274C";
      cardHeader.createSpan({
        text: `${statusIcon} Test ${tr.testCase.index}`,
        cls: "test-card-title"
      });
      cardHeader.createSpan({
        text: tr.passed ? "PASSED" : "FAILED",
        cls: `test-badge ${tr.passed ? "badge-pass" : "badge-fail"}`
      });
      const cardBody = card.createDiv("test-card-body");
      const inputGroup = cardBody.createDiv("test-field");
      inputGroup.createEl("span", { text: "Input:", cls: "test-field-label" });
      const inputValues = tr.testCase.inputs.map((inp) => `${inp.name} = ${inp.rawValue}`).join(", ");
      inputGroup.createEl("code", { text: inputValues, cls: "test-field-value" });
      const expectedGroup = cardBody.createDiv("test-field");
      expectedGroup.createEl("span", { text: "Expected:", cls: "test-field-label" });
      expectedGroup.createEl("code", {
        text: tr.testCase.expectedOutput,
        cls: "test-field-value"
      });
      const actualGroup = cardBody.createDiv("test-field");
      actualGroup.createEl("span", { text: "Output:", cls: "test-field-label" });
      actualGroup.createEl("code", {
        text: tr.actualOutput,
        cls: `test-field-value ${tr.passed ? "" : "test-field-wrong"}`
      });
    }
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/tracker/TimeTracker.ts
init_FrontmatterParser();
var TimeTracker = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.activeFile = null;
    this.startTime = null;
    this.timerInterval = null;
    this.parser = new FrontmatterParser(app);
  }
  start() {
    this.fileOpenEventRef = this.app.workspace.on("file-open", this.onFileOpen.bind(this));
    this.app.workspace.onLayoutReady(() => {
      this.onFileOpen(this.app.workspace.getActiveFile());
    });
    this.timerInterval = window.setInterval(() => {
      this.saveCurrentTime();
    }, 6e4);
  }
  stop() {
    this.saveCurrentTime();
    if (this.fileOpenEventRef) {
      this.app.workspace.offref(this.fileOpenEventRef);
    }
    if (this.timerInterval !== null) {
      window.clearInterval(this.timerInterval);
    }
  }
  async onFileOpen(file) {
    if (!this.settings.trackTimeSpent) return;
    if (this.activeFile && this.startTime !== null) {
      await this.saveCurrentTime();
    }
    if (file && file.extension === "md" && this.parser.hasDsaTag(file, this.settings.dsaTag)) {
      this.activeFile = file;
      this.startTime = Date.now();
    } else {
      this.activeFile = null;
      this.startTime = null;
    }
  }
  async saveCurrentTime() {
    if (!this.settings.trackTimeSpent || !this.activeFile || !this.startTime) return;
    const now = Date.now();
    const elapsedMs = now - this.startTime;
    const elapsedMinutes = Math.floor(elapsedMs / 6e4);
    if (elapsedMinutes > 0) {
      const fm = this.parser.read(this.activeFile);
      const newTime = fm.time_spent_minutes + elapsedMinutes;
      await this.parser.update(this.activeFile, { time_spent_minutes: newTime });
      this.startTime = now - elapsedMs % 6e4;
    }
  }
};

// src/main.ts
var DSAResetPlugin = class extends import_obsidian8.Plugin {
  async onload() {
    await this.loadSettings();
    this.indexer = new VaultIndexer(this.app, this.settings);
    this.statusBar = new StatusBarController(this.addStatusBarItem());
    this.timeTracker = new TimeTracker(this.app, this.settings);
    this.timeTracker.start();
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
      id: "run-dsa-solution",
      name: "Run Solution",
      hotkeys: [{ key: "R", modifiers: ["Ctrl", "Shift"] }],
      callback: async () => {
        await this.runSolution();
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
    if (this.timeTracker) {
      this.timeTracker.stop();
    }
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
    const hasDsa = parser.hasDsaTag(activeFile, this.settings.dsaTag);
    if (!hasDsa) {
      Notifier.error("Not a DSA note. Add the 'dsa' tag to frontmatter.");
      return;
    }
    try {
      const current = parser.read(activeFile);
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let nextReview = "";
      if (this.settings.spacedRepetitionEnabled) {
        const interval = this.settings.reviewIntervalDays * Math.max(1, current.attempts);
        const reviewDate = /* @__PURE__ */ new Date();
        reviewDate.setDate(reviewDate.getDate() + interval);
        nextReview = reviewDate.toISOString().split("T")[0];
      }
      await parser.update(activeFile, {
        solved: true,
        last_attempt: today,
        next_review: nextReview
      });
      await this.indexer.refreshFile(activeFile.path);
      this.statusBar.update(this.indexer.getStats());
      Notifier.success("Problem marked as solved!");
    } catch (error) {
      console.error("Failed to mark as solved:", error);
      Notifier.error("Failed to mark as solved. Check console for details.");
    }
  }
  /**
   * Run the solution from the active file against its test cases.
   */
  async runSolution() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      Notifier.error("No file is open.");
      return;
    }
    if (!activeFile.name.endsWith(".md")) {
      Notifier.error("Not a markdown file.");
      return;
    }
    Notifier.info("Running solution...");
    try {
      const runner = new SolutionRunner(this.app, this.settings);
      const result = await runner.run(activeFile);
      new RunResultModal(this.app, result).open();
    } catch (error) {
      console.error("Solution runner failed:", error);
      Notifier.error("Failed to run solution. Check console for details.");
    }
  }
};
