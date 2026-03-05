import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useNotebooksStore } from "@/store/notebooks";
import { useAuthStore } from "@/store/auth";
import { FlashCard } from "@/components/flashcard/FlashCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import {
  calculateNextReview,
  shuffle,
  getIntervalDescription,
} from "@/lib/spaced-repetition";
import { db } from "@/lib/supabase";
import type { Flashcard, StudyQuality } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type StudyMode = "flashcard" | "learn";

export default function StudySessionScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { flashcardSets, flashcards, fetchFlashcards } = useNotebooksStore();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<
    { flashcard_id: string; quality: StudyQuality }[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [mode] = useState<StudyMode>("flashcard");
  const [showAnswer, setShowAnswer] = useState(false);

  // Animation values for swipe
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const set = flashcardSets.find((s) => s.id === setId);
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? currentIndex / cards.length : 0;

  useEffect(() => {
    const load = async () => {
      await fetchFlashcards(setId);
    };
    load();
  }, [setId]);

  useEffect(() => {
    const setCards_ = flashcards.filter((c) => c.set_id === setId);
    if (setCards_.length > 0) {
      setCards(shuffle(setCards_));
    }
  }, [flashcards, setId]);

  const handleQuality = useCallback(
    async (quality: StudyQuality) => {
      if (!currentCard || !user) return;

      Haptics.impactAsync(
        quality >= 3
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
      );

      const newResult = { flashcard_id: currentCard.id, quality };
      const newResults = [...results, newResult];

      // Update spaced repetition progress
      const newProgress = calculateNextReview({}, quality);
      await db.studyProgress.upsert({
        user_id: user.id,
        flashcard_id: currentCard.id,
        ease_factor: newProgress.easeFactor,
        interval: newProgress.interval,
        repetitions: newProgress.repetitions,
        next_review: newProgress.nextReview.toISOString(),
        last_review: new Date().toISOString(),
        last_quality: quality,
      });

      // Animate out
      translateX.value = withTiming(
        quality >= 3 ? SCREEN_WIDTH : -SCREEN_WIDTH,
        { duration: 300 },
        () => {
          runOnJS(advanceCard)(newResults);
        }
      );
    },
    [currentCard, results, user, currentIndex, cards]
  );

  const advanceCard = useCallback(
    (newResults: typeof results) => {
      setResults(newResults);
      setShowAnswer(false);
      setShowHint(false);

      if (currentIndex >= cards.length - 1) {
        completeSession(newResults);
      } else {
        setCurrentIndex((i) => i + 1);
        translateX.value = 0;
        opacity.value = withSpring(1);
      }
    },
    [currentIndex, cards.length]
  );

  const completeSession = useCallback(
    async (finalResults: typeof results) => {
      setIsComplete(true);

      // Save session to DB
      if (user && set) {
        const correctCount = finalResults.filter((r) => r.quality >= 3).length;
        const duration = Math.round((Date.now() - sessionStart) / 1000);

        await db.studySessions.create({
          user_id: user.id,
          flashcard_set_id: setId,
          mode: "flashcard",
          cards_studied: finalResults.length,
          correct_count: correctCount,
          session_duration: duration,
          completed_at: new Date().toISOString(),
        });
      }
    },
    [user, set, sessionStart]
  );

  // Swipe gesture
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value = 1 - Math.abs(e.translationX) / (SCREEN_WIDTH * 0.8);
    })
    .onEnd((e) => {
      if (e.translationX > 120) {
        runOnJS(handleQuality)(5); // Swipe right = easy/correct
      } else if (e.translationX < -120) {
        runOnJS(handleQuality)(1); // Swipe left = wrong
      } else {
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${(translateX.value / SCREEN_WIDTH) * 15}deg`,
      },
    ],
    opacity: opacity.value,
  }));

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No cards in this set</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return <SessionComplete results={results} cards={cards} onBack={() => router.back()} />;
  }

  const correctSoFar = results.filter((r) => r.quality >= 3).length;
  const accuracy = results.length > 0 ? Math.round((correctSoFar / results.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert("End Session", "End this study session?", [
            { text: "Continue", style: "cancel" },
            { text: "End", style: "destructive", onPress: () => router.back() },
          ]);
        }} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {cards.length}
          </Text>
          {results.length > 0 && (
            <Badge
              label={`${accuracy}% accuracy`}
              variant={accuracy >= 70 ? "success" : accuracy >= 50 ? "warning" : "error"}
              size="sm"
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.hintBtn}
          onPress={() => setShowHint(!showHint)}
        >
          <Ionicons name="bulb-outline" size={20} color={Colors.gold[400]} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <ProgressBar
        progress={progress}
        color={Colors.brand[500]}
        height={4}
        style={{ paddingHorizontal: 20 }}
      />

      {/* Set name */}
      <Text style={styles.setName} numberOfLines={1}>
        {set?.title}
      </Text>

      {/* Card */}
      <View style={styles.cardArea}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.cardWrapper, cardAnimStyle]}>
            {currentCard && (
              <FlashCard
                card={currentCard}
                showHint={showHint}
                onFlip={(isFront) => setShowAnswer(!isFront)}
              />
            )}
          </Animated.View>
        </GestureDetector>

        {/* Swipe hints */}
        <View style={styles.swipeHints}>
          <View style={styles.swipeHint}>
            <Ionicons name="close-circle" size={18} color={Colors.error} />
            <Text style={styles.swipeHintText}>Didn't know</Text>
          </View>
          <Text style={styles.swipeHintDivider}>Swipe or tap</Text>
          <View style={styles.swipeHint}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.swipeHintText}>Got it!</Text>
          </View>
        </View>
      </View>

      {/* Rating Buttons (shown after flip) */}
      {showAnswer && (
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>How well did you know it?</Text>
          <View style={styles.ratingButtons}>
            <RatingButton
              label="Again"
              sublabel="< 1 min"
              color={Colors.error}
              onPress={() => handleQuality(0)}
            />
            <RatingButton
              label="Hard"
              sublabel={getIntervalDescription(1)}
              color={Colors.warning}
              onPress={() => handleQuality(2)}
            />
            <RatingButton
              label="Good"
              sublabel={getIntervalDescription(3)}
              color={Colors.success}
              onPress={() => handleQuality(4)}
            />
            <RatingButton
              label="Easy"
              sublabel={getIntervalDescription(7)}
              color={Colors.brand[400]}
              onPress={() => handleQuality(5)}
            />
          </View>
        </View>
      )}

      {/* Skip button when not answered */}
      {!showAnswer && (
        <View style={styles.skipSection}>
          <TouchableOpacity
            onPress={() => handleQuality(0)}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function RatingButton({
  label,
  sublabel,
  color,
  onPress,
}: {
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.ratingBtn, { borderColor: `${color}40` }]}
      activeOpacity={0.85}
    >
      <View style={[styles.ratingDot, { backgroundColor: color }]} />
      <Text style={styles.ratingLabel}>{label}</Text>
      <Text style={[styles.ratingSublabel, { color }]}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function SessionComplete({
  results,
  cards,
  onBack,
}: {
  results: { flashcard_id: string; quality: StudyQuality }[];
  cards: Flashcard[];
  onBack: () => void;
}) {
  const correctCount = results.filter((r) => r.quality >= 3).length;
  const accuracy = Math.round((correctCount / results.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.bg.primary, "#0D0D20"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 32, padding: 24 }}
      >
        <Text style={styles.completeEmoji}>
          {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "🎯" : "💪"}
        </Text>

        <View style={styles.completeTitle}>
          <Text style={styles.completeTitleText}>Session Complete!</Text>
          <Text style={styles.completeSubtitle}>
            {accuracy >= 80
              ? "Outstanding performance!"
              : accuracy >= 60
              ? "Great job, keep going!"
              : "Keep practicing — you'll get there!"}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={cards.length} label="Cards" color={Colors.brand[400]} />
          <StatBox value={correctCount} label="Correct" color={Colors.success} />
          <StatBox
            value={`${accuracy}%`}
            label="Accuracy"
            color={accuracy >= 80 ? Colors.gold[500] : Colors.text.primary}
          />
        </View>

        <ProgressBar
          progress={accuracy / 100}
          color={accuracy >= 80 ? Colors.gold[500] : Colors.brand[500]}
          height={12}
          showLabel
          labelPosition="top"
          style={{ width: "100%" }}
        />

        <TouchableOpacity onPress={onBack} style={styles.doneBtn}>
          <LinearGradient
            colors={Colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneBtnGradient}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StatBox({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  hintBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  setName: {
    fontSize: 13,
    color: Colors.text.tertiary,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
    fontWeight: "500",
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: "100%",
    alignItems: "center",
  },
  swipeHints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swipeHintText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  swipeHintDivider: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  ratingSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
    textAlign: "center",
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  ratingSublabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  skipSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },

  // Complete screen
  completeEmoji: {
    fontSize: 64,
  },
  completeTitle: {
    alignItems: "center",
    gap: 8,
  },
  completeTitleText: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statBoxValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  doneBtn: {
    width: "100%",
  },
  doneBtnGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
