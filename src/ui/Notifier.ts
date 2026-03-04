import { Notice } from "obsidian";

export class Notifier {
  static success(message: string): void {
    new Notice(`✅ ${message}`, 3000);
  }

  static error(message: string): void {
    new Notice(`❌ ${message}`, 5000);
  }

  static info(message: string): void {
    new Notice(`ℹ️ ${message}`, 3000);
  }
}
