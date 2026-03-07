import { App, TFile } from "obsidian";
import { PluginSettings } from "../types";

export interface TestCase {
    index: number;
    inputs: { name: string; rawValue: string }[];
    expectedOutput: string;
}

export interface TestResult {
    testCase: TestCase;
    passed: boolean;
    actualOutput: string;
}

export interface RunResult {
    success: boolean;
    testResults: TestResult[];
    compilationError?: string;
    runtimeError?: string;
    summary: { passed: number; failed: number; total: number };
}

/**
 * Extracts Java solutions from markdown, compiles, and runs them
 * against test cases parsed from the Examples section.
 */
export class SolutionRunner {
    private app: App;
    private settings: PluginSettings;

    constructor(app: App, settings: PluginSettings) {
        this.app = app;
        this.settings = settings;
    }

    /**
     * Run the solution from the given file and return results.
     */
    async run(file: TFile): Promise<RunResult> {
        const content = await this.app.vault.read(file);

        // Extract Java code
        const javaCode = this.extractJavaCode(content);
        if (!javaCode) {
            return this.errorResult("No Java code block found in the file. Wrap your solution in ```java ... ```.");
        }

        // Parse test cases
        const testCases = this.parseTestCases(content);
        if (testCases.length === 0) {
            return this.errorResult("No test cases found. Use **Input:** `var = value` and **Output:** `value` format in the Examples section.");
        }

        // Detect method info
        const methodInfo = this.detectMethod(javaCode);
        if (!methodInfo) {
            return this.errorResult("Could not detect a public method in the Solution class.");
        }

        // Generate test harness
        const testHarness = this.generateTestHarness(javaCode, testCases, methodInfo);

        // Compile and run
        return await this.compileAndRun(testHarness, testCases);
    }

    /**
     * Extract the first ```java code block from the markdown content.
     */
    private extractJavaCode(content: string): string | null {
        const match = content.match(/```java\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }

    /**
     * Parse test cases from the markdown Examples section.
     * Expects format like:
     *   - **Input:** `height = [0,1,0,2]`
     *   - **Output:** `6`
     */
    private parseTestCases(content: string): TestCase[] {
        const testCases: TestCase[] = [];
        const lines = content.split("\n");

        let currentInputs: { name: string; rawValue: string }[] = [];
        let testIndex = 0;

        for (const line of lines) {
            // Match input lines: **Input:** `var = value` or **Input:** `var = value`, `var2 = value2`
            const inputMatch = line.match(/\*\*Input:?\*\*/i);
            if (inputMatch) {
                // Extract all `backtick` values from this line
                const backtickValues = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);
                currentInputs = [];

                for (const val of backtickValues) {
                    // Parse "varName = value" format
                    const assignMatch = val.match(/^(\w+)\s*=\s*(.+)$/);
                    if (assignMatch) {
                        currentInputs.push({
                            name: assignMatch[1].trim(),
                            rawValue: assignMatch[2].trim(),
                        });
                    } else {
                        // Single value without variable name
                        currentInputs.push({
                            name: "input",
                            rawValue: val.trim(),
                        });
                    }
                }
                continue;
            }

            // Match output lines: **Output:** `value`
            const outputMatch = line.match(/\*\*Output:?\*\*/i);
            if (outputMatch && currentInputs.length > 0) {
                const backtickValues = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);
                if (backtickValues.length > 0) {
                    testIndex++;
                    testCases.push({
                        index: testIndex,
                        inputs: [...currentInputs],
                        expectedOutput: backtickValues[0].trim(),
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
    private detectMethod(javaCode: string): MethodInfo | null {
        // Match: public <returnType> <methodName>(<params>) {
        const methodRegex = /public\s+([\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)/g;
        let match;

        while ((match = methodRegex.exec(javaCode)) !== null) {
            const returnType = match[1].trim();
            const methodName = match[2].trim();
            const paramsStr = match[3].trim();

            // Skip constructors (name matches class name)
            if (javaCode.includes(`class ${methodName}`)) continue;

            const params: ParamInfo[] = [];
            if (paramsStr) {
                const paramParts = this.splitParams(paramsStr);
                for (const part of paramParts) {
                    const trimmed = part.trim();
                    const lastSpace = trimmed.lastIndexOf(" ");
                    if (lastSpace !== -1) {
                        params.push({
                            type: trimmed.substring(0, lastSpace).trim(),
                            name: trimmed.substring(lastSpace + 1).trim(),
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
    private splitParams(paramsStr: string): string[] {
        const params: string[] = [];
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
    private generateTestHarness(
        javaCode: string,
        testCases: TestCase[],
        method: MethodInfo
    ): string {
        const lines: string[] = [];
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

            // Declare input variables
            const callArgs: string[] = [];
            for (let i = 0; i < method.params.length; i++) {
                const param = method.params[i];
                const input = tc.inputs[i] || tc.inputs[0]; // fallback to first input
                const javaDecl = this.toJavaDeclaration(param.type, `tc${tc.index}_${param.name}`, input.rawValue);
                lines.push(`            ${javaDecl}`);
                callArgs.push(`tc${tc.index}_${param.name}`);
            }

            // Call the method
            if (method.returnType === "void") {
                // For void methods (in-place modification), compare the first parameter after the call
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
    private toJavaDeclaration(type: string, varName: string, rawValue: string): string {
        // int[]
        if (type === "int[]") {
            const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
            return `int[] ${varName} = new int[]{${inner}};`;
        }
        // int[][]
        if (type === "int[][]") {
            // Expect [[1,2],[3,4]] format
            const parsed = this.parse2DArray(rawValue);
            return `int[][] ${varName} = new int[][]{${parsed}};`;
        }
        // String[]
        if (type === "String[]") {
            const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
            const items = inner.split(",").map(s => `"${s.trim().replace(/"/g, "").replace(/'/g, "")}"`).join(", ");
            return `String[] ${varName} = new String[]{${items}};`;
        }
        // String
        if (type === "String") {
            const cleaned = rawValue.replace(/^"/, "").replace(/"$/, "");
            return `String ${varName} = "${cleaned}";`;
        }
        // char
        if (type === "char") {
            const cleaned = rawValue.replace(/^'/, "").replace(/'$/, "").replace(/^"/, "").replace(/"$/, "");
            return `char ${varName} = '${cleaned}';`;
        }
        // char[]
        if (type === "char[]") {
            // Expect ["h","e","l","l","o"] format
            const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
            const items = inner.split(",").map(s => {
                const cleaned = s.trim().replace(/"/g, "").replace(/'/g, "");
                return `'${cleaned}'`;
            }).join(", ");
            return `char[] ${varName} = new char[]{${items}};`;
        }
        // List<Integer>
        if (type === "List<Integer>") {
            const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
            return `List<Integer> ${varName} = Arrays.asList(${inner});`;
        }
        // List<String>
        if (type === "List<String>") {
            const inner = rawValue.replace(/^\[/, "").replace(/\]$/, "");
            const items = inner.split(",").map(s => `"${s.trim().replace(/"/g, "")}"`).join(", ");
            return `List<String> ${varName} = Arrays.asList(${items});`;
        }
        // List<List<Integer>>
        if (type === "List<List<Integer>>") {
            const arrays = this.parseNestedArrays(rawValue);
            const lists = arrays.map(arr => `Arrays.asList(${arr})`).join(", ");
            return `List<List<Integer>> ${varName} = Arrays.asList(${lists});`;
        }
        // boolean
        if (type === "boolean") {
            return `boolean ${varName} = ${rawValue.toLowerCase()};`;
        }
        // double / float
        if (type === "double" || type === "float") {
            return `${type} ${varName} = ${rawValue};`;
        }
        // long
        if (type === "long") {
            return `long ${varName} = ${rawValue}L;`;
        }
        // Default: int or other primitive
        return `${type} ${varName} = ${rawValue};`;
    }

    /**
     * Convert a result variable to its string representation for comparison.
     */
    private toStringExpr(type: string, varName: string): string {
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
    private normalizeExpected(returnType: string, expected: string): string {
        if (returnType === "int[]") {
            // Convert [1, 2, 3] to Java Arrays.toString format
            return `"${expected.replace(/\s+/g, " ")}"`;
        }
        if (returnType === "int[][]") {
            return `"${expected.replace(/\s+/g, " ")}"`;
        }
        if (returnType === "char[]") {
            // Convert ["o","l","l","e","h"] to Java Arrays.toString format: [o, l, l, e, h]
            const inner = expected.replace(/^\[/, "").replace(/\]$/, "");
            const items = inner.split(",").map(s => s.trim().replace(/"/g, "").replace(/'/g, ""));
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
    private parse2DArray(raw: string): string {
        const innerArrays = this.parseNestedArrays(raw);
        return innerArrays.map(arr => `{${arr}}`).join(", ");
    }

    /**
     * Parse nested arrays like [[1,2],[3,4]] into individual inner strings.
     */
    private parseNestedArrays(raw: string): string[] {
        const results: string[] = [];
        // Remove outer brackets
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
    private async compileAndRun(source: string, testCases: TestCase[]): Promise<RunResult> {
        // Use Node.js APIs available in Obsidian's Electron environment
        const { execSync } = require("child_process") as typeof import("child_process");
        const fs = require("fs") as typeof import("fs");
        const os = require("os") as typeof import("os");
        const path = require("path") as typeof import("path");

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-"));

        try {
            // Write source file
            const sourceFile = path.join(tmpDir, "TestRunner.java");
            fs.writeFileSync(sourceFile, source, "utf-8");

            // Compile
            try {
                execSync(`javac "${sourceFile}"`, {
                    cwd: tmpDir,
                    timeout: 15000,
                    encoding: "utf-8",
                });
            } catch (err: any) {
                return {
                    success: false,
                    testResults: [],
                    compilationError: err.stderr || err.message || "Compilation failed",
                    summary: { passed: 0, failed: testCases.length, total: testCases.length },
                };
            }

            // Run
            let stdout: string;
            try {
                stdout = execSync(`java -cp "${tmpDir}" TestRunner`, {
                    cwd: tmpDir,
                    timeout: 10000,
                    encoding: "utf-8",
                }) as string;
            } catch (err: any) {
                return {
                    success: false,
                    testResults: [],
                    runtimeError: err.stderr || err.stdout || err.message || "Runtime error",
                    summary: { passed: 0, failed: testCases.length, total: testCases.length },
                };
            }

            // Parse output
            return this.parseOutput(stdout, testCases);

        } finally {
            // Cleanup
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {
                // ignore cleanup errors
            }
        }
    }

    /**
     * Parse the stdout from the test runner.
     */
    private parseOutput(stdout: string, testCases: TestCase[]): RunResult {
        const lines = stdout.trim().split("\n");
        const testResults: TestResult[] = [];
        let passed = 0, failed = 0;

        for (const line of lines) {
            if (line.startsWith("PASS:")) {
                // PASS:1:actualValue
                const parts = line.split(":");
                const idx = parseInt(parts[1]);
                const actual = parts.slice(2).join(":");
                const tc = testCases.find(t => t.index === idx);
                if (tc) {
                    testResults.push({ testCase: tc, passed: true, actualOutput: actual });
                    passed++;
                }
            } else if (line.startsWith("FAIL:")) {
                // FAIL:1:actualValue:EXPECTED:expectedValue
                const parts = line.split(":EXPECTED:");
                const prefix = parts[0]; // FAIL:1:actualValue
                const prefixParts = prefix.split(":");
                const idx = parseInt(prefixParts[1]);
                const actual = prefixParts.slice(2).join(":");
                const tc = testCases.find(t => t.index === idx);
                if (tc) {
                    testResults.push({ testCase: tc, passed: false, actualOutput: actual });
                    failed++;
                }
            }
        }

        return {
            success: failed === 0,
            testResults,
            summary: { passed, failed, total: passed + failed },
        };
    }

    /**
     * Create an error result with a message.
     */
    private errorResult(message: string): RunResult {
        return {
            success: false,
            testResults: [],
            compilationError: message,
            summary: { passed: 0, failed: 0, total: 0 },
        };
    }
}

interface MethodInfo {
    methodName: string;
    returnType: string;
    params: ParamInfo[];
}

interface ParamInfo {
    type: string;
    name: string;
}
