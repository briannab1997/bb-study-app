import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useSafeArea?: boolean;
}

export function GradientBackground({
  children,
  style,
  useSafeArea = false,
}: GradientBackgroundProps) {
  const content = (
    <LinearGradient
      colors={[Colors.bg.primary, Colors.bg.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );

  if (useSafeArea) {
    return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;
  }

  return content;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  gradient: {
    flex: 1,
  },
});
