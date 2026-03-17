import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "./theme";

interface ChipProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  icon?: string;
}

export function CommandChip({
  label,
  onPress,
  disabled,
  active,
  icon,
}: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border.default,
    backgroundColor: theme.bg.card,
  },
  chipActive: {
    backgroundColor: theme.text.primary,
    borderColor: theme.text.primary,
  },
  icon: { fontSize: 12 },
  label: { color: theme.text.secondary, fontSize: 12, fontWeight: "500" },
  labelActive: { color: "#ffffff" },
});
