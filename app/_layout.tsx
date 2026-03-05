import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// Animations are native-only — react-native-screens uses Reanimated 4 easing on web
const anim = (type: string) =>
  Platform.OS === "web" ? {} : { animation: type };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={anim("fade")} />
          <Stack.Screen name="(tabs)" options={anim("fade")} />
          <Stack.Screen
            name="notebook/[id]"
            options={anim("slide_from_right")}
          />
          <Stack.Screen
            name="notebook/new"
            options={Platform.OS === "web" ? {} : { animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="flashcards/[setId]"
            options={anim("slide_from_right")}
          />
          <Stack.Screen
            name="flashcards/study/[setId]"
            options={Platform.OS === "web" ? {} : { animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="quiz/[setId]"
            options={Platform.OS === "web" ? {} : { animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="flashcards/match/[setId]"
            options={Platform.OS === "web" ? {} : { animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
