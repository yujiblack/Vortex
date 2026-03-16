import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { theme } from "./theme";

interface Props {
  label: string;
  sublabel?: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  style?: ViewStyle;
  variant?: "default" | "primary" | "danger";
}

export function CommandButton({
  label,
  sublabel,
  icon,
  onPress,
  disabled,
  active,
  style,
  variant = "default",
}: Props) {
  const borderColor =
    variant === "primary"
      ? theme.accent.cyan
      : variant === "danger"
        ? theme.accent.danger
        : active
          ? theme.accent.blue
          : theme.border.default;

  return (
    <TouchableOpacity
      style={[styles.btn, { borderColor }, active && styles.btnActive, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            variant === "primary" && { color: theme.accent.cyan },
          ]}
        >
          {label}
        </Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnActive: {
    backgroundColor: "rgba(37, 99, 255, 0.1)",
  },
  icon: { fontSize: 20 },
  textContainer: { flex: 1 },
  label: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  sublabel: {
    color: theme.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
