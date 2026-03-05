import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  labelPosition?: "top" | "right";
  style?: object;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.brand[500],
  backgroundColor = Colors.surface.tertiary,
  height = 6,
  showLabel = false,
  labelPosition = "right",
  style,
  animated = true,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = animated
      ? withTiming(Math.min(Math.max(progress, 0), 1), {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      : Math.min(Math.max(progress, 0), 1);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const percentage = Math.round(progress * 100);

  if (labelPosition === "top" && showLabel) {
    return (
      <View style={style}>
        <View style={styles.topLabel}>
          <Text style={styles.labelText}>{percentage}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor, height }]}>
          <Animated.View
            style={[styles.fill, { backgroundColor }, animatedStyle]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.track, { backgroundColor, height, flex: 1 }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: color, height }, animatedStyle]}
        />
      </View>
      {showLabel && labelPosition === "right" && (
        <Text style={styles.labelText}>{percentage}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  track: {
    borderRadius: 100,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 100,
  },
  topLabel: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
});
