import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Colors } from "@/constants/colors";

type IconName = keyof typeof Ionicons.glyphMap;

interface TabBarIconProps {
  name: IconName;
  focused: boolean;
  color: string;
  size: number;
}

function TabBarIcon({ name, focused, color, size }: TabBarIconProps) {
  return (
    <View style={focused ? styles.activeIconContainer : undefined}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand[400],
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          backgroundColor:
            Platform.OS === "ios" ? "transparent" : Colors.bg.secondary,
          borderTopColor: Colors.border.primary,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          height: Platform.OS === "ios" ? 88 : 64,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              name={focused ? "library" : "library-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Study",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              name={focused ? "flash" : "flash-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderRadius: 12,
    padding: 6,
  },
});
