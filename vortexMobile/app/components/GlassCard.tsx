import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { theme } from "./theme";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

export function GlassCard({ children, style, glow }: Props) {
  return (
    <View style={[styles.card, glow && styles.glowCard, style]}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border.default,
    padding: 16,
    shadowColor: theme.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  glowCard: {
    borderColor: theme.border.glow,
    shadowColor: theme.accent.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
});
