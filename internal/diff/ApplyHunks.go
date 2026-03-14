package diff

import (
	"fmt"
	"strings"
)

func applyHunks(orignal string, hunks []Hunk) (string, error) {
	originalLines := strings.Split(orignal, "\n")
	var outputLines []string

	cursor := 1

	for _, hunk := range hunks {
		if hunk.OldStart < cursor {
			return "", fmt.Errorf("overlapping hunks at line %d", hunk.OldStart)
		}

		if hunk.OldStart > len(originalLines)+1 {
			return "", fmt.Errorf("hunk OldStart %d is beyond file length %d", hunk.OldStart, len(originalLines))
		}

		//this part copies the old stuf
		for cursor < hunk.OldStart {
			outputLines = append(outputLines, originalLines[cursor-1])
			cursor++
		}

		for _, line := range hunk.Lines {
			switch line.Type {
			case Context:
				if originalLines[cursor-1] != line.Content {
					return "", fmt.Errorf(
						"context mismatch at line %d:\n  expected: %q\n  got: %q",
						cursor, line.Content, originalLines[cursor-1],
					)
				}

				outputLines = append(outputLines, line.Content)
				cursor++

			case Added:
				outputLines = append(outputLines, line.Content)

			case Removed:

				// make a function outta this
				if originalLines[cursor-1] != line.Content {
					return "", fmt.Errorf(
						"remove mismatch at line %d:\n  expected: %q\n  got: %q",
						cursor, line.Content, originalLines[cursor-1],
					)
				}

				cursor++

			}

		}

	}

	for cursor <= len(originalLines) {
		outputLines = append(outputLines, originalLines[cursor-1])
		cursor++
	}
	return strings.Join(outputLines, "\n"), nil

	//this applies github diffs

}

func ApplyDiff(fileDiffs []FileDiff, fileContext map[string]string) (map[string]string, error) {
	result := make(map[string]string)

	for _, fd := range fileDiffs {
		original, ok := fileContext[fd.Path]
		if !ok {
			return nil, fmt.Errorf("file not found in context: %s", fd.Path)
		}

		patched, err := applyHunks(original, fd.Hunks)
		if err != nil {
			return nil, fmt.Errorf("failed to apply hunks to %s: %w", fd.Path, err)
		}

		result[fd.Path] = patched
	}

	return result, nil
}
