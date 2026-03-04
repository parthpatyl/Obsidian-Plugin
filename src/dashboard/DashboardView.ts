import { ItemView, WorkspaceLeaf } from "obsidian";
import { VaultIndexer } from "../vault/VaultIndexer";
import { VaultStats, DSANote } from "../types";
import DSAResetPlugin from "../main";
import { ResetEngine } from "../reset/ResetEngine";
import { ProblemCreatorModal } from "../creator/ProblemCreatorModal";

export const DASHBOARD_VIEW_TYPE = "dsa-dashboard";

export class DashboardView extends ItemView {
  private indexer: VaultIndexer;
  private plugin: DSAResetPlugin;

  constructor(leaf: WorkspaceLeaf, indexer: VaultIndexer, plugin: DSAResetPlugin) {
    super(leaf);
    this.indexer = indexer;
    this.plugin = plugin;
  }

  getViewType(): string {
    return DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "DSA Dashboard";
  }

  getIcon(): string {
    return "bar-chart";
  }

  async onOpen(): Promise<void> {
    await this.indexer.buildIndex();
    this.render();
  }

  async refresh(): Promise<void> {
    await this.indexer.buildIndex();
    this.render();
  }

  async onResize(): Promise<void> {
    this.render();
  }

  render(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("dsa-dashboard");

    const stats = this.indexer.getStats();

    // Header with icon
    const header = containerEl.createDiv("dashboard-header");
    const headerContent = header.createDiv("dashboard-header-content");
    const headerText = headerContent.createDiv("dashboard-header-text");
    headerText.createEl("h2", { text: "DSA Reset Tracker" });
    headerText.createEl("p", { text: "Track your algorithm practice progress" });

    // Quick Actions
    const actions = containerEl.createDiv("dashboard-actions");
    actions.createEl("button", { cls: "dashboard-action-btn", text: "+ New Problem", attr: { "data-action": "new" } });
    actions.createEl("button", { cls: "dashboard-action-btn", text: "Reset Problem", attr: { "data-action": "reset" } });
    actions.createEl("button", { cls: "dashboard-action-btn", text: "Refresh", attr: { "data-action": "dashboard" } });

    // Stats Grid
    const statsGrid = containerEl.createDiv("dashboard-stats");
    this.renderStatCard(statsGrid, "Total Problems", stats.totalProblems.toString(), "stat-total");
    this.renderStatCard(statsGrid, "Total Attempts", stats.totalAttempts.toString(), "stat-attempts");
    this.renderStatCard(statsGrid, "Solved", stats.solvedCount.toString(), "stat-solved");
    this.renderStatCard(statsGrid, "Due for Review", stats.dueForReview.length.toString(), "stat-due");

    // Calculate solved percentage
    const solvedPercent = stats.totalProblems > 0
      ? Math.round((stats.solvedCount / stats.totalProblems) * 100)
      : 0;

    // Progress bar section
    const progressSection = containerEl.createDiv("dashboard-section progress-section");
    const progressHeader = progressSection.createDiv("progress-header");
    progressHeader.createEl("h3", { text: "Overall Progress" });
    progressHeader.createEl("span", { cls: "progress-percentage", text: `${solvedPercent}%` });
    const progressBar = progressSection.createDiv("progress-bar-large");
    const progressFill = progressBar.createDiv("progress-bar-fill-large");
    progressFill.style.width = `${solvedPercent}%`;
    progressFill.classList.add(solvedPercent >= 70 ? "progress-high" : solvedPercent >= 40 ? "progress-medium" : "progress-low");

    // Two-column layout for topic and difficulty
    const columns = containerEl.createDiv("dashboard-columns");

    // Topic Breakdown
    const leftColumn = columns.createDiv("dashboard-column");
    if (Object.keys(stats.topicBreakdown).length > 0) {
      const topicSection = leftColumn.createDiv("dashboard-section");
      topicSection.createEl("h3", { text: "Topic Breakdown" });
      this.renderTopicBreakdown(topicSection, stats);
    }

    // Difficulty Distribution
    const rightColumn = columns.createDiv("dashboard-column");
    const diffSection = rightColumn.createDiv("dashboard-section");
    diffSection.createEl("h3", { text: "Difficulty Distribution" });
    this.renderDifficultyDistribution(diffSection, stats);

    // Most Attempted Problems
    if (stats.mostAttempted.length > 0) {
      const attemptedSection = containerEl.createDiv("dashboard-section");
      attemptedSection.createEl("h3", { text: "Most Attempted Problems" });
      this.renderMostAttempted(attemptedSection, stats.mostAttempted);
    }

    // Due for Review
    if (stats.dueForReview.length > 0) {
      const reviewSection = containerEl.createDiv("dashboard-section");
      reviewSection.createEl("h3", { text: "Due for Review" });
      this.renderDueForReview(reviewSection, stats.dueForReview);
    }

    // Empty state
    if (stats.totalProblems === 0) {
      const emptyState = containerEl.createDiv("empty-state");
      emptyState.createEl("h3", { text: "No DSA problems yet" });
      emptyState.createEl("p", { text: "Press Ctrl+Shift+N to create your first problem" });
    }

    // Add click handlers for action buttons
    this.setupActionHandlers(actions, containerEl);
  }

  private renderStatCard(
    parent: HTMLElement,
    label: string,
    value: string,
    cls?: string
  ): void {
    const card = parent.createDiv(`stat-card ${cls || ""}`);
    const content = card.createDiv("stat-content");
    content.createDiv("value").setText(value);
    content.createDiv("label").setText(label);
  }

  private renderTopicBreakdown(
    parent: HTMLElement,
    stats: VaultStats
  ): void {
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
      fill.style.width = `${(count / maxCount) * 100}%`;

      row.createDiv("topic-count").setText(count.toString());
    }
  }

  private renderDifficultyDistribution(
    parent: HTMLElement,
    stats: VaultStats
  ): void {
    const { difficultyBreakdown, totalProblems } = stats;
    const container = parent.createDiv("difficulty-grid");

    const difficulties = [
      { key: "Easy", class: "difficulty-easy" },
      { key: "Medium", class: "difficulty-medium" },
      { key: "Hard", class: "difficulty-hard" },
    ];

    for (const { key, class: diffClass } of difficulties) {
      const count = difficultyBreakdown[key] || 0;
      const percentage =
        totalProblems > 0 ? Math.round((count / totalProblems) * 100) : 0;

      const item = container.createDiv("difficulty-item");
      item.createDiv("difficulty-label").setText(key);

      const barWrapper = item.createDiv("difficulty-bar-wrapper");
      const bar = barWrapper.createDiv("difficulty-bar");
      const fill = bar.createDiv("difficulty-bar-fill");
      fill.style.width = `${percentage}%`;

      item.createDiv("difficulty-count").setText(`${count}`);
    }
  }

  private renderMostAttempted(
    parent: HTMLElement,
    notes: DSANote[]
  ): void {
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

      // Create clickable link
      const problemCell = row.createEl("td");
      const link = problemCell.createEl("a", {
        text: title,
        href: "#",
      });
      link.onclick = (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(title, note.path, "tab");
      };

      row.createEl("td").setText(note.frontmatter.topic || "Uncategorized");

      const diffCell = row.createEl("td");
      const diff = note.frontmatter.difficulty;
      const diffClass =
        diff === "Easy"
          ? "difficulty-easy"
          : diff === "Hard"
          ? "difficulty-hard"
          : "difficulty-medium";
      diffCell.createSpan(`difficulty-badge ${diffClass}`).setText(diff);

      row.createEl("td").setText(note.frontmatter.attempts.toString());
    }
  }

  private renderDueForReview(
    parent: HTMLElement,
    notes: DSANote[]
  ): void {
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
        href: "#",
      });
      link.onclick = (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(title, note.path, "tab");
      };

      row.createEl("td").setText(note.frontmatter.next_review || "N/A");
      row.createEl("td").setText(note.frontmatter.topic || "Uncategorized");
    }
  }

  private setupActionHandlers(actions: HTMLElement, container: HTMLElement): void {
    const buttons = actions.querySelectorAll(".dashboard-action-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const action = btn.getAttribute("data-action");
        if (action === "dashboard") {
          await this.refresh();
        } else if (action === "new") {
          // Open problem creator modal directly
          new ProblemCreatorModal(this.app, this.plugin.settings, this.indexer).open();
        } else if (action === "reset") {
          // Run reset engine directly
          const engine = new ResetEngine(this.app, this.plugin.settings, this.indexer);
          await engine.run();
          await this.refresh();
        }
      });
    });
  }
}
