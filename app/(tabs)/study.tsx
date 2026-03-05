import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  const { notebooks, flashcardSets, fetchNotebooks, fetchFlashcardSets } =
    useNotebooksStore();

  const [selectedMode, setSelectedMode] = useState("flashcard");
  const [dueCount] = useState(0); // TODO: fetch from spaced rep

  useEffect(() => {
    if (user) fetchNotebooks(user.id);
  }, [user]);

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

        {/* Due Cards Banner */}
        {dueCount > 0 && (
          <LinearGradient
            colors={["#1C1040", "#0F0F28"]}
            style={styles.dueBanner}
          >
            <View style={styles.dueLeft}>
              <Text style={styles.dueEmoji}>⚡</Text>
              <View>
                <Text style={styles.dueTitle}>{dueCount} cards due today</Text>
                <Text style={styles.dueSubtitle}>
                  Keep your streak alive!
                </Text>
              </View>
            </View>
            <Button
              label="Review"
              onPress={() => {}}
              variant="primary"
              size="sm"
            />
          </LinearGradient>
        )}

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
                  { borderColor: selectedMode === mode.id ? mode.color : Colors.border.primary },
                ]}
              >
                <View
                  style={[
                    styles.modeIcon,
                    { backgroundColor: mode.bgColor, borderColor: mode.borderColor },
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

        {/* Pick a Notebook */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pick a Notebook to Study
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
              {notebooks.map((nb) => (
                <TouchableOpacity
                  key={nb.id}
                  style={styles.notebookItem}
                  onPress={() => router.push(`/notebook/${nb.id}`)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.notebookEmoji,
                      { backgroundColor: `${Colors.notebook[nb.color as keyof typeof Colors.notebook]}20` },
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
                    name="chevron-forward"
                    size={16}
                    color={Colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
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
  dueBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  dueLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dueEmoji: {
    fontSize: 28,
  },
  dueTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  dueSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 28,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.3,
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
    gap: 10,
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
