import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen
            name="notebook/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="notebook/new"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="flashcards/[setId]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="flashcards/study/[setId]"
            options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="quiz/[setId]"
            options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="flashcards/match/[setId]"
            options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
