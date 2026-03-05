import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/supabase";
import type { FlashcardSet } from "@/types";

const STUDY_MODES = [
  {
    id: "flashcard",
    name: "Flashcards",
    description: "Flip through cards at your own pace",
    emoji: "🃏",
    color: Colors.brand[500],
    bgColor: "rgba(124, 58, 237, 0.1)",
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  {
    id: "learn",
    name: "Learn",
    description: "Adaptive learning with spaced repetition",
    emoji: "🧠",
    color: Colors.gold[500],
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  {
    id: "test",
    name: "Test",
    description: "Multiple choice quiz from your cards",
    emoji: "📝",
    color: Colors.success,
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  {
    id: "match",
    name: "Match",
    description: "Match terms with their definitions",
    emoji: "🎯",
    color: "#06B6D4",
    bgColor: "rgba(6, 182, 212, 0.1)",
    borderColor: "rgba(6, 182, 212, 0.2)",
  },
];

export default function StudyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notebooks, fetchNotebooks } = useNotebooksStore();

  const [selectedMode, setSelectedMode] = useState("flashcard");
  const [expandedNotebook, setExpandedNotebook] = useState<string | null>(null);
  const [notebookSetsMap, setNotebookSetsMap] = useState<Record<string, FlashcardSet[]>>({});
  const [loadingSetId, setLoadingSetId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchNotebooks(user.id);
  }, [user]);

  const handleNotebookPress = async (notebookId: string) => {
    // Collapse if already open
    if (expandedNotebook === notebookId) {
      setExpandedNotebook(null);
      return;
    }

    setExpandedNotebook(notebookId);

    // Fetch sets for this notebook if we haven't already
    if (!notebookSetsMap[notebookId]) {
      setLoadingSetId(notebookId);
      const { data } = await db.flashcardSets.list(notebookId);
      setNotebookSetsMap((prev) => ({
        ...prev,
        [notebookId]: (data as unknown as FlashcardSet[]) || [],
      }));
      setLoadingSetId(null);
    }
  };

  const handleSetPress = (setId: string) => {
    switch (selectedMode) {
      case "flashcard":
      case "learn":
        router.push(`/flashcards/study/${setId}`);
        break;
      case "test":
        router.push(`/quiz/${setId}`);
        break;
      case "match":
        router.push(`/flashcards/match/${setId}`);
        break;
    }
  };

  const selectedModeData = STUDY_MODES.find((m) => m.id === selectedMode);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Study Hub</Text>
          <Badge label="Beta" variant="brand" />
        </View>

        {/* Study Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Study Mode</Text>
          <View style={styles.modeGrid}>
            {STUDY_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setSelectedMode(mode.id)}
                activeOpacity={0.85}
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && styles.modeCardSelected,
                  {
                    borderColor:
                      selectedMode === mode.id
                        ? mode.color
                        : Colors.border.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeIcon,
                    {
                      backgroundColor: mode.bgColor,
                      borderColor: mode.borderColor,
                    },
                  ]}
                >
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDesc} numberOfLines={2}>
                  {mode.description}
                </Text>
                {selectedMode === mode.id && (
                  <View
                    style={[
                      styles.selectedDot,
                      { backgroundColor: mode.color },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notebook + Set Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pick a Set</Text>
            {selectedModeData && (
              <View style={styles.modePill}>
                <Text style={styles.modePillEmoji}>{selectedModeData.emoji}</Text>
                <Text style={[styles.modePillText, { color: selectedModeData.color }]}>
                  {selectedModeData.name}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionHint}>
            Tap a notebook to see its flashcard sets
          </Text>

          {notebooks.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyNotebooks}
              onPress={() => router.push("/notebook/new")}
            >
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={Colors.brand[400]}
              />
              <Text style={styles.emptyText}>Create a notebook to study</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.notebookList}>
              {notebooks.map((nb) => {
                const isExpanded = expandedNotebook === nb.id;
                const sets = notebookSetsMap[nb.id];
                const isLoadingSets = loadingSetId === nb.id;

                return (
                  <View key={nb.id} style={styles.notebookGroup}>
                    {/* Notebook header row */}
                    <TouchableOpacity
                      style={[
                        styles.notebookItem,
                        isExpanded && styles.notebookItemExpanded,
                      ]}
                      onPress={() => handleNotebookPress(nb.id)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.notebookEmoji,
                          {
                            backgroundColor: `${
                              Colors.notebook[
                                nb.color as keyof typeof Colors.notebook
                              ]
                            }20`,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{nb.emoji}</Text>
                      </View>
                      <View style={styles.notebookInfo}>
                        <Text style={styles.notebookTitle}>{nb.title}</Text>
                        <Text style={styles.notebookMeta}>
                          {nb.flashcard_count ?? 0} cards
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Colors.text.tertiary}
                      />
                    </TouchableOpacity>

                    {/* Expanded flashcard sets */}
                    {isExpanded && (
                      <View style={styles.setsContainer}>
                        {isLoadingSets ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.brand[400]}
                            style={{ paddingVertical: 20 }}
                          />
                        ) : !sets || sets.length === 0 ? (
                          <View style={styles.noSetsMsg}>
                            <Text style={styles.noSetsMsgText}>
                              No flashcard sets yet — open the notebook and
                              generate some from your notes
                            </Text>
                            <TouchableOpacity
                              style={styles.goToNotebookBtn}
                              onPress={() => router.push(`/notebook/${nb.id}`)}
                            >
                              <Text style={styles.goToNotebookText}>
                                Open Notebook →
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          sets.map((set, index) => (
                            <TouchableOpacity
                              key={set.id}
                              style={[
                                styles.setItem,
                                index === 0 && { borderTopWidth: 0 },
                              ]}
                              onPress={() => handleSetPress(set.id)}
                              activeOpacity={0.85}
                            >
                              <View style={styles.setModeIcon}>
                                <Text style={{ fontSize: 16 }}>
                                  {selectedMode === "flashcard"
                                    ? "🃏"
                                    : selectedMode === "learn"
                                    ? "🧠"
                                    : selectedMode === "test"
                                    ? "📝"
                                    : "🎯"}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.setTitle} numberOfLines={1}>
                                  {set.title}
                                </Text>
                                <Text style={styles.setMeta}>
                                  {set.card_count} cards
                                </Text>
                              </View>
                              <View style={styles.setStartBtn}>
                                <Text style={styles.setStartText}>Start</Text>
                                <Ionicons
                                  name="arrow-forward"
                                  size={12}
                                  color={Colors.brand[400]}
                                />
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Study Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Study Science 🔬</Text>
          <View style={styles.tipsGrid}>
            <TipCard
              icon="🔄"
              title="Spaced Repetition"
              desc="Review at increasing intervals for maximum retention"
            />
            <TipCard
              icon="✏️"
              title="Active Recall"
              desc="Testing yourself beats re-reading every time"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipCardIcon}>{icon}</Text>
      <Text style={styles.tipCardTitle}>{title}</Text>
      <Text style={styles.tipCardDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: -8,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modePillEmoji: {
    fontSize: 12,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modeCard: {
    width: "47%",
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 8,
    position: "relative",
  },
  modeCardSelected: {
    backgroundColor: Colors.surface.secondary,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  modeDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  selectedDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyNotebooks: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  notebookList: {
    gap: 8,
  },
  notebookGroup: {
    borderRadius: 12,
    overflow: "hidden",
  },
  notebookItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  notebookItemExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  notebookEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notebookInfo: {
    flex: 1,
  },
  notebookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  notebookMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  setsContainer: {
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  noSetsMsg: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  noSetsMsgText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  goToNotebookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  goToNotebookText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.brand[400],
  },
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  setModeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  setTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  setMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  setStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  setStartText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.brand[400],
  },
  tipsSection: {
    gap: 14,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  tipsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  tipCard: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 6,
  },
  tipCardIcon: {
    fontSize: 24,
  },
  tipCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  tipCardDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
});
