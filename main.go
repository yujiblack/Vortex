package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type lingoClient struct {
	APIKey     string
	HTTPClient *http.Client
}

type LocalizeRequest struct {
	Text         string   `json:"text"`
	SourceLocale string   `json:"sourceLocale,omitempty"`
	TargetLocale string   `json:"targetLocale"`
	Context      []string `json:"context,omitempty"`
}

type LocalizeResponse struct {
	TranslatedText string `json:"translatedText"`
}

func (c *lingoClient) Localize(req LocalizeRequest) (string, error) {
	endpoint := "https://api.lingo.dev/v1/localize"
	body, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))

	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.APIKey)
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

	return lingoResp.TranslatedText, nil
}
