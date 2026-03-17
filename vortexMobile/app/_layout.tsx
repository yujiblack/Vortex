import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { theme } from "./components/theme";

function VoiceTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.voiceIconWrapper, focused && styles.voiceIconActive]}>
      <Text style={[styles.voiceIcon, focused && styles.voiceIconTextActive]}>
        ◎
      </Text>
    </View>
  );
}

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg.card,
          borderTopWidth: 1,
          borderTopColor: theme.border.default,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.text.primary,
        tabBarInactiveTintColor: theme.text.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>◈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          title: "Control",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>⌘</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => <VoiceTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="prs"
        options={{
          title: "PRs",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>↑</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>○</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  voiceIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.bg.secondary,
    borderWidth: 1,
    borderColor: theme.border.default,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceIconActive: {
    backgroundColor: theme.text.primary,
    borderColor: theme.text.primary,
  },
  voiceIcon: { fontSize: 26, color: theme.text.muted },
  voiceIconTextActive: { color: "#ffffff" },
});
