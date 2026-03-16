import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "./theme";
import { GlassCard } from "./GlassCard";
import { StyleProp } from "react-native";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>; // ← change this
  large?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  color,
  icon,
  style,
  large,
}: Props) {
  const accentColor = color || theme.accent.cyan;
  return (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text
        style={[
          styles.value,
          { color: accentColor, fontSize: large ? 42 : 28 },
        ]}
      >
        {value}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={[styles.glowLine, { backgroundColor: accentColor }]} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", minHeight: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  icon: { fontSize: 14 },
  title: {
    color: theme.text.secondary,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "600",
    flex: 1,
  },
  value: {
    fontWeight: "bold",
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.text.muted,
    fontSize: 11,
  },
  glowLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
});
