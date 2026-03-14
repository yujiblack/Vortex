package lingo

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct { // ← exported
	APIKey     string
	HTTPClient *http.Client
}

func NewClient(apiKey string) *Client { // ← returns exported type
	return &Client{
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}
}

type EngineRequest struct {
	Text         string `json:"text"`
	SourceLocale string `json:"sourceLocale,omitempty"`
	TargetLocale string `json:"targetLocale"`
	Context      string `json:"context,omitempty"`
	BrandVoice   string `json:"brandVoice,omitempty"`
	GlossaryID   string `json:"glossaryId,omitempty"`
	Instructions string `json:"instructions,omitempty"`
}

type EngineResponse struct {
	TranslatedText string   `json:"translatedText"`
	QualityScore   *float64 `json:"qualityScore,omitempty"`
}

func (c *Client) EngineTranslate(req EngineRequest) (string, error) {
	endpoint := "https://api.lingo.dev/v1/localize"

	body, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal engine request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("X-Api-Key", c.APIKey)
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

	var engineResp EngineResponse
	if err := json.NewDecoder(resp.Body).Decode(&engineResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return engineResp.TranslatedText, nil
}
