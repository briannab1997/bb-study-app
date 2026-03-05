import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import type { ChatMessage as ChatMessageType } from "@/types";
import { format } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = format(new Date(message.created_at), "h:mm a");

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <LinearGradient
          colors={Colors.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.userBubble}
        >
          <Text style={styles.userText}>{message.content}</Text>
        </LinearGradient>
        <Text style={styles.time}>{time}</Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>✨</Text>
      </View>
      <View style={styles.assistantContent}>
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>{message.content}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

// Typing indicator
export function TypingIndicator() {
  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>✨</Text>
      </View>
      <View style={styles.typingBubble}>
        <Text style={styles.typingDots}>· · ·</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  assistantRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
  },
  assistantContent: {
    flex: 1,
    gap: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: "90%",
  },
  assistantText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  time: {
    fontSize: 11,
    color: Colors.text.tertiary,
    paddingHorizontal: 4,
  },
  typingBubble: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  typingDots: {
    fontSize: 18,
    color: Colors.text.tertiary,
    letterSpacing: 4,
  },
});
