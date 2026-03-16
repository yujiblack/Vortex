package k8s

import (
	"context"
	"fmt"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Command struct {
	Action    string
	Namespace string
	Target    string
	Replicas  int32
	TailLines int64
}

func InterpretCommand(translatedText string) (Command, error) {
	text := strings.ToLower(strings.TrimSpace(translatedText))
	cmd := Command{Namespace: "", TailLines: 50}

	switch {
	case contains(text, "crashing", "crash", "failed pods"):
		cmd.Action = "get_crashing_pods"
	case contains(text, "all pods", "list pods", "show pods", "status"):
		cmd.Action = "get_pods"
	case contains(text, "log", "logs"):
		cmd.Action = "get_logs"
		cmd.Target = extractTarget(text)
	case contains(text, "scale"):
		cmd.Action = "scale"
		cmd.Target = extractTarget(text)
		cmd.Replicas = extractReplicas(text)
	case contains(text, "restart", "rollback"):
		cmd.Action = "restart"
		cmd.Target = extractTarget(text)
	case contains(text, "deployment", "deployments"):
		cmd.Action = "get_deployments"
	default:
		return cmd, fmt.Errorf("could not interpret k8s command: %q", translatedText)
	}

	return cmd, nil
}

func (c *Client) ExecuteCommand(cmd Command) (string, error) {

	ctx := context.Background()

	// If namespace is empty and we have a target, find which namespace it's in
	if cmd.Namespace == "" && cmd.Target != "" {
		ns, err := c.findDeploymentNamespace(ctx, cmd.Target)
		if err == nil {
			cmd.Namespace = ns
		}
	}
	switch cmd.Action {
	case "scale":
		if cmd.Target == "" {
			return "", fmt.Errorf("no deployment name specified")
		}
		if cmd.Replicas == 0 {
			return "", fmt.Errorf("could not determine replica count")
		}
		scale, err := c.kube.AppsV1().Deployments(cmd.Namespace).GetScale(
			ctx, cmd.Target, metav1.GetOptions{},
		)
		if err != nil {
			return "", fmt.Errorf("failed to get scale: %w", err)
		}
		scale.Spec.Replicas = cmd.Replicas
		_, err = c.kube.AppsV1().Deployments(cmd.Namespace).UpdateScale(
			ctx, cmd.Target, scale, metav1.UpdateOptions{},
		)
		if err != nil {
			return "", fmt.Errorf("failed to scale: %w", err)
		}
		return fmt.Sprintf(" Scaled %s to %d replicas", cmd.Target, cmd.Replicas), nil
	case "get_pods":
		pods, err := c.kube.CoreV1().Pods(cmd.Namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to list pods: %w", err)
		}
		if len(pods.Items) == 0 {
			return "No pods found.", nil
		}
		var sb strings.Builder
		for _, p := range pods.Items {
			sb.WriteString(fmt.Sprintf("Pod: %s | Status: %s | Namespace: %s\n",
				p.Name, string(p.Status.Phase), p.Namespace))
		}
		return sb.String(), nil

	case "get_crashing_pods":
		pods, err := c.kube.CoreV1().Pods(cmd.Namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to list pods: %w", err)
		}
		var sb strings.Builder
		found := false
		for _, p := range pods.Items {
			var restarts int32
			for _, cs := range p.Status.ContainerStatuses {
				restarts += cs.RestartCount
			}
			if string(p.Status.Phase) == "Failed" || restarts > 3 {
				sb.WriteString(fmt.Sprintf("Pod: %s | Status: %s | Restarts: %d\n",
					p.Name, string(p.Status.Phase), restarts))
				found = true
			}
		}
		if !found {
			return "No crashing pods found.", nil
		}
		return " Crashing pods:\n" + sb.String(), nil

	case "get_deployments":
		deployments, err := c.kube.AppsV1().Deployments(cmd.Namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to list deployments: %w", err)
		}
		var sb strings.Builder
		for _, d := range deployments.Items {
			sb.WriteString(fmt.Sprintf("Deployment: %s | Ready: %d/%d\n",
				d.Name, d.Status.ReadyReplicas, *d.Spec.Replicas))
		}
		return sb.String(), nil

	case "restart":
		if cmd.Target == "" {
			return "", fmt.Errorf("no deployment name specified")
		}
		d, err := c.kube.AppsV1().Deployments(cmd.Namespace).Get(ctx, cmd.Target, metav1.GetOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to get deployment: %w", err)
		}
		if d.Spec.Template.Annotations == nil {
			d.Spec.Template.Annotations = make(map[string]string)
		}
		d.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = metav1.Now().String()
		_, err = c.kube.AppsV1().Deployments(cmd.Namespace).Update(ctx, d, metav1.UpdateOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to restart: %w", err)
		}
		return fmt.Sprintf("Restarted deployment %s", cmd.Target), nil
	default:
		return "", fmt.Errorf("unknown action: %s", cmd.Action)
	}
}
func (c *Client) findDeploymentNamespace(ctx context.Context, name string) (string, error) {
	// Search common namespaces
	namespaces := []string{"default", "voxdeploy", "monitoring", "kube-system"}
	for _, ns := range namespaces {
		_, err := c.kube.AppsV1().Deployments(ns).Get(ctx, name, metav1.GetOptions{})
		if err == nil {
			return ns, nil
		}
	}
	return "", fmt.Errorf("deployment %s not found in any namespace", name)
}
func contains(text string, keywords ...string) bool {
	for _, k := range keywords {
		if strings.Contains(text, k) {
			return true
		}
	}
	return false
}

func extractTarget(text string) string {
	words := strings.Fields(text)
	skipWords := map[string]bool{
		"deployment": true,
		"pod":        true,
		"container":  true,
		"the":        true,
	}
	triggers := []string{"restart", "scale", "logs", "stop", "start"}
	for i, word := range words {
		for _, t := range triggers {
			if word == t {
				// Skip trigger word and any skip words after it
				for j := i + 1; j < len(words); j++ {
					if !skipWords[words[j]] {
						return words[j]
					}
				}
			}
		}
	}
	return ""
}

func extractReplicas(text string) int32 {
	words := strings.Fields(text)
	for _, word := range words {
		var n int32
		if _, err := fmt.Sscanf(word, "%d", &n); err == nil && n > 0 {
			return n
		}
	}
	return 0
}
