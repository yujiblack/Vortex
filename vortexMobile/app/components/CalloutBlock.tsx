import { View, Text, StyleSheet } from "react-native";
import { theme } from "./theme";

interface CalloutProps {
  emoji: string;
  text: string;
  color?: string;
  bgColor?: string;
}

export function CalloutBlock({ emoji, text, color, bgColor }: CalloutProps) {
  return (
    <View style={[styles.callout, bgColor ? { backgroundColor: bgColor } : {}]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.text, color ? { color } : {}]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: theme.bg.secondary,
    borderRadius: theme.radius.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  emoji: { fontSize: 16, lineHeight: 20 },
  text: { color: theme.text.primary, fontSize: 13, flex: 1, lineHeight: 20 },
});
