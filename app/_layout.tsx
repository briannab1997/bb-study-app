import { Platform } from "react-native";
import { Stack } from "expo-router";
import Head from "expo-router/head";
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
        {/* PWA meta tags — web only */}
        {Platform.OS === "web" && (
          <Head>
            <meta name="application-name" content="Luminary" />
            <meta name="description" content="AI-powered study app. Take notes, generate flashcards, and chat with your AI tutor." />
            <meta name="theme-color" content="#7C3AED" />
            <meta name="msapplication-TileColor" content="#7C3AED" />
            {/* iOS PWA */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Luminary" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            {/* Web manifest */}
            <link rel="manifest" href="/manifest.json" />
            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content="Luminary — AI Study App" />
            <meta property="og:description" content="AI-powered study app. Take notes, generate flashcards, and chat with your AI tutor." />
            <meta property="og:image" content="/icon-512.png" />
          </Head>
        )}
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
