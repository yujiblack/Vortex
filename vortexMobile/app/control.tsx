import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  sendK8sCommand,
  sendDockerCommand,
  sendGrafanaCommand,
} from "@/services/api";
import { NotionCard } from "./components/NotionCard";
import { ResultBlock } from "./components/ResultBox";
import { theme } from "./components/theme";

type Mode = "k8s" | "docker" | "grafana";

const PRESETS: Record<
  Mode,
  { label: string; cmd: string; locale: string; icon: string }[]
> = {
  k8s: [
    { label: "All pods", cmd: "list all pods", locale: "en", icon: "📋" },
    {
      label: "Crashing pods",
      cmd: "show crashing pods",
      locale: "en",
      icon: "🚨",
    },
    {
      label: "Deployments",
      cmd: "show all deployments",
      locale: "en",
      icon: "🚀",
    },
    {
      label: "Scale ×3",
      cmd: "scale voxdeploy-test 3",
      locale: "en",
      icon: "⬆",
    },
    {
      label: "Scale ×1",
      cmd: "scale voxdeploy-test 1",
      locale: "en",
      icon: "⬇",
    },
    {
      label: "Restart",
      cmd: "restart voxdeploy-test",
      locale: "en",
      icon: "↺",
    },
    { label: "सभी pods", cmd: "सभी pods दिखाओ", locale: "hi", icon: "🇮🇳" },
  ],
  docker: [
    {
      label: "All containers",
      cmd: "show all containers",
      locale: "en",
      icon: "📦",
    },
    {
      label: "सभी containers",
      cmd: "सभी containers दिखाओ",
      locale: "hi",
      icon: "🇮🇳",
    },
  ],
  grafana: [
    { label: "Summary", cmd: "give me a summary", locale: "en", icon: "◎" },
    {
      label: "Success rate",
      cmd: "what is the success rate",
      locale: "en",
      icon: "%",
    },
    {
      label: "AI speed",
      cmd: "AI की speed कितनी है",
      locale: "hi",
      icon: "⚡",
    },
    { label: "Latency", cmd: "what is the latency", locale: "en", icon: "⏱" },
  ],
};

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: "k8s", label: "Kubernetes", icon: "⚙️" },
  { id: "docker", label: "Docker", icon: "🐳" },
  { id: "grafana", label: "Metrics", icon: "📊" },
];

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "HI" },
  { code: "es", label: "ES" },
  { code: "ja", label: "JA" },
];

export default function Control() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("k8s");
  const [text, setText] = useState("");
  const [locale, setLocale] = useState("en");
  const [result, setResult] = useState("");
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState("");

  const run = async (cmd: string, loc: string) => {
    if (!cmd.trim()) return;
    setLoading(true);
    setActivePreset(cmd);
    setResult("");
    setError("");
    setTranslated("");
    try {
      let res: any;
      if (mode === "k8s") res = await sendK8sCommand(cmd, loc);
      else if (mode === "docker") res = await sendDockerCommand(cmd, loc);
      else res = await sendGrafanaCommand(cmd, loc);
      setResult(res.result);
      setTranslated(res.translated);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
    setActivePreset("");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Control</Text>
      <Text style={styles.pageSubtitle}>Send commands in any language</Text>
      <View style={styles.divider} />

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeTab, mode === m.id && styles.modeTabActive]}
            onPress={() => {
              setMode(m.id);
              setResult("");
              setError("");
            }}
          >
            <Text style={styles.modeIcon}>{m.icon}</Text>
            <Text
              style={[
                styles.modeLabel,
                mode === m.id && styles.modeLabelActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input card */}
      <NotionCard style={styles.inputCard}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a command..."
            placeholderTextColor={theme.text.placeholder}
            multiline
          />
          <TouchableOpacity
            style={[styles.runBtn, loading && styles.runBtnDisabled]}
            onPress={() => run(text, locale)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.runBtnText}>Run</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Locale row */}
        <View style={styles.localeRow}>
          <Text style={styles.localeLabel}>Language</Text>
          <View style={styles.localeChips}>
            {LOCALES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.localeChip,
                  locale === l.code && styles.localeChipActive,
                ]}
                onPress={() => setLocale(l.code)}
              >
                <Text
                  style={[
                    styles.localeChipText,
                    locale === l.code && styles.localeChipTextActive,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </NotionCard>

      {/* Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quick commands</Text>
        <View style={styles.presetList}>
          {PRESETS[mode].map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.presetItem,
                i < PRESETS[mode].length - 1 && styles.presetItemBorder,
                activePreset === p.cmd && loading && styles.presetItemActive,
              ]}
              onPress={() => {
                setText(p.cmd);
                setLocale(p.locale);
                run(p.cmd, p.locale);
              }}
              disabled={loading}
            >
              <Text style={styles.presetIcon}>{p.icon}</Text>
              <Text style={styles.presetLabel}>{p.label}</Text>
              <Text style={styles.presetArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ResultBlock translated={translated} result={result} error={error} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg.primary },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text.primary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.text.muted,
    marginTop: 2,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border.default,
    marginBottom: 20,
  },
  modeRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.bg.card,
  },
  modeTabActive: { backgroundColor: theme.text.primary },
  modeIcon: { fontSize: 14 },
  modeLabel: {
    color: theme.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
  modeLabelActive: { color: "#ffffff" },
  inputCard: { marginBottom: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  input: {
    flex: 1,
    color: theme.text.primary,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "top",
  },
  runBtn: {
    backgroundColor: theme.text.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  localeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border.default,
  },
  localeLabel: { color: theme.text.muted, fontSize: 12 },
  localeChips: { flexDirection: "row", gap: 6 },
  localeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  localeChipActive: {
    backgroundColor: theme.text.primary,
    borderColor: theme.text.primary,
  },
  localeChipText: {
    color: theme.text.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
  localeChipTextActive: { color: "#ffffff" },
  section: { marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetList: {
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.bg.card,
  },
  presetItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  presetItemActive: { backgroundColor: theme.bg.secondary },
  presetIcon: { fontSize: 14, width: 20, textAlign: "center" },
  presetLabel: { color: theme.text.primary, fontSize: 13, flex: 1 },
  presetArrow: { color: theme.text.muted, fontSize: 13 },
});
