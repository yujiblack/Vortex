package llm

import "fmt"

func BuildPrompt(errorLog string) string {
	prompt := fmt.Sprintf(`Analyze this error log and identify the file paths causing the failure.

CRITICAL RULES:
1. ONLY return files that exist in the repository's actual source code.
2. STRICTLY IGNORE any paths inside 'node_modules', 'vendor', system libraries, or hidden build folders.
3. If the stack trace shows an error inside a dependency (like node_modules), trace the stack trace UP to find the file in OUR source code that called the broken function.
4. If the error is clearly a missing dependency or version conflict, return 'package.json' (for Node) or 'go.mod' (for Go).

LOG:
%s`, errorLog)

	return prompt
}
