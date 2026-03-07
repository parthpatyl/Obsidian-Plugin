import { requestUrl } from "obsidian";

export interface LeetCodeData {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    topics: string[];
    content: string; // HTML string
    javaTemplate: string;
}

export class LeetCodeFetcher {
    /**
     * Extracts the problem slug from a LeetCode URL.
     * Works with "https://leetcode.com/problems/two-sum/" -> "two-sum"
     */
    static extractSlug(url: string): string | null {
        try {
            const parsed = new URL(url);
            const pathParts = parsed.pathname.split("/").filter(Boolean);
            if (pathParts[0] === "problems" && pathParts[1]) {
                return pathParts[1];
            }
        } catch {
            // Invalid URL
        }
        return null;
    }

    /**
     * Fetch problem data from LeetCode GraphQL API.
     */
    static async fetchProblemData(slug: string): Promise<LeetCodeData | null> {
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
            const response = await requestUrl({
                url: "https://leetcode.com/graphql",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0",
                },
                body: JSON.stringify({
                    operationName: "questionData",
                    variables: { titleSlug: slug },
                    query: query,
                }),
            });

            if (response.status !== 200 || !response.json || !response.json.data || !response.json.data.question) {
                console.error("Failed to fetch LeetCode data", response);
                return null;
            }

            const q = response.json.data.question;

            // Extract Java code snippet
            let javaTemplate = "class Solution {\n    public void solve() {\n        // Your solution here\n    }\n}";
            if (q.codeSnippets) {
                const javaSnippet = q.codeSnippets.find((s: any) => s.lang === "Java");
                if (javaSnippet) {
                    javaTemplate = javaSnippet.code;
                }
            }

            return {
                title: q.title || "Unknown Title",
                difficulty: q.difficulty as "Easy" | "Medium" | "Hard" || "Medium",
                topics: q.topicTags ? q.topicTags.map((t: any) => t.name) : ["Arrays"],
                content: q.content || "Problem statement not found.",
                javaTemplate: javaTemplate
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
    static htmlToMarkdown(html: string): string {
        let md = html;

        // Remove styling tags
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

        // Remove images entirely (they leave stray * chars when wrapped in <em>)
        md = md.replace(/<img[^>]*\/?>/gi, "");

        md = md.replace(/<sup>/gi, "^");
        md = md.replace(/<\/sup>/gi, "");

        md = md.replace(/<pre[^>]*>/gi, "\n");
        md = md.replace(/<\/pre>/gi, "\n");

        // Format Input/Output/Explanation lines to match expected SolutionRunner format
        md = md.replace(/\*\*Input:?\*\*\s*([^\n]+)/gi, "- **Input:** `$1`");
        md = md.replace(/\*\*Output:?\*\*\s*([^\n]+)/gi, "- **Output:** `$1`");
        md = md.replace(/\*\*Explanation:?\*\*\s*([^\n]+)/gi, "- **Explanation:** $1");

        // Convert **Constraints:** and **Example N:** bold headers to ## headings
        md = md.replace(/\*\*Constraints:?\*\*/gi, "## Constraints");
        md = md.replace(/\*\*(Example\s+\d+):?\*\*/gi, "**$1:**");

        // Lists
        md = md.replace(/<ul[^>]*>/gi, "");
        md = md.replace(/<\/ul>/gi, "");
        md = md.replace(/<li[^>]*>/gi, "- ");
        md = md.replace(/<\/li>/gi, "\n");

        md = md.replace(/<p[^>]*>/gi, "");
        md = md.replace(/<\/p>/gi, "\n\n");

        // Links
        md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "[$2]($1)");

        // Remove all other tags
        md = md.replace(/<[^>]+>/g, "");

        // Decode HTML entities
        md = md.replace(/&nbsp;/g, " ");
        md = md.replace(/&lt;/g, "<");
        md = md.replace(/&gt;/g, ">");
        md = md.replace(/&amp;/g, "&");
        md = md.replace(/&quot;/g, '"');
        md = md.replace(/&#39;/g, "'");

        // Strip leading tabs/spaces from list items
        md = md.replace(/^[ \t]+(- )/gm, "$1");

        // Collapse multiple blank lines
        md = md.replace(/\n{3,}/g, "\n\n");

        // Clean up lone * or ** lines left from stripped image wrappers
        md = md.replace(/^\*+\s*$/gm, "");

        return md.trim();
    }
}
