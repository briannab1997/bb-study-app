import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

type BadgeVariant = "brand" | "gold" | "success" | "error" | "warning" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({ label, variant = "brand", size = "sm", style }: BadgeProps) {
  const variantStyle = badgeVariants[variant];
  const sizeStyle = badgeSizes[size];

  return (
    <View style={[styles.base, variantStyle.container, sizeStyle.container, style]}>
      <Text style={[styles.text, variantStyle.text, sizeStyle.text]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

const badgeVariants: Record<
  BadgeVariant,
  { container: ViewStyle; text: any }
> = {
  brand: {
    container: { backgroundColor: "rgba(124, 58, 237, 0.15)", borderWidth: 1, borderColor: "rgba(124, 58, 237, 0.3)" },
    text: { color: Colors.brand[400] },
  },
  gold: {
    container: { backgroundColor: "rgba(245, 158, 11, 0.15)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.3)" },
    text: { color: Colors.gold[400] },
  },
  success: {
    container: { backgroundColor: "rgba(16, 185, 129, 0.15)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.3)" },
    text: { color: Colors.success },
  },
  error: {
    container: { backgroundColor: "rgba(244, 63, 94, 0.15)", borderWidth: 1, borderColor: "rgba(244, 63, 94, 0.3)" },
    text: { color: Colors.error },
  },
  warning: {
    container: { backgroundColor: "rgba(245, 158, 11, 0.15)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.3)" },
    text: { color: Colors.warning },
  },
  neutral: {
    container: { backgroundColor: Colors.surface.tertiary, borderWidth: 1, borderColor: Colors.border.primary },
    text: { color: Colors.text.secondary },
  },
};

const badgeSizes = {
  sm: {
    container: { paddingVertical: 3, paddingHorizontal: 8 } as ViewStyle,
    text: { fontSize: 11 },
  },
  md: {
    container: { paddingVertical: 5, paddingHorizontal: 12 } as ViewStyle,
    text: { fontSize: 13 },
  },
};
