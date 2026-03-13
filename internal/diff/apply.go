package diff

import (
	"fmt"
	"strings"
)

type Hunk struct {
	OldStart int
	OldCount int
	NewStart int
	NewCount int
	Lines    []Line
}

type Line struct {
	Type    LineType
	Content string
}

type LineType int

const (
	Context LineType = iota // unchanged line (starts with space)
	Added                   // new line (starts with +)
	Removed                 // deleted line (starts with -)
)

type FileDiff struct {
	Path  string
	Hunks []Hunk
}

// ParseDiff parses a unified git diff string into structured FileDiffs
func ParseDiff(rawDiff string) ([]FileDiff, error) {
	var fileDiffs []FileDiff
	var currentFile *FileDiff
	var currentHunk *Hunk

	lines := strings.Split(rawDiff, "\n")

	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// New file section: --- a/path or +++ b/path
		if strings.HasPrefix(line, "--- a/") {
			path := strings.TrimPrefix(line, "--- a/")
			fileDiffs = append(fileDiffs, FileDiff{Path: path})
			currentFile = &fileDiffs[len(fileDiffs)-1]
			currentHunk = nil
			continue
		}

		// Skip the +++ line, we already got path from ---
		if strings.HasPrefix(line, "+++ b/") {
			continue
		}

		// Skip diff --git header lines
		if strings.HasPrefix(line, "diff --git") ||
			strings.HasPrefix(line, "index ") ||
			strings.HasPrefix(line, "new file") ||
			strings.HasPrefix(line, "deleted file") {
			continue
		}

		// Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
		if strings.HasPrefix(line, "@@") {
			if currentFile == nil {
				return nil, fmt.Errorf("hunk found before file header at line %d", i)
			}
			hunk, err := parseHunkHeader(line)
			if err != nil {
				return nil, fmt.Errorf("failed to parse hunk header: %w", err)
			}
			currentFile.Hunks = append(currentFile.Hunks, hunk)
			currentHunk = &currentFile.Hunks[len(currentFile.Hunks)-1]
			continue
		}

		if currentHunk == nil {
			continue
		}

		// Parse each line in the hunk
		if strings.HasPrefix(line, "+") {
			currentHunk.Lines = append(currentHunk.Lines, Line{
				Type:    Added,
				Content: line[1:], // strip the leading +
			})
		} else if strings.HasPrefix(line, "-") {
			currentHunk.Lines = append(currentHunk.Lines, Line{
				Type:    Removed,
				Content: line[1:], // strip the leading -
			})
		} else if strings.HasPrefix(line, " ") {
			currentHunk.Lines = append(currentHunk.Lines, Line{
				Type:    Context,
				Content: line[1:], // strip the leading space
			})
		}
		// lines starting with \ (like "\ No newline at end of file") are skipped
	}

	return fileDiffs, nil
}

// parseHunkHeader parses "@@ -1,5 +1,7 @@ optional context"
func parseHunkHeader(line string) (Hunk, error) {
	var hunk Hunk

	// Extract the part between @@ and @@
	inner := line[3:] // strip leading "@@ "
	end := strings.Index(inner, " @@")
	if end == -1 {
		// some diffs have @@ -x,y +x,y @@ with no trailing context
		end = strings.Index(inner, "@@")
		if end == -1 {
			return hunk, fmt.Errorf("malformed hunk header: %s", line)
		}
	}
	inner = inner[:end] // now we have "-1,5 +1,7"

	parts := strings.Fields(inner) // ["-1,5", "+1,7"]
	if len(parts) != 2 {
		return hunk, fmt.Errorf("unexpected hunk header format: %s", line)
	}

	_, err := fmt.Sscanf(parts[0], "-%d,%d", &hunk.OldStart, &hunk.OldCount)
	if err != nil {
		// handle single-line hunks like "-5" with no comma
		_, err = fmt.Sscanf(parts[0], "-%d", &hunk.OldStart)
		if err != nil {
			return hunk, fmt.Errorf("failed to parse old range: %w", err)
		}
		hunk.OldCount = 1
	}

	_, err = fmt.Sscanf(parts[1], "+%d,%d", &hunk.NewStart, &hunk.NewCount)
	if err != nil {
		_, err = fmt.Sscanf(parts[1], "+%d", &hunk.NewStart)
		if err != nil {
			return hunk, fmt.Errorf("failed to parse new range: %w", err)
		}
		hunk.NewCount = 1
	}

	return hunk, nil
}

// ApplyDiff applies a list of FileDiffs to a map of filename → file contents
// and returns the updated file contents
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

// applyHunks applies all hunks to a single file's content
func applyHunks(original string, hunks []Hunk) (string, error) {
	originalLines := strings.Split(original, "\n")
	var outputLines []string

	// cursor tracks our position in the original file (1-indexed like git)
	cursor := 1

	for _, hunk := range hunks {
		// Validate hunk start is reachable
		if hunk.OldStart < cursor {
			return "", fmt.Errorf("hunk OldStart %d is before cursor %d — overlapping hunks?", hunk.OldStart, cursor)
		}

		// Copy unchanged lines from cursor up to where this hunk starts
		for cursor < hunk.OldStart {
			idx := cursor - 1
			if idx >= len(originalLines) {
				return "", fmt.Errorf("cursor %d out of bounds (file has %d lines)", cursor, len(originalLines))
			}
			outputLines = append(outputLines, originalLines[idx])
			cursor++
		}

		// Apply the hunk line by line
		for _, line := range hunk.Lines {
			switch line.Type {
			case Context:
				// Verify context matches — catches misapplied diffs
				idx := cursor - 1
				if idx >= len(originalLines) {
					return "", fmt.Errorf("context line out of bounds at cursor %d", cursor)
				}
				if originalLines[idx] != line.Content {
					return "", fmt.Errorf(
						"context mismatch at line %d:\n  expected: %q\n  got:      %q",
						cursor, line.Content, originalLines[idx],
					)
				}
				outputLines = append(outputLines, line.Content)
				cursor++

			case Added:
				outputLines = append(outputLines, line.Content)
				// cursor does NOT advance — we're inserting, not consuming original

			case Removed:
				// Verify the line we're removing matches
				idx := cursor - 1
				if idx >= len(originalLines) {
					return "", fmt.Errorf("removed line out of bounds at cursor %d", cursor)
				}
				if originalLines[idx] != line.Content {
					return "", fmt.Errorf(
						"remove mismatch at line %d:\n  expected: %q\n  got:      %q",
						cursor, line.Content, originalLines[idx],
					)
				}
				cursor++ // consume original line but don't emit it
			}
		}
	}

	// Copy any remaining lines after the last hunk
	for cursor <= len(originalLines) {
		outputLines = append(outputLines, originalLines[cursor-1])
		cursor++
	}

	return strings.Join(outputLines, "\n"), nil
}
