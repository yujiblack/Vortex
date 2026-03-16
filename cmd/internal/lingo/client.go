package lingo

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	APIKey     string
	HTTPClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}
}

type LocalizeRequest struct {
	SourceLocale string            `json:"sourceLocale"`
	TargetLocale string            `json:"targetLocale"`
	Data         map[string]string `json:"data"`
}

type LocalizeResponse struct {
	SourceLocale string            `json:"sourceLocale"`
	TargetLocale string            `json:"targetLocale"`
	Data         map[string]string `json:"data"`
}

// EngineRequest kept for compatibility with existing call sites
type EngineRequest struct {
	Text         string
	SourceLocale string
	TargetLocale string
	Context      string
	BrandVoice   string
	Instructions string
}

func (c *Client) EngineTranslate(req EngineRequest) (string, error) {
	endpoint := "https://api.lingo.dev/process/localize"

	payload := LocalizeRequest{
		SourceLocale: req.SourceLocale,
		TargetLocale: req.TargetLocale,
		Data: map[string]string{
			"command": req.Text,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("X-API-Key", c.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		responseBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("lingo API error (status %d): %s", resp.StatusCode, string(responseBody))
	}

	var lingoResp LocalizeResponse
	if err := json.NewDecoder(resp.Body).Decode(&lingoResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	translated, ok := lingoResp.Data["command"]
	if !ok {
		return "", fmt.Errorf("no translation returned")
	}

	return translated, nil
}
