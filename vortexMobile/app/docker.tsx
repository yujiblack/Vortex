import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { sendDockerCommand } from "@/services/api";
import { GlassCard } from "./components/GlassCard";
import { CommandButton } from "./components/CommandButton";
import { ResultDisplay } from "./components/ResultDisplay";
import { WaveformBar } from "./components/WaveformBar";
import { theme } from "./components/theme";

const COMMANDS = [
  {
    label: "All Containers",
    sublabel: "List every container",
    icon: "📦",
    cmd: "show all containers",
    locale: "en",
  },
  {
    label: "Running Only",
    sublabel: "Active containers",
    icon: "▶️",
    cmd: "show running containers",
    locale: "en",
  },
  {
    label: "सभी containers",
    sublabel: "Hindi command",
    icon: "🇮🇳",
    cmd: "सभी containers दिखाओ",
    locale: "hi",
  },
];

export default function DockerScreen() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (cmd: string, locale: string) => {
    setLoading(true);
    setResult("");
    setError("");
    setTranslated("");
    try {
      const res = await sendDockerCommand(cmd, locale);
      setResult(res.result);
      setTranslated(res.translated);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Docker</Text>
      <Text style={styles.subtitle}>Container management</Text>

      {loading && (
        <GlassCard glow style={styles.loadingCard}>
          <WaveformBar active color={theme.accent.cyan} height={24} />
          <Text style={styles.loadingText}>Querying Docker...</Text>
        </GlassCard>
      )}

      <Text style={styles.sectionLabel}>COMMANDS</Text>
      <View style={styles.cmdList}>
        {COMMANDS.map((c, i) => (
          <CommandButton
            key={i}
            label={c.label}
            sublabel={c.sublabel}
            icon={c.icon}
            onPress={() => run(c.cmd, c.locale)}
            disabled={loading}
          />
        ))}
      </View>

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
  },
  cmdList: { gap: 8, marginBottom: 16 },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
  },
  loadingText: { color: theme.text.secondary, fontSize: 12 },
});
