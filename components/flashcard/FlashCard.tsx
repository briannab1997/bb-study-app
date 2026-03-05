import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import type { Flashcard } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.65;

interface FlashCardProps {
  card: Flashcard;
  showHint?: boolean;
  onFlip?: (isFront: boolean) => void;
}

export function FlashCard({ card, showHint = false, onFlip }: FlashCardProps) {
  const [isFront, setIsFront] = useState(true);
  const rotation = useSharedValue(0);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isFront ? 1 : 0;
    rotation.value = withTiming(toValue, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    setIsFront(!isFront);
    onFlip?.(!isFront);
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
      },
    ],
    opacity: rotation.value < 0.5 ? 1 : 0,
    zIndex: rotation.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg`,
      },
    ],
    opacity: rotation.value >= 0.5 ? 1 : 0,
    zIndex: rotation.value >= 0.5 ? 1 : 0,
  }));

  return (
    <TouchableOpacity
      onPress={handleFlip}
      activeOpacity={0.95}
      style={styles.container}
    >
      {/* Front */}
      <Animated.View style={[styles.card, frontStyle]}>
        <LinearGradient
          colors={[Colors.surface.secondary, Colors.surface.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          <View style={styles.cardLabel}>
            <Text style={styles.cardLabelText}>Question</Text>
          </View>
          <Text style={styles.frontText}>{card.front}</Text>
          {showHint && card.hint && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>💡 {card.hint}</Text>
            </View>
          )}
          <View style={styles.flipHint}>
            <Text style={styles.flipHintText}>Tap to reveal answer</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
        <LinearGradient
          colors={["#1A1040", "#0F0F28"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          <LinearGradient
            colors={Colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backAccent}
          />
          <View style={styles.cardLabel}>
            <Text style={[styles.cardLabelText, { color: Colors.brand[400] }]}>
              Answer
            </Text>
          </View>
          <Text style={styles.backText}>{card.back}</Text>
          <View style={styles.flipHint}>
            <Text style={styles.flipHintText}>Tap to see question</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
  },
  cardBack: {
    // Back face
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    justifyContent: "center",
    overflow: "hidden",
  },
  backAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardLabel: {
    position: "absolute",
    top: 16,
    left: 24,
  },
  cardLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.tertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  frontText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  backText: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.text.primary,
    textAlign: "center",
    lineHeight: 26,
  },
  hintContainer: {
    marginTop: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  hintText: {
    fontSize: 13,
    color: Colors.gold[400],
    textAlign: "center",
  },
  flipHint: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  flipHintText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    letterSpacing: 0.3,
  },
});
