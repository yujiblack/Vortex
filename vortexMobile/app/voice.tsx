import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVoiceCommand, VoiceMode } from "../hooks/Usevoicecommand";
import { NotionCard } from "./components/NotionCard";
import { ResultBlock } from "./components/ResultBox";
import { theme } from "./components/theme";

const MODES: { id: VoiceMode; label: string; icon: string }[] = [
  { id: "k8s", label: "Kubernetes", icon: "⚙️" },
  { id: "docker", label: "Docker", icon: "🐳" },
  { id: "grafana", label: "Metrics", icon: "📊" },
];

const LOCALES: { code: string; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "hi", flag: "🇮🇳", label: "HI" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "ja", flag: "🇯🇵", label: "JA" },
  { code: "zh", flag: "🇨🇳", label: "ZH" },
  { code: "de", flag: "🇩🇪", label: "DE" },
];

const EXAMPLES: Record<
  VoiceMode,
  { text: string; locale: string; flag: string }[]
> = {
  k8s: [
    // English
    { text: "Show all pods", locale: "en", flag: "🇬🇧" },
    { text: "Show crashing pods", locale: "en", flag: "🇬🇧" },
    { text: "Show all deployments", locale: "en", flag: "🇬🇧" },
    { text: "Scale voxdeploy-test to 3", locale: "en", flag: "🇬🇧" },
    { text: "Scale voxdeploy-test to 1", locale: "en", flag: "🇬🇧" },
    { text: "Restart voxdeploy-test", locale: "en", flag: "🇬🇧" },
    // Hindi
    { text: "सभी pods दिखाओ", locale: "hi", flag: "🇮🇳" },
    { text: "सभी deployments दिखाओ", locale: "hi", flag: "🇮🇳" },
    { text: "crashing pods दिखाओ", locale: "hi", flag: "🇮🇳" },
    {
      text: "voxdeploy-test को 3 replicas पर scale करो",
      locale: "hi",
      flag: "🇮🇳",
    },
    { text: "voxdeploy-test restart करो", locale: "hi", flag: "🇮🇳" },
    // Spanish
    { text: "Mostrar todos los pods", locale: "es", flag: "🇪🇸" },
    { text: "Mostrar todos los deployments", locale: "es", flag: "🇪🇸" },
    { text: "Escalar voxdeploy-test a 3", locale: "es", flag: "🇪🇸" },
    { text: "Reiniciar voxdeploy-test", locale: "es", flag: "🇪🇸" },
    // Japanese
    { text: "すべてのpodを表示", locale: "ja", flag: "🇯🇵" },
    { text: "すべてのdeploymentを表示", locale: "ja", flag: "🇯🇵" },
    { text: "voxdeploy-testを3にスケール", locale: "ja", flag: "🇯🇵" },
    { text: "voxdeploy-testを再起動", locale: "ja", flag: "🇯🇵" },
  ],
  docker: [
    // English
    { text: "Show all containers", locale: "en", flag: "🇬🇧" },
    { text: "Show running containers", locale: "en", flag: "🇬🇧" },
    // Hindi
    { text: "सभी containers दिखाओ", locale: "hi", flag: "🇮🇳" },
    { text: "running containers दिखाओ", locale: "hi", flag: "🇮🇳" },
    // Spanish
    { text: "Mostrar todos los contenedores", locale: "es", flag: "🇪🇸" },
    { text: "Mostrar contenedores activos", locale: "es", flag: "🇪🇸" },
    // Japanese
    { text: "すべてのコンテナを表示", locale: "ja", flag: "🇯🇵" },
    { text: "実行中のコンテナを表示", locale: "ja", flag: "🇯🇵" },
  ],
  grafana: [
    // English
    { text: "Give me a summary", locale: "en", flag: "🇬🇧" },
    { text: "What is the success rate", locale: "en", flag: "🇬🇧" },
    { text: "Show errors and failures", locale: "en", flag: "🇬🇧" },
    { text: "How many PRs were opened", locale: "en", flag: "🇬🇧" },
    // Hindi
    { text: "AI की speed कितनी है", locale: "hi", flag: "🇮🇳" },
    { text: "कितने webhooks मिले", locale: "hi", flag: "🇮🇳" },
    { text: "success rate क्या है", locale: "hi", flag: "🇮🇳" },
    { text: "कितने PRs खुले", locale: "hi", flag: "🇮🇳" },
    // Spanish
    { text: "Dame un resumen", locale: "es", flag: "🇪🇸" },
    { text: "¿Cuál es la tasa de éxito?", locale: "es", flag: "🇪🇸" },
    { text: "¿Cuántos PRs se abrieron?", locale: "es", flag: "🇪🇸" },
    // Japanese
    { text: "サマリーを教えて", locale: "ja", flag: "🇯🇵" },
    { text: "成功率はどのくらいですか", locale: "ja", flag: "🇯🇵" },
    { text: "AIの速度はどのくらいですか", locale: "ja", flag: "🇯🇵" },
  ],
};

const LANG_FILTERS = [
  { code: "all", label: "All" },
  { code: "en", label: "🇬🇧 EN" },
  { code: "hi", label: "🇮🇳 HI" },
  { code: "es", label: "🇪🇸 ES" },
  { code: "ja", label: "🇯🇵 JA" },
];

const STATE_LABELS: Record<string, string> = {
  idle: "Hold to speak",
  recording: "Listening...",
  transcribing: "Transcribing via Whisper...",
  translating: "Translating via Lingo...",
  executing: "Executing...",
  done: "Done",
  error: "Error — try again",
};

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<VoiceMode>("k8s");
  const [locale, setLocale] = useState("en");
  const [text, setText] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const {
    state,
    voiceResult,
    execute,
    reset,
    startRecording,
    stopAndProcess,
    isRecordingRef,
    isRecording,
    isProcessing,
  } = useVoiceCommand(mode, locale);

  // Animate button scale on press in/out
  const animateIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };
  const animateOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressIn = () => {
    if (isProcessing) return;
    animateIn();
    startRecording();
  };

  const handlePressOut = () => {
    animateOut();
    // Use the ref directly — never stale, unlike state inside a closure
    if (isRecordingRef.current) {
      stopAndProcess();
    }
  };

  const handleTypedSend = () => {
    if (!text.trim() || isProcessing) return;
    execute(text);
  };

  const handleExample = (ex: { text: string; locale: string }) => {
    setText(ex.text);
    setLocale(ex.locale);
    execute(ex.text);
  };

  const handleReset = () => {
    reset();
    setText("");
  };

  const showResult =
    voiceResult.result || voiceResult.error || voiceResult.transcript;

  // Button appearance based on state
  const micBg = isRecording
    ? "#e03e3e" // red while recording
    : isProcessing
      ? theme.bg.secondary // grey while processing
      : theme.text.primary; // black idle

  const micBorderColor = isProcessing ? theme.border.strong : "transparent";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      <Text style={styles.pageTitle}>Voice</Text>
      <Text style={styles.pageSubtitle}>
        Hold the button and speak in any language
      </Text>
      <View style={styles.divider} />

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.modeTab, mode === m.id && styles.modeTabActive]}
            onPress={() => {
              setMode(m.id);
              reset();
              setText("");
            }}
            disabled={isProcessing || isRecording}
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
          </Pressable>
        ))}
      </View>

      {/* Hold-to-record button */}
      <View style={styles.micZone}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isProcessing}
            style={[
              styles.micButton,
              {
                backgroundColor: micBg,
                borderWidth: isProcessing ? 1.5 : 0,
                borderColor: micBorderColor,
              },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.text.primary} size="large" />
            ) : (
              <Text
                style={[styles.micIcon, isRecording && styles.micIconRecording]}
              >
                {isRecording ? "■" : "◎"}
              </Text>
            )}
          </Pressable>
        </Animated.View>

        <Text
          style={[
            styles.stateLabel,
            isRecording && { color: "#e03e3e", fontWeight: "600" },
            state === "error" && { color: theme.accent.red },
            state === "done" && { color: theme.accent.green },
          ]}
        >
          {STATE_LABELS[state] ?? "Hold to speak"}
        </Text>

        {/* Live transcript preview */}
        {voiceResult.transcript ? (
          <NotionCard style={styles.transcriptCard} padded>
            <Text style={styles.transcriptLabel}>Heard</Text>
            <Text style={styles.transcriptText}>{voiceResult.transcript}</Text>
          </NotionCard>
        ) : null}
      </View>

      {/* Locale selector */}
      <View style={styles.localeRow}>
        <Text style={styles.localeLabel}>Language</Text>
        <View style={styles.localeChips}>
          {LOCALES.map((l) => (
            <Pressable
              key={l.code}
              style={[
                styles.localeChip,
                locale === l.code && styles.localeChipActive,
              ]}
              onPress={() => setLocale(l.code)}
              disabled={isProcessing || isRecording}
            >
              <Text style={styles.localeFlag}>{l.flag}</Text>
              <Text
                style={[
                  styles.localeCode,
                  locale === l.code && styles.localeCodeActive,
                ]}
              >
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Type fallback */}
      <NotionCard style={styles.inputCard}>
        <Text style={styles.inputLabel}>Or type a command</Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type in any language..."
            placeholderTextColor={theme.text.placeholder}
            editable={!isProcessing && !isRecording}
            returnKeyType="send"
            onSubmitEditing={handleTypedSend}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || isProcessing) && styles.sendBtnDisabled,
            ]}
            onPress={handleTypedSend}
            disabled={!text.trim() || isProcessing}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </Pressable>
        </View>
      </NotionCard>

      {/* Result */}
      {showResult ? (
        <>
          <ResultBlock
            translated={voiceResult.translated}
            result={voiceResult.result}
            error={voiceResult.error}
          />
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Clear and start over</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Example phrases</Text>

          {/* Language filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterContent}
          >
            {LANG_FILTERS.map((f) => (
              <Pressable
                key={f.code}
                style={[
                  styles.filterChip,
                  langFilter === f.code && styles.filterChipActive,
                ]}
                onPress={() => setLangFilter(f.code)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    langFilter === f.code && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <NotionCard padded={false}>
            {EXAMPLES[mode]
              .filter((ex) => langFilter === "all" || ex.locale === langFilter)
              .map((ex, i, arr) => (
                <Pressable
                  key={i}
                  style={[
                    styles.exampleRow,
                    i < arr.length - 1 && styles.exampleRowBorder,
                  ]}
                  onPress={() => handleExample(ex)}
                  disabled={isProcessing || isRecording}
                >
                  <Text style={styles.exampleFlag}>{ex.flag}</Text>
                  <Text style={styles.exampleText}>{ex.text}</Text>
                  <Text style={styles.exampleLocale}>
                    {ex.locale.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
          </NotionCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg.primary },
  content: { padding: 20, paddingBottom: 48 },
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
    marginBottom: 32,
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
  modeLabel: { color: theme.text.secondary, fontSize: 12, fontWeight: "500" },
  modeLabelActive: { color: "#ffffff" },

  micZone: { alignItems: "center", gap: 16, marginBottom: 24 },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  micIcon: { fontSize: 38, color: "#ffffff", lineHeight: 48 },
  micIconRecording: { fontSize: 32 },
  stateLabel: { fontSize: 13, color: theme.text.muted, letterSpacing: 0.1 },

  transcriptCard: { width: "100%", borderColor: theme.border.strong },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transcriptText: {
    color: theme.text.primary,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },

  localeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  localeLabel: { color: theme.text.muted, fontSize: 12 },
  localeChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  localeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  localeChipActive: {
    backgroundColor: theme.text.primary,
    borderColor: theme.text.primary,
  },
  localeFlag: { fontSize: 12 },
  localeCode: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.text.muted,
    letterSpacing: 0.5,
  },
  localeCodeActive: { color: "#ffffff" },

  inputCard: { marginBottom: 16 },
  inputLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, color: theme.text.primary, fontSize: 14, minHeight: 36 },
  sendBtn: {
    backgroundColor: theme.text.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendBtnDisabled: { backgroundColor: theme.text.muted },
  sendBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },

  section: { marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exampleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  exampleFlag: { fontSize: 14, marginRight: 8 },
  exampleText: { color: theme.text.primary, fontSize: 13, flex: 1 },
  exampleLocale: {
    color: theme.text.muted,
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  filterRow: { marginBottom: 10 },
  filterContent: { gap: 6, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.border.default,
    backgroundColor: theme.bg.card,
  },
  filterChipActive: {
    backgroundColor: theme.text.primary,
    borderColor: theme.text.primary,
  },
  filterChipText: {
    color: theme.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
  filterChipTextActive: { color: "#ffffff" },
  resetBtn: { marginTop: 20, alignItems: "center", paddingVertical: 8 },
  resetText: {
    color: theme.text.muted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
