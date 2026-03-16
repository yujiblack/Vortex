import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  sendK8sCommand,
  sendDockerCommand,
  sendGrafanaCommand,
} from "@/services/api";
import { GlassCard } from "./components/GlassCard";
import { WaveformBar } from "./components/WaveformBar";
import { ResultDisplay } from "./components/ResultDisplay";
import { theme } from "./components/theme";

type Mode = "k8s" | "docker" | "grafana";

const EXAMPLES: Record<Mode, { text: string; locale: string }[]> = {
  k8s: [
    { text: "सभी pods दिखाओ", locale: "hi" },
    { text: "show crashing pods", locale: "en" },
    { text: "scale deployment voxdeploy to 3", locale: "en" },
    { text: "restart deployment voxdeploy", locale: "en" },
  ],
  docker: [
    { text: "सभी containers दिखाओ", locale: "hi" },
    { text: "show all containers", locale: "en" },
  ],
  grafana: [
    { text: "give me a summary", locale: "en" },
    { text: "what is the success rate", locale: "en" },
    { text: "AI की speed कितनी है", locale: "hi" },
  ],
};

export default function VoiceScreen() {
  const [text, setText] = useState("");
  const [locale, setLocale] = useState("hi");
  const [mode, setMode] = useState<Mode>("k8s");
  const [result, setResult] = useState("");
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (t?: string, l?: string) => {
    const cmd = t || text;
    const loc = l || locale;
    if (!cmd.trim()) return;
    setLoading(true);
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
  };

  const modes: { id: Mode; icon: string; label: string }[] = [
    { id: "k8s", icon: "⚙️", label: "K8s" },
    { id: "docker", icon: "🐳", label: "Docker" },
    { id: "grafana", icon: "📊", label: "Grafana" },
  ];

  const locales = [
    { code: "hi", flag: "🇮🇳" },
    { code: "en", flag: "🇬🇧" },
    { code: "es", flag: "🇪🇸" },
    { code: "ja", flag: "🇯🇵" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text style={styles.title}>Voice Control</Text>
      <Text style={styles.subtitle}>Speak in any language</Text>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {modes.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeBtn, mode === m.id && styles.modeBtnActive]}
            onPress={() => setMode(m.id)}
          >
            <Text style={styles.modeIcon}>{m.icon}</Text>
            <Text
              style={[
                styles.modeLabel,
                mode === m.id && { color: theme.accent.cyan },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Locale selector */}
      <View style={styles.localeRow}>
        {locales.map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[
              styles.localeBtn,
              locale === l.code && styles.localeBtnActive,
            ]}
            onPress={() => setLocale(l.code)}
          >
            <Text style={styles.localeFlag}>{l.flag}</Text>
            <Text
              style={[
                styles.localeCode,
                locale === l.code && { color: theme.accent.cyan },
              ]}
            >
              {l.code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input + waveform */}
      <GlassCard glow={loading} style={styles.inputCard}>
        <WaveformBar active={loading} color={theme.accent.blue} height={30} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type or tap an example below..."
          placeholderTextColor={theme.text.muted}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnLoading]}
          onPress={() => send()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.bg.primary} size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send →</Text>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Examples */}
      <Text style={styles.examplesLabel}>EXAMPLES</Text>
      <View style={styles.examplesGrid}>
        {EXAMPLES[mode].map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={styles.exampleChip}
            onPress={() => {
              setText(ex.text);
              setLocale(ex.locale);
              send(ex.text, ex.locale);
            }}
          >
            <Text style={styles.exampleText}>{ex.text}</Text>
            <Text style={styles.exampleLocale}>{ex.locale.toUpperCase()}</Text>
          </TouchableOpacity>
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
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  modeBtnActive: {
    borderColor: theme.accent.cyan,
    backgroundColor: "rgba(0,212,255,0.05)",
  },
  modeIcon: { fontSize: 22, marginBottom: 4 },
  modeLabel: { color: theme.text.secondary, fontSize: 11, fontWeight: "600" },
  localeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  localeBtn: {
    flex: 1,
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.sm,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  localeBtnActive: { borderColor: theme.accent.blue },
  localeFlag: { fontSize: 18, marginBottom: 2 },
  localeCode: { color: theme.text.muted, fontSize: 9, letterSpacing: 1 },
  inputCard: { marginBottom: 16, gap: 10 },
  input: {
    color: theme.text.primary,
    fontSize: 15,
    minHeight: 50,
    textAlignVertical: "top",
    borderTopWidth: 1,
    borderTopColor: theme.border.subtle,
    paddingTop: 10,
  },
  sendBtn: {
    backgroundColor: theme.accent.blue,
    borderRadius: theme.radius.sm,
    padding: 12,
    alignItems: "center",
  },
  sendBtnLoading: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  examplesLabel: {
    color: theme.text.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
  },
  examplesGrid: { gap: 8, marginBottom: 4 },
  exampleChip: {
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border.subtle,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exampleText: { color: theme.text.secondary, fontSize: 13, flex: 1 },
  exampleLocale: { color: theme.text.muted, fontSize: 9, letterSpacing: 1 },
});
