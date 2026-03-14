package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"voxdeploy/cmd/internal/github"
	"voxdeploy/cmd/internal/lingo"
	"voxdeploy/cmd/internal/llm"
)

type WebHookPayload struct {
	Action      string `json:"action"`
	WorkflowRun struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Status     string `json:"status"`
		Conclusion string `json:"conclusion"`
		LogsURL    string `json:"logs_url"`
		HeadBranch string `json:"head_branch"`
		HeadSHA    string `json:"head_sha"`
	} `json:"workflow_run"`
	Repository struct {
		Name  string `json:"name"`
		Owner struct {
			Login string `json:"login"`
		} `json:"owner"`
		FullName string `json:"full_name"`
	} `json:"repository"`
}

type Gateway struct {
	GithubToken   string
	LLMClient     *llm.Client
	WebHookSecret string
	HTTPClient    *http.Client
	LingoClient   *lingo.Client
}

func (g *Gateway) WebHookHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "cannot read body", http.StatusBadRequest)
		return
	}

	if !verifyGitHubSignature(r, body, g.WebHookSecret) {
		http.Error(w, "invalid signature", http.StatusUnauthorized)
		return
	}

	var payload WebHookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	if payload.Action != "completed" || payload.WorkflowRun.Conclusion != "failure" {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ignored: Not a failed workflow completion"))
		return
	}

	fmt.Println("CI FAILED")
	fmt.Println("Repo:", payload.Repository.FullName)
	fmt.Println("Logs:", payload.WorkflowRun.LogsURL)

	go g.processFailedBuild(payload)
	w.WriteHeader(http.StatusOK)
}

func (g *Gateway) processFailedBuild(payload WebHookPayload) {
	owner := payload.Repository.Owner.Login
	repo := payload.Repository.Name
	branch := payload.WorkflowRun.HeadBranch

	log.Println("Starting log download...")
	combinedLogs, err := github.FetchAndExtractLogs(payload.WorkflowRun.LogsURL, g.GithubToken)
	if err != nil {
		log.Printf("Failed to extract logs: %v", err)
		return
	}

	repoTree, err := github.FileStructure(owner, repo, branch, g.GithubToken, g.HTTPClient)
	if err != nil {
		log.Printf("Failed to fetch file structure: %v", err)
		return
	}

	log.Println("Starting AI log parsing...")
	brokenFilePaths, err := g.LLMClient.LogParser(combinedLogs, repoTree)
	if err != nil {
		log.Printf("AI failed to parse logs: %v", err)
		return
	}

	if len(brokenFilePaths) == 0 {
		log.Println("AI could not pinpoint specific source files. Might be an infrastructure issue.")
		return
	}

	log.Printf("Targets: %v", brokenFilePaths)
	log.Println("Fetching source code for targeted files...")

	var (
		mu          sync.Mutex
		wg          sync.WaitGroup
		fileContext = make(map[string]string)
	)

	for _, filePath := range brokenFilePaths {
		wg.Add(1)
		go func(fp string) {
			defer wg.Done()
			code, err := github.FetchFileContent(owner, repo, fp, g.GithubToken)
			if err != nil {
				log.Printf("Could not fetch %s: %v", fp, err)
				return
			}
			mu.Lock()
			fileContext[fp] = code
			mu.Unlock()
		}(filePath)
	}
	wg.Wait()

	log.Println("AI is generating the code fix...")

	voiceCommand, err := g.LingoClient.EngineTranslate(lingo.EngineRequest{
		Text:         "बिल्ड फेलियर का बग ठीक करो",
		SourceLocale: "hi",
		TargetLocale: "en",
		Context:      "A GitHub Actions CI/CD pipeline failed in a production Go service",
		BrandVoice:   "Technical, concise, SRE tone",
		Instructions: "Do not translate anything enclosed in backticks or angle brackets.",
	})

	if err != nil {
		log.Printf("Lingo translation failed, falling back to default command: %v", err)
		voiceCommand = "Fix the bug causing the build failure."
	}

	gitDiff, err := g.LLMClient.FixGenerator(voiceCommand, combinedLogs, repoTree, fileContext)
	if err != nil {
		log.Printf("AI failed to generate fix: %v", err)
		return
	}

	log.Println("Fix generated:\n", gitDiff)
}
