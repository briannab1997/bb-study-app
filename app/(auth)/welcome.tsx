import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { emoji: "🧠", label: "AI-Powered Notes", color: Colors.brand[500] },
  { emoji: "⚡", label: "Smart Flashcards", color: Colors.gold[500] },
  { emoji: "📊", label: "Spaced Repetition", color: Colors.success },
  { emoji: "💬", label: "AI Tutor Chat", color: "#06B6D4" },
];

export default function WelcomeScreen() {
  const router = useRouter();

  // Animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    featuresOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));

    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: 0.15,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.bg.primary, "#0D0D20", Colors.bg.primary]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoSection, logoStyle]}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={Colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>✨</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: titleOpacity, alignItems: "center" }}>
        <Text style={styles.appName}>Luminary</Text>
        <Text style={styles.tagline}>Illuminate your potential.</Text>
      </Animated.View>

      {/* Features */}
      <Animated.View style={[styles.features, { opacity: featuresOpacity }]}>
        {FEATURES.map((feature, i) => (
          <View key={i} style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${feature.color}20`, borderColor: `${feature.color}40` },
              ]}
            >
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
            </View>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA Buttons */}
      <Animated.View style={[styles.buttons, { opacity: buttonsOpacity }]}>
        <Button
          label="Get Started"
          onPress={() => router.push("/(auth)/register")}
          variant="primary"
          size="lg"
          fullWidth
        />
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={styles.signInButton}
        >
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text style={styles.signInHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 24,
  },
  glow: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.brand[500],
    top: height * 0.2,
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
  },
  logoContainer: {
    shadowColor: Colors.brand[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 17,
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  featureIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: {
    fontSize: 14,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  buttons: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  signInButton: {
    padding: 4,
  },
  signInText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  signInHighlight: {
    color: Colors.brand[400],
    fontWeight: "600",
  },
});
