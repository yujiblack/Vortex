import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { getGrafanaStats, checkHealth } from "../services/api";
import { MetricCard } from "./components/MetricCard";
import { GlassCard } from "./components/GlassCard";
import { ProgressBar } from "./components/ProgressBar";
import { WaveformBar } from "./components/WaveformBar";
import { theme } from "./components/theme";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState("checking");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetch = async () => {
    try {
      const [s, h] = await Promise.all([getGrafanaStats(), checkHealth()]);
      setStats(s);
      setHealth(h);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setHealth("offline");
    }
  };

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };
  const isOnline = health === "ok";

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
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>AI Command Center</Text>
          <Text style={styles.title}>VoxDeploy</Text>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline
                  ? theme.accent.success
                  : theme.accent.danger,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? theme.accent.success : theme.accent.danger },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Waveform hero */}
      <GlassCard glow style={styles.heroCard}>
        <Text style={styles.heroLabel}>SYSTEM ACTIVITY</Text>
        <WaveformBar active={isOnline} color={theme.accent.blue} height={50} />
        {lastUpdated ? (
          <Text style={styles.heroTime}>Last sync {lastUpdated}</Text>
        ) : null}
      </GlassCard>

      {/* Primary metrics */}
      {stats && (
        <>
          <View style={styles.row}>
            <MetricCard
              title="CI Failures Caught"
              value={stats.webhooks_total}
              icon="🚨"
              color={theme.accent.danger}
              style={styles.halfCard}
            />
            <MetricCard
              title="PRs Opened"
              value={stats.prs_opened}
              icon="🎉"
              color={theme.accent.success}
              style={styles.halfCard}
            />
          </View>

          <MetricCard
            title="Success Rate"
            value={`${stats.success_rate.toFixed(1)}%`}
            subtitle="Fixes successfully merged"
            icon="📈"
            color={theme.accent.cyan}
            large
          />

          {/* Performance card */}
          <GlassCard style={styles.perfCard}>
            <Text style={styles.perfTitle}>AI Performance</Text>
            <ProgressBar
              label="Avg Latency"
              value={Math.min(stats.avg_ai_latency * 10, 100)}
              color={theme.accent.blue}
            />
            <ProgressBar
              label="p95 Latency"
              value={Math.min(stats.p95_ai_latency * 10, 100)}
              color={theme.accent.cyan}
            />
            <ProgressBar
              label="Error Rate"
              value={
                stats.webhooks_total > 0
                  ? (stats.diff_errors / stats.webhooks_total) * 100
                  : 0
              }
              color={theme.accent.danger}
            />
          </GlassCard>

          <View style={styles.row}>
            <MetricCard
              title="Fixes Generated"
              value={stats.fixes_generated}
              icon="🛠️"
              color={theme.accent.warning}
              style={styles.halfCard}
            />
            <MetricCard
              title="Diff Errors"
              value={stats.diff_errors}
              icon="❌"
              color={theme.accent.danger}
              style={styles.halfCard}
            />
          </View>

          {/* Latency display */}
          <View style={styles.row}>
            <MetricCard
              title="Avg AI Latency"
              value={`${stats.avg_ai_latency.toFixed(1)}s`}
              icon="⚡"
              color="#c77dff"
              style={styles.halfCard}
            />
            <MetricCard
              title="p95 Latency"
              value={`${stats.p95_ai_latency.toFixed(1)}s`}
              icon="📊"
              color="#ff9a3c"
              style={styles.halfCard}
            />
          </View>
        </>
      )}

      {!stats && (
        <GlassCard style={styles.loadingCard}>
          <WaveformBar active color={theme.accent.blue} height={30} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    color: theme.text.muted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.text.primary,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.bg.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  heroCard: { marginBottom: 16 },
  heroLabel: {
    color: theme.text.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
  },
  heroTime: {
    color: theme.text.muted,
    fontSize: 10,
    marginTop: 8,
    textAlign: "right",
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  halfCard: { flex: 1 },
  perfCard: { marginBottom: 10 },
  perfTitle: {
    color: theme.text.secondary,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  loadingCard: { alignItems: "center", padding: 24, gap: 16 },
  loadingText: { color: theme.text.muted, fontSize: 13 },
});
