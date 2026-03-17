import { View, Text, StyleSheet } from "react-native";
import { theme } from "./theme";

interface PropertyRowProps {
  label: string;
  value: string | number;
  valueColor?: string;
  icon?: string;
}

export function PropertyRow({
  label,
  value,
  valueColor,
  icon,
}: PropertyRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelSide}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  labelSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    fontSize: 14,
    width: 20,
    textAlign: "center",
  },
  label: {
    color: theme.text.secondary,
    fontSize: 13,
  },
  value: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
});
