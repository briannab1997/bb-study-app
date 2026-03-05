import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useNotebooksStore } from "@/store/notebooks";
import { useAuthStore } from "@/store/auth";
import { generateQuizFromFlashcards } from "@/lib/claude";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { db } from "@/lib/supabase";
import type { QuizQuestion } from "@/lib/claude";

type AnswerState = "unanswered" | "correct" | "wrong";

export default function QuizScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { flashcardSets, flashcards, fetchFlashcards } = useNotebooksStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const questionStart = useRef(Date.now());
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const set = flashcardSets.find((s) => s.id === setId);
  const currentQ = questions[current];
  const progress = questions.length > 0 ? current / questions.length : 0;

  useEffect(() => {
    loadQuiz();
  }, [setId]);

  const loadQuiz = async () => {
    await fetchFlashcards(setId);
    const cards = flashcards.filter((c) => c.set_id === setId);

    if (cards.length < 2) {
      Alert.alert(
        "Not enough cards",
        "Add at least 2 flashcards to take a test.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      return;
    }

    try {
      const count = Math.min(10, cards.length);
      const generated = await generateQuizFromFlashcards(cards, count);
      setQuestions(generated);
      questionStart.current = Date.now();
    } catch {
      Alert.alert("Couldn't load quiz", "Check your API key and try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (answerState !== "unanswered") return;

    const elapsed = Date.now() - questionStart.current;
    setTimePerQuestion((prev) => [...prev, elapsed]);
    setSelectedIndex(index);

    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      setAnswerState("correct");
      setScore((s) => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setAnswerState("wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake the wrong answer
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNext = async () => {
    if (current >= questions.length - 1) {
      // Save session
      if (user && set) {
        await db.studySessions.create({
          user_id: user.id,
          flashcard_set_id: setId,
          mode: "test",
          cards_studied: questions.length,
          correct_count: score + (answerState === "correct" ? 0 : 0), // already counted
          session_duration: Math.round((Date.now() - sessionStart) / 1000),
          completed_at: new Date().toISOString(),
        });
      }
      setIsComplete(true);
    } else {
      setCurrent((c) => c + 1);
      setSelectedIndex(null);
      setAnswerState("unanswered");
      questionStart.current = Date.now();
    }
  };

  const getOptionStyle = (index: number) => {
    if (answerState === "unanswered") {
      return selectedIndex === index ? styles.optionSelected : styles.option;
    }
    if (index === currentQ?.correctIndex) return styles.optionCorrect;
    if (index === selectedIndex && answerState === "wrong") return styles.optionWrong;
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (answerState === "unanswered") return styles.optionText;
    if (index === currentQ?.correctIndex) return styles.optionTextCorrect;
    if (index === selectedIndex && answerState === "wrong") return styles.optionTextWrong;
    return styles.optionText;
  };

  const getOptionIcon = (index: number) => {
    if (answerState === "unanswered") return null;
    if (index === currentQ?.correctIndex)
      return <Ionicons name="checkmark-circle" size={20} color={Colors.success} />;
    if (index === selectedIndex && answerState === "wrong")
      return <Ionicons name="close-circle" size={20} color={Colors.error} />;
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          fullScreen
          message="Generating your quiz with AI..."
        />
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((score / questions.length) * 100);
    const avgTime = Math.round(
      timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length / 1000
    );

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Colors.bg.primary, "#0D0D20"]}
          style={styles.completeScreen}
        >
          <Text style={styles.completeEmoji}>
            {accuracy === 100 ? "🏆" : accuracy >= 80 ? "🎯" : accuracy >= 60 ? "💪" : "📖"}
          </Text>
          <Text style={styles.completeTitle}>Test Complete</Text>
          <Text style={styles.completeSubtitle}>
            {accuracy === 100
              ? "Perfect score — you nailed it."
              : accuracy >= 80
              ? "Really solid. A bit more review and you've got it locked."
              : accuracy >= 60
              ? "Good start. Keep studying and you'll get there."
              : "Keep at it — every session builds the foundation."}
          </Text>

          <View style={styles.resultsCard}>
            <ResultRow label="Score" value={`${score} / ${questions.length}`} />
            <View style={styles.resultDivider} />
            <ResultRow label="Accuracy" value={`${accuracy}%`} color={
              accuracy >= 80 ? Colors.success : accuracy >= 60 ? Colors.warning : Colors.error
            } />
            <View style={styles.resultDivider} />
            <ResultRow label="Avg. per question" value={`${avgTime}s`} />
          </View>

          <ProgressBar
            progress={accuracy / 100}
            color={accuracy >= 80 ? Colors.gold[500] : Colors.brand[500]}
            height={10}
            style={{ width: "100%" }}
          />

          <View style={styles.completeActions}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setCurrent(0);
                setScore(0);
                setSelectedIndex(null);
                setAnswerState("unanswered");
                setIsComplete(false);
                setIsLoading(true);
                setTimePerQuestion([]);
                loadQuiz();
              }}
            >
              <Ionicons name="refresh" size={18} color={Colors.brand[400]} />
              <Text style={styles.retryText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <LinearGradient
                colors={Colors.gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Exit test?", "Your progress won't be saved.", [
              { text: "Keep going", style: "cancel" },
              { text: "Exit", style: "destructive", onPress: () => router.back() },
            ])
          }
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <Text style={styles.questionCount}>
            {current + 1} <Text style={styles.questionCountOf}>of {questions.length}</Text>
          </Text>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreText}>{score} correct</Text>
          </View>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        color={Colors.brand[500]}
        height={4}
        style={{ paddingHorizontal: 20 }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Set name */}
        <Text style={styles.setName}>{set?.title}</Text>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question {current + 1}</Text>
          <Text style={styles.questionText}>{currentQ?.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {currentQ?.options.map((option, index) => (
            <Animated.View
              key={index}
              style={
                answerState === "wrong" && index === selectedIndex
                  ? { transform: [{ translateX: shakeAnim }] }
                  : undefined
              }
            >
              <TouchableOpacity
                style={getOptionStyle(index)}
                onPress={() => handleAnswer(index)}
                activeOpacity={0.85}
                disabled={answerState !== "unanswered"}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {["A", "B", "C", "D"][index]}
                  </Text>
                </View>
                <Text style={[getOptionTextStyle(index), { flex: 1 }]}>
                  {option.replace(/^[A-D]\.\s*/, "")}
                </Text>
                {getOptionIcon(index)}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Explanation */}
        {answerState !== "unanswered" && currentQ?.explanation && (
          <View style={styles.explanation}>
            <Text style={styles.explanationLabel}>
              {answerState === "correct" ? "✅ Correct" : "❌ Incorrect"}
            </Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Next button */}
      {answerState !== "unanswered" && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient
              colors={Colors.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {current >= questions.length - 1 ? "See Results" : "Next Question"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ResultRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
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
  headerMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionCount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  questionCountOf: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.text.tertiary,
  },
  scoreChip: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 20,
  },
  setName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.tertiary,
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.brand[400],
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: 19,
    fontWeight: "600",
    color: Colors.text.primary,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  optionSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.brand[500],
    gap: 12,
  },
  optionCorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.success,
    gap: 12,
  },
  optionWrong: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.error,
    gap: 12,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface.tertiary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  optionTextCorrect: {
    fontSize: 15,
    color: Colors.success,
    lineHeight: 22,
    fontWeight: "600",
  },
  optionTextWrong: {
    fontSize: 15,
    color: Colors.error,
    lineHeight: 22,
  },
  explanation: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand[500],
    gap: 6,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },

  // Complete screen
  completeScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 28,
  },
  completeEmoji: {
    fontSize: 64,
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.8,
  },
  completeSubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 23,
  },
  resultsCard: {
    width: "100%",
    backgroundColor: Colors.surface.primary,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.border.secondary,
    marginHorizontal: 16,
  },
  resultLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  resultValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  completeActions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.brand[400],
  },
  doneBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
});
