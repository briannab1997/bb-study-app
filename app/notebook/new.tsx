import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Config } from "@/constants/config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import type { NotebookColor } from "@/types";

const COLOR_GRADIENTS: Record<NotebookColor, [string, string]> = {
  violet: ["#7C3AED", "#4F46E5"],
  blue: ["#3B82F6", "#2563EB"],
  emerald: ["#10B981", "#059669"],
  rose: ["#F43F5E", "#E11D48"],
  amber: ["#F59E0B", "#D97706"],
  cyan: ["#06B6D4", "#0891B2"],
};

export default function NewNotebookScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createNotebook } = useNotebooksStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<NotebookColor>("violet");
  const [selectedEmoji, setSelectedEmoji] = useState("📚");
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) {
      setTitleError("Notebook name is required");
      return;
    }
    if (!user) return;

    setIsLoading(true);
    const notebook = await createNotebook({
      userId: user.id,
      title: title.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      emoji: selectedEmoji,
    });
    setIsLoading(false);

    if (notebook) {
      router.replace(`/notebook/${notebook.id}`);
    } else {
      Alert.alert("Error", "Failed to create notebook. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Notebook</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View style={styles.previewSection}>
          <LinearGradient
            colors={COLOR_GRADIENTS[selectedColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.preview}
          >
            <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {title || "Notebook Name"}
            </Text>
          </LinearGradient>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Notebook Name *"
            placeholder="e.g., Biology 101, Spanish Vocab..."
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (t) setTitleError("");
            }}
            error={titleError}
            leftIcon="book-outline"
            autoFocus
            maxLength={60}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description (optional)</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="What will you be studying?"
                placeholderTextColor={Colors.text.tertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {Config.notebookColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={styles.colorOption}
                >
                  <LinearGradient
                    colors={COLOR_GRADIENTS[color]}
                    style={[
                      styles.colorDot,
                      selectedColor === color && styles.colorDotSelected,
                    ]}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Emoji Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.emojiGrid}>
              {Config.notebookEmojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Create Button */}
        <Button
          label="Create Notebook"
          onPress={handleCreate}
          isLoading={isLoading}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
    paddingBottom: 40,
  },
  previewSection: {
    alignItems: "center",
  },
  preview: {
    width: 160,
    height: 120,
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  textAreaContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    padding: 14,
    minHeight: 90,
  },
  textArea: {
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 60,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    padding: 2,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOptionSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderColor: Colors.brand[500],
  },
  emojiOptionText: {
    fontSize: 22,
  },
});
