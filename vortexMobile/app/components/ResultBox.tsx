import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "./theme";
import { NotionCard } from "./NotionCard";

interface ResultBlockProps {
  translated?: string;
  result?: string;
  error?: string;
}

export function ResultBlock({ translated, result, error }: ResultBlockProps) {
  if (!result && !error && !translated) return null;

  const lines = result?.split("\n").filter(Boolean) || [];

  return (
    <View style={styles.container}>
      {translated && (
        <View style={styles.translatedRow}>
          <Text style={styles.translatedLabel}>Translated</Text>
          <Text style={styles.translatedValue}>{translated}</Text>
        </View>
      )}

      {error && (
        <NotionCard style={styles.errorCard} padded>
          <View style={styles.errorRow}>
            <Text style={styles.errorDot}>●</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </NotionCard>
      )}

      {!error && lines.length > 0 && (
        <NotionCard style={styles.resultCard} padded={false}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultHeaderText}>Output</Text>
          </View>
          {lines.map((line, i) => {
            const parts = line.split("|").map((p) => p.trim());
            const isLast = i === lines.length - 1;
            return (
              <View
                key={i}
                style={[styles.resultRow, !isLast && styles.resultRowBorder]}
              >
                <Text style={styles.resultBullet}>—</Text>
                {parts.length > 1 ? (
                  <View style={styles.partsRow}>
                    <Text style={styles.partPrimary}>{parts[0]}</Text>
                    {parts.slice(1).map((p, j) => (
                      <Text key={j} style={styles.partSecondary}>
                        {p}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.resultText}>{line}</Text>
                )}
              </View>
            );
          })}
        </NotionCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, gap: 8 },
  translatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  translatedLabel: {
    color: theme.text.muted,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  translatedValue: { color: theme.text.secondary, fontSize: 13, flex: 1 },
  errorCard: {
    borderColor: "#ffd4d4",
    backgroundColor: "#fff5f5",
  },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  errorDot: { color: theme.accent.red, fontSize: 10, marginTop: 4 },
  errorText: { color: theme.accent.red, fontSize: 13, flex: 1, lineHeight: 20 },
  resultCard: { overflow: "hidden" },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
    backgroundColor: theme.bg.secondary,
  },
  resultHeaderText: {
    color: theme.text.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  resultRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  resultBullet: { color: theme.text.muted, fontSize: 13, marginTop: 1 },
  resultText: {
    color: theme.text.primary,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  partsRow: { flex: 1, gap: 2 },
  partPrimary: { color: theme.text.primary, fontSize: 13, fontWeight: "500" },
  partSecondary: { color: theme.text.secondary, fontSize: 12 },
});
