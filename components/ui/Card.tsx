import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  onPress?: () => void;
  pressable?: boolean;
}

export function Card({ children, style, gradient = false, onPress, pressable = false }: CardProps) {
  const content = gradient ? (
    <LinearGradient
      colors={[Colors.surface.secondary, Colors.surface.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );

  if (onPress || pressable) {
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatCard({ value, label, color, icon, style }: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      {icon && <View style={styles.statIcon}>{icon}</View>}
      <View
        style={[
          styles.statAccent,
          { backgroundColor: color || Colors.brand[500] },
        ]}
      />
      <View style={styles.statContent}>
        <View style={styles.statValueRow}>
          <View
            style={[
              styles.statDot,
              { backgroundColor: color || Colors.brand[500] },
            ]}
          />
        </View>
        {/* Value and label rendered by parent via children pattern */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    padding: 16,
  },
  statCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  statContent: {
    gap: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
});
