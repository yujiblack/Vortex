package llm

import "fmt"

// BuildPrompt is used by LogParser — returns JSON array of file paths
func BuildPrompt(errorLog, repoMap string) string {
	return fmt.Sprintf(`You are a CI/CD error analyzer. Extract ONLY the source file paths that caused the build failure.

OUTPUT FORMAT: Return a JSON array of file paths ONLY. Example: ["main.go"] or ["src/app.go", "lib/utils.go"]

RULES:
1. Return ONLY simple file paths like "main.go" or "cmd/main.go"
2. NEVER return diff content, line numbers, or code snippets
3. ONLY return files that appear in the REPOSITORY MAP below
4. For Go errors like "undefined: X", "syntax error", "cannot use" — find the .go file mentioned in the error line
5. If the error says "./main.go:23:17" then return ["main.go"]
6. Return [] if no source files can be identified

REPOSITORY MAP:
%s

ERROR LOG:
%s`, repoMap, errorLog)
}

// BuildFixPrompt is used by FixGenerator — returns a git diff
func BuildFixPrompt(errorLog, repoMap string) string {
	return fmt.Sprintf(`You are an expert software engineer and code repair system.

Your job is to analyze broken source code and generate a precise Git Unified Diff that fixes the error.

ERROR LOG:
%s

REPOSITORY MAP:
%s

CRITICAL RULES:
1. Output ONLY a valid Git Unified Diff. No explanations, no markdown, no JSON arrays.
2. The diff must start with "--- a/filename" and "+++ b/filename".
3. Every hunk must have a valid "@@ -x,y +x,y @@" header with EXACTLY correct line numbers.
4. Context lines must EXACTLY match the original source code character for character including empty lines.
5. Count empty lines carefully — they count as context lines too.
6. Include at least 3 context lines before and after each change.
7. Fix ONLY what is broken. Do not refactor or change anything else.
8. Only include files listed in the REPOSITORY MAP.
9. If no fix is possible, output an empty string.
10. Double check your line numbers before outputting.`, errorLog, repoMap)
}
