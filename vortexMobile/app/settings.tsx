import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { registerRepo } from "@/services/api";
import { NotionCard } from "./components/NotionCard";
import { CalloutBlock } from "./components/CalloutBlock";
import { theme } from "./components/theme";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [repo, setRepo] = useState("yujiblack/Vortex-Test");
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [kubeconfig, setKubeconfig] = useState("");
  const [grafanaUrl, setGrafanaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const register = async () => {
    if (!repo || !token || !secret) {
      Alert.alert(
        "Missing fields",
        "Repo, token and webhook secret are required.",
      );
      return;
    }
    setLoading(true);
    try {
      await registerRepo({
        repo,
        github_token: token,
        webhook_secret: secret,
        kubeconfig_b64: kubeconfig,
        grafana_url: grafanaUrl,
      });
      setRegistered(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Settings</Text>
      <Text style={styles.pageSubtitle}>
        Register and configure repositories
      </Text>
      <View style={styles.divider} />

      {registered && (
        <CalloutBlock
          emoji="✅"
          text={`${repo} registered successfully.`}
          color={theme.accent.green}
          bgColor="#f0faf5"
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Repository config</Text>
        <NotionCard padded={false}>
          {[
            {
              label: "Repository",
              value: repo,
              setter: setRepo,
              placeholder: "owner/repo-name",
              secure: false,
            },
            {
              label: "GitHub Token",
              value: token,
              setter: setToken,
              placeholder: "github_pat_...",
              secure: true,
            },
            {
              label: "Webhook Secret",
              value: secret,
              setter: setSecret,
              placeholder: "your-webhook-secret",
              secure: true,
            },
            {
              label: "Kubeconfig (base64)",
              value: kubeconfig,
              setter: setKubeconfig,
              placeholder: "base64-encoded kubeconfig",
              secure: false,
            },
            {
              label: "Grafana URL",
              value: grafanaUrl,
              setter: setGrafanaUrl,
              placeholder: "http://localhost:9090",
              secure: false,
            },
          ].map((f, i, arr) => (
            <View
              key={f.label}
              style={[
                styles.fieldRow,
                i < arr.length - 1 && styles.fieldRowBorder,
              ]}
            >
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.fieldInput}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={theme.text.placeholder}
                secureTextEntry={f.secure}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </NotionCard>
      </View>

      <TouchableOpacity
        style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
        onPress={register}
        disabled={loading}
      >
        <Text style={styles.registerBtnText}>
          {loading ? "Registering..." : "Register repository"}
        </Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <NotionCard padded={false}>
          {[
            { label: "Version", value: "1.0.0" },
            { label: "AI model", value: "Gemini 2.5 Flash" },
            { label: "Translation", value: "Lingo" },
            { label: "Diff engine", value: "Fuzzy hunk matching" },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.aboutRow,
                i < arr.length - 1 && styles.aboutRowBorder,
              ]}
            >
              <Text style={styles.aboutLabel}>{row.label}</Text>
              <Text style={styles.aboutValue}>{row.value}</Text>
            </View>
          ))}
        </NotionCard>
      </View>
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
  section: { marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  fieldLabel: {
    color: theme.text.muted,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: { color: theme.text.primary, fontSize: 13 },
  registerBtn: {
    marginTop: 16,
    backgroundColor: theme.text.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerBtnDisabled: { opacity: 0.5 },
  registerBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  aboutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  aboutLabel: { color: theme.text.secondary, fontSize: 13 },
  aboutValue: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
});
