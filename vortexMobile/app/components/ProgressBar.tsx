import { View, Text, StyleSheet } from "react-native";
import { theme } from "./theme";

interface Props {
  label: string;
  value: number; // 0-100
  color?: string;
  showValue?: boolean;
}

export function ProgressBar({ label, value, color, showValue = true }: Props) {
  const c = color || theme.accent.blue;
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showValue && (
          <Text style={[styles.value, { color: c }]}>{value.toFixed(0)}%</Text>
        )}
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(value, 100)}%`, backgroundColor: c },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { color: theme.text.secondary, fontSize: 12 },
  value: { fontSize: 12, fontWeight: "bold" },
  track: {
    height: 4,
    backgroundColor: theme.border.subtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    shadowColor: "#2563ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
