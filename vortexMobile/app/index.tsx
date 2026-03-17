import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGrafanaStats, checkHealth } from "../services/api";
import { NotionCard } from "./components/NotionCard";
import { PropertyRow } from "./components/PropertyRow";
import { CalloutBlock } from "./components/CalloutBlock";
import { theme } from "./components/theme";

export default function Overview() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState("checking");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const load = async () => {
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
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isOnline = health === "ok";

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
      <StatusBar barStyle="dark-content" />

      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageIcon}>◈</Text>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>VoxDeploy</Text>
          <Text style={styles.pageSubtitle}>AI-powered CI/CD pipeline</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOnline ? "#e6f6f1" : "#fff0f0" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline
                  ? theme.accent.green
                  : theme.accent.red,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? theme.accent.green : theme.accent.red },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <CalloutBlock
        emoji={isOnline ? "✅" : "⚠️"}
        text={
          isOnline
            ? "All systems operational. Pipeline is listening for CI failures."
            : "VoxDeploy is offline or unreachable."
        }
        color={isOnline ? undefined : theme.accent.red}
        bgColor={isOnline ? undefined : "#fff5f5"}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Properties</Text>
        <NotionCard padded={false}>
          <PropertyRow label="Last sync" value={lastUpdated || "—"} icon="🕐" />
          <PropertyRow
            label="Status"
            value={isOnline ? "Online" : "Offline"}
            icon="◉"
            valueColor={isOnline ? theme.accent.green : theme.accent.red}
          />
          <PropertyRow label="Repo" value="yujiblack/Vortex-Test" icon="⌥" />
          {stats && (
            <>
              <PropertyRow
                label="Webhooks received"
                value={stats.webhooks_total}
                icon="⚡"
              />
              <PropertyRow
                label="PRs opened"
                value={stats.prs_opened}
                icon="↑"
              />
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
              <PropertyRow
                label="Diff errors"
                value={stats.diff_errors}
                icon="✕"
                valueColor={
                  stats.diff_errors > 0
                    ? theme.accent.red
                    : theme.text.secondary
                }
              />
            </>
          )}
        </NotionCard>
      </View>

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI Performance</Text>
          <NotionCard padded={false}>
            <PropertyRow
              label="Avg latency"
              value={`${stats.avg_ai_latency?.toFixed(1)}s`}
              icon="⏱"
            />
            <PropertyRow
              label="p95 latency"
              value={`${stats.p95_ai_latency?.toFixed(1)}s`}
              icon="📊"
            />
          </NotionCard>
        </View>
      )}

      {lastUpdated ? (
        <Text style={styles.footer}>Last updated {lastUpdated}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg.primary },
  content: { padding: 20, paddingBottom: 40 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  pageIcon: { fontSize: 28, color: theme.text.primary },
  pageHeaderText: { flex: 1 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text.primary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.text.muted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "500" },
  divider: {
    height: 1,
    backgroundColor: theme.border.default,
    marginBottom: 16,
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
  footer: {
    marginTop: 32,
    color: theme.text.muted,
    fontSize: 11,
    textAlign: "center",
  },
});
