import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { getGrafanaStats, sendGrafanaCommand } from "@/services/api";
import { GlassCard } from "./components/GlassCard";
import { MetricCard } from "./components/MetricCard";
import { ProgressBar } from "./components/ProgressBar";
import { theme } from "./components/theme";

const HOW_IT_WORKS = [
  {
    step: "01",
    label: "CI Fails",
    desc: "GitHub Actions detects a broken build",
  },
  {
    step: "02",
    label: "Webhook Caught",
    desc: "VoxDeploy receives the failure instantly",
  },
  {
    step: "03",
    label: "AI Analyzes",
    desc: "Gemini reads error logs and locates the bug",
  },
  {
    step: "04",
    label: "Fix Generated",
    desc: "A precise git diff is created at 0.0 temperature",
  },
  {
    step: "05",
    label: "PR Opened",
    desc: "Branch created and PR auto-submitted",
  },
  {
    step: "06",
    label: "You Approve",
    desc: "One click merge. Zero debugging.",
  },
];

export default function PRsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
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
    fetch();
  }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent.cyan}
        />
      }
    >
      <Text style={styles.title}>PR History</Text>
      <Text style={styles.subtitle}>Auto-generated fixes</Text>

      {summary && (
        <GlassCard glow style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>AI SUMMARY</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </GlassCard>
      )}

      {stats && (
        <>
          <View style={styles.row}>
            <MetricCard
              title="CI Failures"
              value={stats.webhooks_total}
              icon="🚨"
              color={theme.accent.danger}
              style={styles.thirdCard}
            />
            <MetricCard
              title="PRs Opened"
              value={stats.prs_opened}
              icon="🎉"
              color={theme.accent.success}
              style={styles.thirdCard}
            />
            <MetricCard
              title="Success"
              value={`${stats.success_rate.toFixed(0)}%`}
              icon="📈"
              color={theme.accent.cyan}
              style={styles.thirdCard}
            />
          </View>

          <GlassCard style={styles.progressCard}>
            <Text style={styles.progressTitle}>Pipeline Health</Text>
            <ProgressBar
              label="Fix Success Rate"
              value={stats.success_rate}
              color={theme.accent.success}
            />
            <ProgressBar
              label="Fixes Generated"
              value={
                stats.webhooks_total > 0
                  ? (stats.fixes_generated / stats.webhooks_total) * 100
                  : 0
              }
              color={theme.accent.blue}
            />
          </GlassCard>
        </>
      )}

      <TouchableOpacity
        style={styles.githubBtn}
        onPress={() =>
          Linking.openURL("https://github.com/yujiblack/Vortex-Test/pulls")
        }
      >
        <Text style={styles.githubIcon}>🔗</Text>
        <Text style={styles.githubText}>View PRs on GitHub</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
      {HOW_IT_WORKS.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNum}>{s.step}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>{s.label}</Text>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
          {i < HOW_IT_WORKS.length - 1 && <View style={styles.stepLine} />}
        </View>
      ))}
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
  summaryCard: { marginBottom: 16 },
  summaryLabel: {
    color: theme.accent.cyan,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
  },
  summaryText: { color: theme.text.secondary, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  thirdCard: { flex: 1 },
  progressCard: { marginBottom: 16 },
  progressTitle: {
    color: theme.text.secondary,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  githubBtn: {
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  githubIcon: { fontSize: 16 },
  githubText: { color: theme.accent.cyan, fontSize: 14, fontWeight: "600" },
  sectionLabel: {
    color: theme.text.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    position: "relative",
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,255,0.15)",
    borderWidth: 1,
    borderColor: theme.accent.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { color: theme.accent.blue, fontSize: 10, fontWeight: "bold" },
  stepContent: { flex: 1, paddingTop: 4 },
  stepLabel: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepDesc: { color: theme.text.muted, fontSize: 12, lineHeight: 18 },
  stepLine: {
    position: "absolute",
    left: 15,
    top: 36,
    width: 1,
    height: 16,
    backgroundColor: theme.border.default,
  },
});
