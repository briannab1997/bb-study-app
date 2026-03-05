import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import type { Notebook } from "@/types";

const COLOR_MAP: Record<string, [string, string]> = {
  violet: ["#7C3AED", "#4F46E5"],
  blue: ["#3B82F6", "#2563EB"],
  emerald: ["#10B981", "#059669"],
  rose: ["#F43F5E", "#E11D48"],
  amber: ["#F59E0B", "#D97706"],
  cyan: ["#06B6D4", "#0891B2"],
};

interface NotebookCardProps {
  notebook: Notebook;
  onPress: () => void;
  onLongPress?: () => void;
  compact?: boolean;
}

export function NotebookCard({
  notebook,
  onPress,
  onLongPress,
  compact = false,
}: NotebookCardProps) {
  const colors = COLOR_MAP[notebook.color] || COLOR_MAP.violet;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.85}
        style={styles.compactCard}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactEmoji}
        >
          <Text style={styles.emojiText}>{notebook.emoji}</Text>
        </LinearGradient>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {notebook.title}
          </Text>
          <Text style={styles.compactMeta}>
            {notebook.note_count ?? 0} notes
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.text.tertiary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[Colors.surface.secondary, Colors.surface.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Color accent bar */}
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emojiContainer}
          >
            <Text style={styles.emoji}>{notebook.emoji}</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <Text style={styles.title} numberOfLines={2}>
          {notebook.title}
        </Text>
        {notebook.description && (
          <Text style={styles.description} numberOfLines={2}>
            {notebook.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={Colors.text.tertiary}
            />
            <Text style={styles.statText}>
              {notebook.note_count ?? 0} notes
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons
              name="layers-outline"
              size={14}
              color={Colors.text.tertiary}
            />
            <Text style={styles.statText}>
              {notebook.flashcard_count ?? 0} cards
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden",
    position: "relative",
    minHeight: 160,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    marginTop: 8,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 16,
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },

  // Compact styles
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  compactEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  compactContent: {
    flex: 1,
    gap: 2,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  compactMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});
