import React, { useEffect, useState, useRef } from "react";
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
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useNotebooksStore } from "@/store/notebooks";
import { useAuthStore } from "@/store/auth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { shuffle } from "@/lib/spaced-repetition";
import { db } from "@/lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_PAIRS = 6;

type TileType = "term" | "definition";
type TileStatus = "idle" | "selected" | "matched" | "wrong";

interface Tile {
  id: string;
  pairId: string; // same for the matching term+definition
  content: string;
  type: TileType;
  status: TileStatus;
}

export default function MatchGameScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { flashcardSets, flashcards, fetchFlashcards } = useNotebooksStore();

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef(Date.now());

  const set = flashcardSets.find((s) => s.id === setId);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const load = async () => {
    await fetchFlashcards(setId);
    const cards = flashcards.filter((c) => c.set_id === setId);

    if (cards.length < 2) {
      Alert.alert("Not enough cards", "Add at least 2 flashcards to play.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    const pairs = shuffle(cards).slice(0, MAX_PAIRS);
    setTotalPairs(pairs.length);

    const allTiles: Tile[] = [];
    pairs.forEach((card) => {
      allTiles.push({
        id: `term-${card.id}`,
        pairId: card.id,
        content: card.front,
        type: "term",
        status: "idle",
      });
      allTiles.push({
        id: `def-${card.id}`,
        pairId: card.id,
        content: card.back,
        type: "definition",
        status: "idle",
      });
    });

    setTiles(shuffle(allTiles));
    setIsLoading(false);
    setIsRunning(true);
    sessionStart.current = Date.now();
  };

  const handleTilePress = (tile: Tile) => {
    if (tile.status === "matched" || tile.status === "selected") return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!selectedTile) {
      // First selection
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, status: "selected" } : t))
      );
      setSelectedTile(tile);
      return;
    }

    if (selectedTile.id === tile.id) {
      // Tapped same tile — deselect
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, status: "idle" } : t))
      );
      setSelectedTile(null);
      return;
    }

    // Check for a match
    const isMatch =
      selectedTile.pairId === tile.pairId &&
      selectedTile.type !== tile.type;

    if (isMatch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newMatchedCount = matchedCount + 1;

      setTiles((prev) =>
        prev.map((t) =>
          t.pairId === tile.pairId
            ? { ...t, status: "matched" }
            : t
        )
      );
      setSelectedTile(null);
      setMatchedCount(newMatchedCount);

      if (newMatchedCount >= totalPairs) {
        setIsRunning(false);
        setTimeout(async () => {
          if (user && set) {
            await db.studySessions.create({
              user_id: user.id,
              flashcard_set_id: setId,
              mode: "match",
              cards_studied: totalPairs,
              correct_count: totalPairs,
              session_duration: Math.round(
                (Date.now() - sessionStart.current) / 1000
              ),
              completed_at: new Date().toISOString(),
            });
          }
          setIsComplete(true);
        }, 600);
      }
    } else {
      // Wrong match
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes((m) => m + 1);

      setTiles((prev) =>
        prev.map((t) =>
          t.id === tile.id || t.id === selectedTile.id
            ? { ...t, status: "wrong" }
            : t
        )
      );

      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) =>
            t.status === "wrong" ? { ...t, status: "idle" } : t
          )
        );
        setSelectedTile(null);
      }, 700);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Setting up match game..." />
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const perfect = mistakes === 0;
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Colors.bg.primary, "#0D0D20"]}
          style={styles.completeScreen}
        >
          <Text style={styles.completeEmoji}>{perfect ? "⚡" : "🎯"}</Text>
          <Text style={styles.completeTitle}>
            {perfect ? "Flawless!" : "Matched!"}
          </Text>
          <Text style={styles.completeSubtitle}>
            {perfect
              ? "Zero mistakes. That's a clean run."
              : `${totalPairs} pairs matched in ${formatTime(elapsedSeconds)}.`}
          </Text>

          <View style={styles.statsRow}>
            <StatTile
              label="Time"
              value={formatTime(elapsedSeconds)}
              icon="time-outline"
              color={Colors.brand[400]}
            />
            <StatTile
              label="Pairs"
              value={String(totalPairs)}
              icon="layers-outline"
              color={Colors.gold[500]}
            />
            <StatTile
              label="Mistakes"
              value={String(mistakes)}
              icon="close-circle-outline"
              color={mistakes === 0 ? Colors.success : Colors.error}
            />
          </View>

          <View style={styles.completeActions}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setIsComplete(false);
                setMatchedCount(0);
                setMistakes(0);
                setElapsedSeconds(0);
                setSelectedTile(null);
                setIsLoading(true);
                load();
              }}
            >
              <Ionicons name="refresh" size={18} color={Colors.brand[400]} />
              <Text style={styles.retryText}>Play again</Text>
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

  const activeTiles = tiles.filter((t) => t.status !== "matched");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Quit game?", "", [
              { text: "Keep playing", style: "cancel" },
              { text: "Quit", style: "destructive", onPress: () => router.back() },
            ])
          }
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.setName} numberOfLines={1}>{set?.title}</Text>
        </View>

        <View style={styles.timerChip}>
          <Ionicons name="time-outline" size={14} color={Colors.brand[400]} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar
        progress={totalPairs > 0 ? matchedCount / totalPairs : 0}
        color={Colors.success}
        height={4}
        style={{ paddingHorizontal: 20 }}
      />

      {/* Instruction */}
      <View style={styles.instruction}>
        <Text style={styles.instructionText}>
          Tap a term, then tap its matching definition
        </Text>
        <Text style={styles.pairsLeft}>
          {totalPairs - matchedCount} left
        </Text>
      </View>

      {/* Tile grid */}
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <MatchTile
            key={tile.id}
            tile={tile}
            onPress={() => handleTilePress(tile)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function MatchTile({
  tile,
  onPress,
}: {
  tile: Tile;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (tile.status === "matched") {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(0.85, { duration: 400 });
    } else if (tile.status === "wrong") {
      scale.value = withSequence(
        withTiming(1.04, { duration: 80 }),
        withTiming(0.96, { duration: 80 }),
        withSpring(1)
      );
    } else if (tile.status === "selected") {
      scale.value = withSpring(1.03);
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [tile.status]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getBorderColor = () => {
    if (tile.status === "selected") return Colors.brand[500];
    if (tile.status === "matched") return Colors.success;
    if (tile.status === "wrong") return Colors.error;
    return Colors.border.primary;
  };

  const getBg = () => {
    if (tile.status === "selected") return "rgba(124, 58, 237, 0.12)";
    if (tile.status === "matched") return "rgba(16, 185, 129, 0.1)";
    if (tile.status === "wrong") return "rgba(244, 63, 94, 0.1)";
    return Colors.surface.primary;
  };

  const TILE_WIDTH = (SCREEN_WIDTH - 52) / 2;

  return (
    <Animated.View style={[{ width: TILE_WIDTH }, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        disabled={tile.status === "matched"}
        style={[
          styles.tile,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBg(),
          },
        ]}
      >
        <Text style={styles.tileTypeLabel}>
          {tile.type === "term" ? "Term" : "Def."}
        </Text>
        <Text style={styles.tileContent} numberOfLines={4}>
          {tile.content}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  },
  setName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.brand[400],
    fontVariant: ["tabular-nums"],
  },
  instruction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    flex: 1,
  },
  pairsLeft: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  tile: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 90,
    justifyContent: "space-between",
    gap: 6,
  },
  tileTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.tertiary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  tileContent: {
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 19,
    fontWeight: "500",
  },

  // Complete screen
  completeScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 28,
  },
  completeEmoji: { fontSize: 64 },
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  completeActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
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
