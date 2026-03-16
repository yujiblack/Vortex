import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1a1a1a",
        },
        tabBarActiveTintColor: "#00ff88",
        tabBarInactiveTintColor: "#555",
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="pulse" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: "Voice",
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kubernetes"
        options={{
          title: "K8s",
          tabBarIcon: ({ color }) => (
            <Ionicons name="server" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="docker"
        options={{
          title: "Docker",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prs"
        options={{
          title: "PRs",
          tabBarIcon: ({ color }) => (
            <Ionicons name="git-pull-request" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
