package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"voxdeploy/cmd/internal/github"
	"voxdeploy/cmd/internal/llm"
)

type WebHookPayload struct {
	Action       string `json:"action"`
	WorkFlow_run struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Status     string `json:"status"`
		Conclusion string `json:"conclusion"`
		LogsURL    string `json:"logs_url"`
		HeadBranch string `json:"head_branch"`
		HeadSHA    string `json:"head_sha"`
	} `json:"workflow_run"`
	// "repository": {
	//    "name": "phoenixguard",
	//    "full_name": "user/phoenixguard"
	//  }
	Repository struct {
		// "name": "phoenixguard",
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
}

func (g *Gateway) webHookHandler(w http.ResponseWriter, r *http.Request) {
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

	err = json.NewDecoder(r.Body).Decode(&payload)

	if err != nil {
		http.Error(w, "invalid payload", 400)
		return
	}

	if payload.WorkFlow_run.Conclusion == "failure" {
		fmt.Println("CI FAILED")
		fmt.Println("Repo:", payload.Repository.FullName)
		fmt.Println("Logs:", payload.WorkFlow_run.LogsURL)
	}

	if payload.Action != "completed" || payload.WorkFlow_run.Conclusion != "failure" {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ignored: Not a failed workflow completion"))
		return
	}

	go g.processFailedBuild(payload)

	w.WriteHeader(http.StatusOK)

}

// exxtractor
func (g *Gateway) processFailedBuild(payload WebHookPayload) {
	owner := payload.Repository.Owner.Login
	repo := payload.Repository.Name
	branch := payload.WorkFlow_run.HeadBranch

	log.Println("starting download")

	combinedLogs, err := github.FetchAndExtractLogs(payload.WorkFlow_run.LogsURL, g.GithubToken)
	if err != nil {
		log.Printf(" Failed to extract logs: %v", err)
		return
	}

	repoTree, err := github.FileStructure(owner, repo, branch, g.GithubToken, *g.HTTPClient)
	if err != nil {
		log.Printf("Failed to extract logs : %v", err)
		return
	}

	log.Println("Starting data xtraction process")
	BrokenFilesPath, err := g.LLMClient.LogParser(combinedLogs, repoTree)
	if err != nil {
		log.Printf("AI failed to parse logs: %v", err)
		return
	}
	if len(BrokenFilesPath) == 0 {
		log.Println(" AI could not pinpoint specific source files. Might be an infrastructure issue.")
		return
	}

	log.Printf(" targets: %v", BrokenFilesPath)

	log.Println(" Fetching source code for targeted files...")

	// fileContext := make(map[string]string)
	repoName := payload.Repository.Name

	// for _, filePath := range BrokenFilesPath {
	// 	code, err := github.FetchFileContent(owner, repoName, filePath, g.GithubToken)
	// 	if err != nil {
	// 		log.Printf("Could not fetch %s: %v", filePath, err)
	// 		continue
	// 	}
	// 	fileContext[filePath] = code
	// }

	var (
		mu          sync.Mutex
		wg          sync.WaitGroup
		fileContext = make(map[string]string)
	)
	for _, filePath := range BrokenFilesPath {
		wg.Add(1)
		go func(fp string) {
			defer wg.Done()
			code, err := github.FetchFileContent(owner, repoName, fp, g.GithubToken)
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

	mockVoiceCommand := "Fix the bug causing the build failure."

	gitDiff, err := g.LLMClient.FixGenerator(mockVoiceCommand, combinedLogs, fileContext)
	if err != nil {
		log.Printf("AI failed to generate fix: %v", err)
		return
	}

	log.Println("fix generated - ", gitDiff)

}
