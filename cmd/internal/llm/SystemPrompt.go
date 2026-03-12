package llm

import "fmt"

func BuildPrompt(errorLog, repoMap string) string {
	prompt := fmt.Sprintf(`Analyze this error log and identify the file paths causing the failure.

CRITICAL RULES:
1. ONLY return files that exactly match the files listed in the REPOSITORY MAP below.
2. STRICTLY IGNORE any paths inside 'node_modules', 'vendor', system libraries, or hidden build folders.
3. If the stack trace shows an error inside a dependency (like node_modules), trace the stack trace UP to find the file in the REPOSITORY MAP that called the broken function.
4. If the error is clearly a missing dependency or version conflict, return 'package.json' (for Node) or 'go.mod' (for Go).
5. If no files in the map match the error, return an empty array.

REPOSITORY MAP:
%s

LOG:
%s`, repoMap, errorLog)

	return prompt
}
