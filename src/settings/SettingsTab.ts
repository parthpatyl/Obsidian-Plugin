import { App, PluginSettingTab, Setting } from "obsidian";
import DSAResetPlugin from "../main";

export class DSASettingsTab extends PluginSettingTab {
  plugin: DSAResetPlugin;

  constructor(app: App, plugin: DSAResetPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "DSA Reset Tracker Settings" });

    // Solution heading
    new Setting(containerEl)
      .setName("Solution heading")
      .setDesc("The heading to clear when resetting a problem")
      .addText((text) =>
        text
          .setPlaceholder("## My Solution")
          .setValue(this.plugin.settings.solutionHeading)
          .onChange(async (value) => {
            this.plugin.settings.solutionHeading = value;
            await this.plugin.saveSettings();
          })
      );

    // DSA tag
    new Setting(containerEl)
      .setName("DSA tag")
      .setDesc("Tag used to identify DSA problem notes")
      .addText((text) =>
        text
          .setPlaceholder("dsa")
          .setValue(this.plugin.settings.dsaTag)
          .onChange(async (value) => {
            this.plugin.settings.dsaTag = value;
            await this.plugin.saveSettings();
          })
      );

    // Track time spent
    new Setting(containerEl)
      .setName("Track time spent")
      .setDesc("Track time spent on each problem")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.trackTimeSpent)
          .onChange(async (value) => {
            this.plugin.settings.trackTimeSpent = value;
            await this.plugin.saveSettings();
          })
      );

    // Track hints used
    new Setting(containerEl)
      .setName("Track hints used")
      .setDesc("Track number of hints used for each problem")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.trackHintsUsed)
          .onChange(async (value) => {
            this.plugin.settings.trackHintsUsed = value;
            await this.plugin.saveSettings();
          })
      );

    // Spaced repetition
    new Setting(containerEl)
      .setName("Enable spaced repetition")
      .setDesc("Automatically schedule review dates after each reset")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacedRepetitionEnabled)
          .onChange(async (value) => {
            this.plugin.settings.spacedRepetitionEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    // Review interval days
    new Setting(containerEl)
      .setName("Review interval (days)")
      .setDesc("Base interval for spaced repetition")
      .addSlider((slider) =>
        slider
          .setLimits(1, 30, 1)
          .setValue(this.plugin.settings.reviewIntervalDays)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.reviewIntervalDays = value;
            await this.plugin.saveSettings();
          })
      );

    // Dashboard sort field
    new Setting(containerEl)
      .setName("Dashboard default sort")
      .setDesc("Default field to sort problems by in the dashboard")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            attempts: "Attempts",
            last_attempt: "Last Attempt",
            topic: "Topic",
            difficulty: "Difficulty",
          })
          .setValue(this.plugin.settings.dashboardSortField)
          .onChange(async (value) => {
            this.plugin.settings.dashboardSortField = value as
              | "attempts"
              | "last_attempt"
              | "topic"
              | "difficulty";
            await this.plugin.saveSettings();
          })
      );
  }
}
