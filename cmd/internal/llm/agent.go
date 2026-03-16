// package llm

// import (
// 	"bytes"
// 	"encoding/json"
// 	"fmt"
// 	"io"
// 	"net/http"
// )

// type Client struct {
// 	APIKey     string
// 	HTTPClient *http.Client
// }

// func NewClient(apiKey string) *Client {
// 	return &Client{
// 		APIKey:     apiKey,
// 		HTTPClient: &http.Client{},
// 	}
// }

// type OpenAIChatRequest struct {
// 	Model       string    `json:"model"`
// 	Messages    []Message `json:"messages"`
// 	Temperature float64   `json:"temperature"`
// }
// type Message struct {
// 	Role    string `json:"role"`
// 	Content string `json:"content"`
// }

// type OpenAIChatResponse struct {
// 	Choices []struct {
// 		Message Message `json:"message"`
// 	} `json:"choices"`
// }

// func (c *Client) GenerateFix(translatedCommand, errorLog, sourceCode string) (string, error) {
// 	endpoint := "https://api.openai.com/v1/chat/completions"

// 	userPrompt := fmt.Errorf("INSTRUCTION:\n%s\n\nERROR LOG:\n%s\n\nSOURCE CODE:\n%s",
// 		translatedCommand, errorLog, sourceCode)

// 	reqBody := OpenAIChatRequest{
// 		Model:       "gpt-4o",
// 		Temperature: 0.1,
// 		Messages: []Message{
// 			{Role: "system", Content: SystemPrompt},
// 			{Role: "user", Content: userPrompt.Error()}, // using Error() just to extract the formatted string
// 		},
// 	}

// 	bodyBytes, err := json.Marshal(reqBody)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to marshal LLM request: %w", err)
// 	}

// 	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
// 	if err != nil {
// 		return "", fmt.Errorf("failed to create request: %w", err)
// 	}

// 	req.Header.Set("Authorization", "Bearer "+c.APIKey)
// 	req.Header.Set("Content-Type", "application/json")

// 	resp, err := c.HTTPClient.Do(req)
// 	if err != nil {
// 		return "", fmt.Errorf("LLM request failed: %w", err)
// 	}
// 	defer resp.Body.Close()

// 	if resp.StatusCode != http.StatusOK {
// 		respBody, _ := io.ReadAll(resp.Body)
// 		return "", fmt.Errorf("LLM API error (status %d): %s", resp.StatusCode, string(respBody))
// 	}

// 	var chatResp OpenAIChatResponse
// 	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
// 		return "", fmt.Errorf("failed to decode LLM response: %w", err)
// 	}

// 	if len(chatResp.Choices) == 0 {
// 		return "", fmt.Errorf("LLM returned no choices")
// 	}

// 	return chatResp.Choices[0].Message.Content, nil
// }

package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"google.golang.org/genai"
)

type Client struct {
	APIKey     string
	HTTPClient *http.Client
}

type GenerateContentConfig struct {
	SystemInstruction *genai.Content
	Temperature       *float32
	ResponseSchema    *genai.Schema
	ResponseMIMEType  string
}

func (c *Client) FixGenerator(translatedCommand, errorLog, repoMap string, fileContexts map[string]string) (string, error) {
	ctx := context.Background()
	genaiClient, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: c.APIKey})
	if err != nil {
		return "", fmt.Errorf("failed to create genai client: %w", err)
	}

	var sourceCodeBuilder strings.Builder
	for path, code := range fileContexts {
		sourceCodeBuilder.WriteString(fmt.Sprintf("\n--- FILE: %s ---\n%s\n", path, code))
	}

	userPrompt := fmt.Sprintf(
		"INSTRUCTION:\n%s\n\nFILES PROVIDED:\n%s",
		translatedCommand,
		sourceCodeBuilder.String(),
	)
	temp := float32(0.0)

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(BuildFixPrompt(errorLog, repoMap), genai.RoleUser), // ← repoMap passed
		Temperature:       &temp,
	}

	var result *genai.GenerateContentResponse
	for attempt := 1; attempt <= 3; attempt++ {
		result, err = genaiClient.Models.GenerateContent(
			ctx, "gemini-2.5-flash", genai.Text(userPrompt), config,
		)
		if err == nil {
			break
		}
		log.Printf("Gemini attempt %d failed: %v", attempt, err)
		if attempt < 3 {
			time.Sleep(time.Duration(attempt*5) * time.Second)
		}
	}

	if err != nil {
		return "", fmt.Errorf("gemini fix generation failed: %w", err)
	}

	return cleanMarkdownBlocks(result.Text()), nil
}

func cleanMarkdownBlocks(text string) string {
	text = strings.TrimSpace(text)
	if strings.HasPrefix(text, "```") {
		lines := strings.Split(text, "\n")
		if len(lines) > 2 {
			text = strings.Join(lines[1:len(lines)-1], "\n")
		}
	}

	return strings.TrimSpace(text)
}
func (c *Client) LogParser(errorLog string, repoMap string) ([]string, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: c.APIKey})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	config := &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema: &genai.Schema{
			Type:  genai.TypeArray,
			Items: &genai.Schema{Type: genai.TypeString},
		},
	}

	prompt := BuildPrompt(errorLog, repoMap)

	// Retry up to 3 times with exponential backoff
	var result *genai.GenerateContentResponse
	for attempt := 1; attempt <= 3; attempt++ {
		result, err = client.Models.GenerateContent(
			ctx, "gemini-2.5-flash", genai.Text(prompt), config,
		)
		if err == nil {
			break
		}
		log.Printf("⚠️ Gemini attempt %d failed: %v", attempt, err)
		if attempt < 3 {
			time.Sleep(time.Duration(attempt*5) * time.Second)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("gemini extraction failed after 3 attempts: %w", err)
	}

	var filePaths []string
	if err := json.Unmarshal([]byte(result.Text()), &filePaths); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from Gemini: %w", err)
	}

	return filePaths, nil
}
