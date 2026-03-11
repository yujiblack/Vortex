package api

import (
	"encoding/json"
	"log"
	"net/http"
	"voxdeploy/cmd/internal/github"
)

// WebhookPayload maps the specific JSON fields we care about from GitHub
type WebhookPayload struct {
	Action      string `json:"action"` // We want "completed"
	WorkflowRun struct {
		Conclusion string `json:"conclusion"` // We want "failure"
		LogsURL    string `json:"logs_url"`
		HeadSHA    string `json:"head_sha"` // The commit that broke it
	} `json:"workflow_run"`
	Repository struct {
		FullName string `json:"full_name"` // e.g., "username/repo"
	} `json:"repository"`
}

type Gateway struct {
	GitHubToken string
}

func (g *Gateway) HandleGitHubWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload WebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if payload.Action != "completed" || payload.WorkflowRun.Conclusion != "failure" {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ignored: Not a failed workflow completion"))
		return
	}

	log.Printf("🚨 FAILED BUILD DETECTED: %s (Commit: %s)", payload.Repository.FullName, payload.WorkflowRun.HeadSHA)

	go g.processFailedBuild(payload)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Webhook received. Processing logs in background..."))
}

func (g *Gateway) processFailedBuild(payload WebhookPayload) {
	log.Println("⚙️  Downloading logs in memory...")

	logs, err := github.FetchAndExtractLogs(payload.WorkflowRun.LogsURL, g.GitHubToken)
	if err != nil {
		log.Printf("❌ Failed to extract logs: %v", err)
		return
	}

	log.Printf("✅ Successfully extracted %d bytes of logs.", len(logs))

}
