import { VaultStats } from "../types";

export class StatusBarController {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  update(stats: VaultStats): void {
    if (!stats) {
      this.element.setText("DSA | Loading...");
      return;
    }

    const { totalProblems, totalAttempts } = stats;
    this.element.setText(`DSA | ${totalProblems} problems | ${totalAttempts} attempts`);
  }

  clear(): void {
    this.element.setText("");
  }
}
