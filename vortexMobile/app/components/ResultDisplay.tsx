import { View, Text, StyleSheet } from "react-native";
import { theme } from "./theme";
import { GlassCard } from "./GlassCard";

interface Props {
  translated?: string;
  result?: string;
  error?: string;
}

export function ResultDisplay({ translated, result, error }: Props) {
  if (!result && !error && !translated) return null;

  const lines = result?.split("\n").filter(Boolean) || [];

  const parseLine = (line: string) => {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length > 1) return parts;
    return [line];
  };

  return (
    <GlassCard glow style={styles.container}>
      {translated && (
        <View style={styles.translatedRow}>
          <View style={styles.translatedBadge}>
            <Text style={styles.translatedBadgeText}>TRANSLATED</Text>
          </View>
          <Text style={styles.translatedText}>{translated}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!error && lines.length > 0 && (
        <View>
          <Text style={styles.resultLabel}>RESULT</Text>
          {lines.length === 1 ? (
            <Text style={styles.singleResult}>{lines[0]}</Text>
          ) : (
            lines.map((line, i) => {
              const parts = parseLine(line);
              return (
                <View
                  key={i}
                  style={[
                    styles.resultRow,
                    i === lines.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.rowDot} />
                  {parts.length > 1 ? (
                    <View style={styles.partsRow}>
                      {parts.map((part, j) => (
                        <View key={j} style={styles.partChip}>
                          <Text
                            style={[
                              styles.partText,
                              j === 0 && styles.partTextPrimary,
                            ]}
                          >
                            {part}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.rowText}>{line}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  translatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.subtle,
  },
  translatedBadge: {
    backgroundColor: "rgba(0,212,255,0.1)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.2)",
  },
  translatedBadgeText: {
    color: theme.accent.cyan,
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  translatedText: { color: theme.text.secondary, fontSize: 13, flex: 1 },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,68,102,0.08)",
    borderRadius: theme.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,68,102,0.2)",
  },
  errorIcon: { fontSize: 14 },
  errorText: {
    color: theme.accent.danger,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resultLabel: {
    color: theme.text.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
  },
  singleResult: { color: theme.text.primary, fontSize: 14, lineHeight: 22 },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.subtle,
  },
  lastRow: { borderBottomWidth: 0 },
  rowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.accent.blue,
    marginTop: 6,
    flexShrink: 0,
  },
  rowText: { color: theme.text.primary, fontSize: 12, flex: 1, lineHeight: 18 },
  partsRow: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  partChip: {
    backgroundColor: theme.bg.secondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.border.subtle,
  },
  partText: { color: theme.text.secondary, fontSize: 11 },
  partTextPrimary: { color: theme.text.primary, fontWeight: "600" },
});
