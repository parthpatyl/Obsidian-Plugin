import { App, Modal } from "obsidian";
import { RunResult } from "./SolutionRunner";

/**
 * Modal that displays the results of running a solution against test cases.
 */
export class RunResultModal extends Modal {
    private result: RunResult;

    constructor(app: App, result: RunResult) {
        super(app);
        this.result = result;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.addClass("dsa-run-result-modal");

        // Header
        const header = contentEl.createDiv("run-result-header");
        const icon = this.result.success ? "✅" : "❌";
        header.createEl("h2", { text: `${icon} Test Results` });

        // Show compilation error
        if (this.result.compilationError) {
            const errorSection = contentEl.createDiv("run-result-error");
            errorSection.createEl("h4", { text: "⚠️ Compilation Error" });
            errorSection.createEl("pre", {
                text: this.result.compilationError,
                cls: "run-error-output",
            });
            return;
        }

        // Show runtime error
        if (this.result.runtimeError) {
            const errorSection = contentEl.createDiv("run-result-error");
            errorSection.createEl("h4", { text: "💥 Runtime Error" });
            errorSection.createEl("pre", {
                text: this.result.runtimeError,
                cls: "run-error-output",
            });
            return;
        }

        // Summary bar
        const { passed, failed, total } = this.result.summary;
        const summaryBar = contentEl.createDiv("run-result-summary");
        const summaryClass = failed === 0 ? "summary-all-pass" : "summary-has-fail";
        summaryBar.addClass(summaryClass);
        summaryBar.createSpan({ text: `${passed}/${total} tests passed` });

        // Test case results
        const resultsContainer = contentEl.createDiv("run-result-cases");

        for (const tr of this.result.testResults) {
            const card = resultsContainer.createDiv("run-test-card");
            card.addClass(tr.passed ? "test-passed" : "test-failed");

            // Card header
            const cardHeader = card.createDiv("test-card-header");
            const statusIcon = tr.passed ? "✅" : "❌";
            cardHeader.createSpan({
                text: `${statusIcon} Test ${tr.testCase.index}`,
                cls: "test-card-title",
            });
            cardHeader.createSpan({
                text: tr.passed ? "PASSED" : "FAILED",
                cls: `test-badge ${tr.passed ? "badge-pass" : "badge-fail"}`,
            });

            // Card body
            const cardBody = card.createDiv("test-card-body");

            // Input
            const inputGroup = cardBody.createDiv("test-field");
            inputGroup.createEl("span", { text: "Input:", cls: "test-field-label" });
            const inputValues = tr.testCase.inputs
                .map(inp => `${inp.name} = ${inp.rawValue}`)
                .join(", ");
            inputGroup.createEl("code", { text: inputValues, cls: "test-field-value" });

            // Expected
            const expectedGroup = cardBody.createDiv("test-field");
            expectedGroup.createEl("span", { text: "Expected:", cls: "test-field-label" });
            expectedGroup.createEl("code", {
                text: tr.testCase.expectedOutput,
                cls: "test-field-value",
            });

            // Actual
            const actualGroup = cardBody.createDiv("test-field");
            actualGroup.createEl("span", { text: "Output:", cls: "test-field-label" });
            actualGroup.createEl("code", {
                text: tr.actualOutput,
                cls: `test-field-value ${tr.passed ? "" : "test-field-wrong"}`,
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
