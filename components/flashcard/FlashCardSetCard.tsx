import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import type { FlashcardSet } from "@/types";

interface FlashCardSetCardProps {
  set: FlashcardSet;
  onPress: () => void;
  onStudy: () => void;
  dueCount?: number;
}

export function FlashCardSetCard({
  set,
  onPress,
  onStudy,
  dueCount = 0,
}: FlashCardSetCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Ionicons name="layers" size={20} color={Colors.brand[400]} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {set.title}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{set.card_count ?? 0} cards</Text>
            {dueCount > 0 && (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.dueText}>{dueCount} due</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onStudy();
        }}
        style={styles.studyButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.studyText}>Study</Text>
        <Ionicons name="play" size={12} color={Colors.brand[400]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  dot: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  dueText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: "600",
  },
  studyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  studyText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.brand[400],
  },
});
