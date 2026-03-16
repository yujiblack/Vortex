import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { sendK8sCommand } from "@/services/api";
import { GlassCard } from "./components/GlassCard";
import { CommandButton } from "./components/CommandButton";
import { ResultDisplay } from "./components/ResultDisplay";
import { WaveformBar } from "./components/WaveformBar";
import { theme } from "./components/theme";

const COMMANDS = [
  {
    label: "All Pods",
    sublabel: "List across all namespaces",
    icon: "📋",
    cmd: "show all pods",
    locale: "en",
  },
  {
    label: "Crashing Pods",
    sublabel: "Find failing containers",
    icon: "🚨",
    cmd: "show crashing pods",
    locale: "en",
  },
  {
    label: "Deployments",
    sublabel: "View all deployments",
    icon: "🚀",
    cmd: "show all deployments",
    locale: "en",
  },
  {
    label: "Scale Up ×3",
    sublabel: "scale deployment voxdeploy to 3",
    icon: "⬆️",
    cmd: "scale deployment voxdeploy to 3",
    locale: "en",
  },
  {
    label: "Scale Down ×1",
    sublabel: "scale deployment voxdeploy to 1",
    icon: "⬇️",
    cmd: "scale deployment voxdeploy to 1",
    locale: "en",
  },
  {
    label: "Restart",
    sublabel: "Rolling restart deployment",
    icon: "🔄",
    cmd: "restart deployment voxdeploy",
    locale: "en",
  },
];

const HINDI_COMMANDS = [
  { label: "सभी pods दिखाओ", cmd: "सभी pods दिखाओ", locale: "hi" },
  { label: "crashing pods दिखाओ", cmd: "show crashing pods", locale: "hi" },
  {
    label: "voxdeploy restart करो",
    cmd: "restart deployment voxdeploy",
    locale: "hi",
  },
];

export default function KubernetesScreen() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCmd, setActiveCmd] = useState("");

  const run = async (cmd: string, locale: string) => {
    setLoading(true);
    setActiveCmd(cmd);
    setResult("");
    setError("");
    setTranslated("");
    try {
      const res = await sendK8sCommand(cmd, locale);
      setResult(res.result);
      setTranslated(res.translated);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Kubernetes</Text>
      <Text style={styles.subtitle}>Cluster control in any language</Text>

      {loading && (
        <GlassCard glow style={styles.loadingCard}>
          <WaveformBar active color={theme.accent.blue} height={24} />
          <Text style={styles.loadingText}>Executing command...</Text>
        </GlassCard>
      )}

      <Text style={styles.sectionLabel}>QUICK COMMANDS</Text>
      <View style={styles.grid}>
        {COMMANDS.map((c, i) => (
          <CommandButton
            key={i}
            label={c.label}
            sublabel={c.sublabel}
            icon={c.icon}
            active={activeCmd === c.cmd && loading}
            onPress={() => run(c.cmd, c.locale)}
            disabled={loading}
            style={styles.gridBtn}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>हिंदी COMMANDS 🇮🇳</Text>
      <GlassCard style={styles.hindiCard}>
        {HINDI_COMMANDS.map((c, i) => (
          <CommandButton
            key={i}
            label={c.label}
            icon="🎙️"
            variant="primary"
            onPress={() => run(c.cmd, c.locale)}
            disabled={loading}
            style={i < HINDI_COMMANDS.length - 1 ? styles.hindiBtn : undefined}
          />
        ))}
      </GlassCard>

      <ResultDisplay translated={translated} result={result} error={error} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg.primary },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    color: theme.text.primary,
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  subtitle: { color: theme.text.muted, fontSize: 13, marginBottom: 20 },
  sectionLabel: {
    color: theme.text.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  grid: { gap: 8, marginBottom: 20 },
  gridBtn: {},
  hindiCard: { gap: 6, marginBottom: 16 },
  hindiBtn: { marginBottom: 6 },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
  },
  loadingText: { color: theme.text.secondary, fontSize: 12 },
});
