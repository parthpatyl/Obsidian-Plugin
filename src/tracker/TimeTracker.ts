import { App, TFile, EventRef } from "obsidian";
import { PluginSettings } from "../types";
import { FrontmatterParser } from "../reset/FrontmatterParser";

export class TimeTracker {
    private activeFile: TFile | null = null;
    private startTime: number | null = null;
    private timerInterval: number | null = null;
    private parser: FrontmatterParser;
    private fileOpenEventRef: EventRef;

    constructor(private app: App, private settings: PluginSettings) {
        this.parser = new FrontmatterParser(app);
    }

    start() {
        this.fileOpenEventRef = this.app.workspace.on("file-open", this.onFileOpen.bind(this));

        // Check initially active file once workspace is ready
        this.app.workspace.onLayoutReady(() => {
            this.onFileOpen(this.app.workspace.getActiveFile());
        });

        // Periodically save every minute
        this.timerInterval = window.setInterval(() => {
            this.saveCurrentTime();
        }, 60000);
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

    private async onFileOpen(file: TFile | null) {
        if (!this.settings.trackTimeSpent) return;

        // Save previous file's time
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

    public async saveCurrentTime() {
        if (!this.settings.trackTimeSpent || !this.activeFile || !this.startTime) return;

        const now = Date.now();
        const elapsedMs = now - this.startTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);

        if (elapsedMinutes > 0) {
            // Read current time from file
            const fm = this.parser.read(this.activeFile);
            const newTime = fm.time_spent_minutes + elapsedMinutes;
            await this.parser.update(this.activeFile, { time_spent_minutes: newTime });

            // Reset start time so we don't double count, keep the remainder MS
            this.startTime = now - (elapsedMs % 60000);
        }
    }
}
