import axios from "axios";

const BASE_URL = "https://isochromatic-monodomous-floyd.ngrok-free.dev";
const DEFAULT_REPO = "yujiblack/Vortex-Test";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const registerRepo = async (config: {
  repo: string;
  github_token: string;
  webhook_secret: string;
  kubeconfig_b64?: string;
  grafana_url?: string;
}) => {
  const res = await api.post("/repos/register", config);
  return res.data;
};

export const listRepos = async () => {
  const res = await api.get("/repos");
  return res.data;
};

export const getGrafanaStats = async (repo = DEFAULT_REPO) => {
  const res = await api.get(`/grafana/stats?repo=${repo}`);
  return res.data;
};

export const sendDockerCommand = async (
  text: string,
  locale: string,
  repo = DEFAULT_REPO,
) => {
  const res = await api.post(`/docker/command?repo=${repo}`, { text, locale });
  return res.data;
};

export const sendGrafanaCommand = async (
  text: string,
  locale: string,
  repo = DEFAULT_REPO,
) => {
  const res = await api.post(`/grafana/command?repo=${repo}`, { text, locale });
  return res.data;
};

export const sendK8sCommand = async (
  text: string,
  locale: string,
  repo = DEFAULT_REPO,
) => {
  const res = await api.post(`/k8s/command?repo=${repo}`, { text, locale });
  return res.data;
};

export const checkHealth = async () => {
  const res = await api.get("/health");
  return res.data;
};

/**
 * Step 1 of the voice pipeline:
 * Sends base64 audio → Groq Whisper → raw transcript + detected language.
 *
 * Step 2 happens automatically inside sendK8sCommand / sendDockerCommand /
 * sendGrafanaCommand — they each call Lingo to translate the transcript
 * from detectedLocale → English before executing the command.
 */
export const transcribeAudio = async (
  audioBase64: string,
  locale: string,
  repo = DEFAULT_REPO,
): Promise<{ transcript: string; detectedLocale: string }> => {
  const res = await api.post(`/voice/transcribe?repo=${repo}`, {
    audio: audioBase64,
    locale,
  });
  return {
    transcript: res.data.transcript as string,
    detectedLocale: res.data.locale as string,
  };
};
