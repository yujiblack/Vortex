import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { theme } from "./theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bordered?: boolean;
  padded?: boolean;
}

export function NotionCard({
  children,
  style,
  bordered = true,
  padded = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        bordered && styles.bordered,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.bg.card,
    borderRadius: theme.radius.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  padded: {
    padding: 16,
  },
});
