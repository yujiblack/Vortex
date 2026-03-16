package k8s

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type DeploymentInfo struct {
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	ReadyReplicas   int32  `json:"ready_replicas"`
	DesiredReplicas int32  `json:"desired_replicas"`
}

// GetDeployments fetches all deployments. If namespace is empty, it searches common ones or all.
func (c *Client) GetDeployments(ctx context.Context, namespace string) ([]DeploymentInfo, error) {
	if namespace == "" {
		namespace = metav1.NamespaceAll
	}

	deployments, err := c.kube.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments: %w", err)
	}

	var info []DeploymentInfo
	for _, d := range deployments.Items {
		info = append(info, DeploymentInfo{
			Name:            d.Name,
			Namespace:       d.Namespace,
			ReadyReplicas:   d.Status.ReadyReplicas,
			DesiredReplicas: *d.Spec.Replicas,
		})
	}
	return info, nil
}

// ScaleDeployment explicitly scales a named deployment
func (c *Client) ScaleDeployment(ctx context.Context, namespace, name string, replicas int32) error {
	if namespace == "" {
		ns, err := c.findDeploymentNamespace(ctx, name)
		if err != nil {
			return err
		}
		namespace = ns
	}

	scale, err := c.kube.AppsV1().Deployments(namespace).GetScale(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get scale: %w", err)
	}

	scale.Spec.Replicas = replicas
	_, err = c.kube.AppsV1().Deployments(namespace).UpdateScale(ctx, name, scale, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update scale: %w", err)
	}

	return nil
}

// RestartDeployment explicitly restarts a named deployment
func (c *Client) RestartDeployment(ctx context.Context, namespace, name string) error {
	if namespace == "" {
		ns, err := c.findDeploymentNamespace(ctx, name)
		if err != nil {
			return err
		}
		namespace = ns
	}

	d, err := c.kube.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	if d.Spec.Template.Annotations == nil {
		d.Spec.Template.Annotations = make(map[string]string)
	}
	d.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = metav1.Now().String()

	_, err = c.kube.AppsV1().Deployments(namespace).Update(ctx, d, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to restart deployment: %w", err)
	}

	return nil
}
