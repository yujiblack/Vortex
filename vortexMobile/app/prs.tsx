import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGrafanaStats, sendGrafanaCommand } from "@/services/api";
import { NotionCard } from "./components/NotionCard";
import { PropertyRow } from "./components/PropertyRow";
import { CalloutBlock } from "./components/CalloutBlock";
import { theme } from "./components/theme";

const PIPELINE_STEPS = [
  {
    num: "1",
    label: "CI Fails",
    desc: "GitHub Actions detects a broken build",
  },
  {
    num: "2",
    label: "Webhook caught",
    desc: "VoxDeploy receives the failure event",
  },
  {
    num: "3",
    label: "AI analyzes",
    desc: "Gemini reads logs and locates the bug",
  },
  {
    num: "4",
    label: "Fix generated",
    desc: "Precise git diff at temperature 0.0",
  },
  { num: "5", label: "PR opened", desc: "Branch created, PR auto-submitted" },
  { num: "6", label: "You approve", desc: "One-click merge. Zero debugging." },
];

export default function PRsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, cmd] = await Promise.all([
        getGrafanaStats(),
        sendGrafanaCommand("give me a summary", "en"),
      ]);
      setStats(s);
      setSummary(cmd.result);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.text.muted}
        />
      }
    >
      <Text style={styles.pageTitle}>PRs</Text>
      <Text style={styles.pageSubtitle}>Auto-generated fixes</Text>
      <View style={styles.divider} />

      {summary ? <CalloutBlock emoji="🤖" text={summary} /> : null}

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Stats</Text>
          <NotionCard padded={false}>
            <PropertyRow
              label="CI failures caught"
              value={stats.webhooks_total}
              icon="⚡"
            />
            <PropertyRow label="PRs opened" value={stats.prs_opened} icon="↑" />
            <PropertyRow
              label="Success rate"
              value={`${stats.success_rate?.toFixed(1)}%`}
              icon="◎"
              valueColor={
                stats.success_rate > 70
                  ? theme.accent.green
                  : theme.accent.yellow
              }
            />
            <PropertyRow
              label="Fixes generated"
              value={stats.fixes_generated}
              icon="⌘"
            />
          </NotionCard>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.githubLink}
          onPress={() =>
            Linking.openURL("https://github.com/yujiblack/Vortex-Test/pulls")
          }
        >
          <Text style={styles.githubLinkIcon}>↗</Text>
          <Text style={styles.githubLinkText}>View open PRs on GitHub</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How it works</Text>
        <NotionCard padded={false}>
          {PIPELINE_STEPS.map((s, i) => (
            <View
              key={i}
              style={[
                styles.stepRow,
                i < PIPELINE_STEPS.length - 1 && styles.stepRowBorder,
              ]}
            >
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
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
  githubLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: theme.radius.md,
  },
  githubLinkIcon: {
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: "600",
  },
  githubLinkText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.bg.secondary,
    borderWidth: 1,
    borderColor: theme.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: theme.text.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  stepContent: { flex: 1, paddingTop: 1 },
  stepLabel: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepDesc: { color: theme.text.muted, fontSize: 12, lineHeight: 18 },
});
