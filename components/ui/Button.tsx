import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = sizes[size];
  const isDisabled = disabled || isLoading;

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && { width: "100%" }, style]}
      >
        <LinearGradient
          colors={Colors.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            sizeStyles.container,
            isDisabled && styles.disabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              {icon && iconPosition === "left" && icon}
              <Text style={[styles.text, sizeStyles.text, textStyle]}>
                {label}
              </Text>
              {icon && iconPosition === "right" && icon}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "gold") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && { width: "100%" }, style]}
      >
        <LinearGradient
          colors={Colors.gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            sizeStyles.container,
            isDisabled && styles.disabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              {icon && iconPosition === "left" && icon}
              <Text style={[styles.text, sizeStyles.text, textStyle]}>
                {label}
              </Text>
              {icon && iconPosition === "right" && icon}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        sizeStyles.container,
        variantStyle.container,
        isDisabled && styles.disabled,
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.loaderColor || Colors.text.primary}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyle.text,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

const sizes = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 16 } as ViewStyle,
    text: { fontSize: 14 } as TextStyle,
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 24 } as ViewStyle,
    text: { fontSize: 16 } as TextStyle,
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 32 } as ViewStyle,
    text: { fontSize: 18 } as TextStyle,
  },
};

const variantStyles: Record<
  Exclude<Variant, "primary" | "gold">,
  { container: ViewStyle; text: TextStyle; loaderColor?: string }
> = {
  secondary: {
    container: {
      backgroundColor: Colors.surface.primary,
      borderWidth: 1,
      borderColor: Colors.border.primary,
    },
    text: { color: Colors.text.primary },
  },
  ghost: {
    container: { backgroundColor: Colors.transparent },
    text: { color: Colors.brand[400] },
  },
  danger: {
    container: { backgroundColor: Colors.error },
    text: { color: Colors.white },
    loaderColor: Colors.white,
  },
};
