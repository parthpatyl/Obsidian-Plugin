import { Plugin, WorkspaceLeaf } from "obsidian";
import { ResetEngine } from "./reset/ResetEngine";
import { VaultIndexer } from "./vault/VaultIndexer";
import { DashboardView, DASHBOARD_VIEW_TYPE } from "./dashboard/DashboardView";
import { DSASettingsTab } from "./settings/SettingsTab";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import { StatusBarController } from "./ui/StatusBar";
import { Notifier } from "./ui/Notifier";
import { ProblemCreatorModal } from "./creator/ProblemCreatorModal";

export default class DSAResetPlugin extends Plugin {
  settings: PluginSettings;
  indexer: VaultIndexer;
  statusBar: StatusBarController;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize indexer
    this.indexer = new VaultIndexer(this.app, this.settings);

    // Initialize status bar
    this.statusBar = new StatusBarController(this.addStatusBarItem());

    // Register dashboard view
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => {
      return new DashboardView(leaf, this.indexer, this);
    });

    // Register commands
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
          // Update status bar after reset
          this.statusBar.update(this.indexer.getStats());
        });
      },
    });

    this.addCommand({
      id: "open-dsa-dashboard",
      name: "Open DSA Dashboard",
      callback: () => {
        this.activateDashboard();
      },
    });

    this.addCommand({
      id: "index-dsa-vault",
      name: "Re-index DSA Vault",
      callback: async () => {
        Notifier.info("Re-indexing DSA notes...");
        await this.indexer.buildIndex();
        this.statusBar.update(this.indexer.getStats());
        Notifier.success(`Indexed ${this.indexer.getStats().totalProblems} problems`);
      },
    });

    this.addCommand({
      id: "mark-dsa-solved",
      name: "Mark Problem as Solved",
      callback: async () => {
        await this.markAsSolved();
      },
    });

    this.addCommand({
      id: "create-dsa-problem",
      name: "Create New DSA Problem",
      hotkeys: [{ key: "P", modifiers: ["Ctrl", "Shift"] }],
      callback: () => {
        new ProblemCreatorModal(this.app, this.settings, this.indexer).open();
      },
    });

    // Register settings tab
    this.addSettingTab(new DSASettingsTab(this.app, this));

    // Build initial index
    await this.indexer.buildIndex();
    this.statusBar.update(this.indexer.getStats());

    console.log("DSA Reset Tracker loaded");
  }

  async onunload(): Promise<void> {
    console.log("DSA Reset Tracker unloaded");
  }

  async activateDashboard(): Promise<void> {
    const { workspace } = this.app;

    // Check if dashboard is already open
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(
      DASHBOARD_VIEW_TYPE
    )[0];

    if (!leaf) {
      // Create new leaf on the right
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: DASHBOARD_VIEW_TYPE,
          active: true,
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings(): Promise<void> {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // Rebuild index with new settings
    await this.indexer.buildIndex();
    this.statusBar.update(this.indexer.getStats());
  }

  /**
   * Mark the current problem as solved
   */
  private async markAsSolved(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      Notifier.error("No file is open.");
      return;
    }

    if (!activeFile.name.endsWith(".md")) {
      Notifier.error("Not a markdown file.");
      return;
    }

    const { FrontmatterParser } = await import("./reset/FrontmatterParser");
    const parser = new FrontmatterParser(this.app);

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
}
