import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useNotebooksStore } from "@/store/notebooks";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Flashcard } from "@/types";

export default function FlashcardSetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const { flashcardSets, flashcards, fetchFlashcards, createFlashcards, updateFlashcard, deleteFlashcard, isLoading } =
    useNotebooksStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const set = flashcardSets.find((s) => s.id === setId);
  const setCards = flashcards.filter((c) => c.set_id === setId);

  useEffect(() => {
    fetchFlashcards(setId);
  }, [setId]);

  const handleAddCard = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    await createFlashcards([
      {
        set_id: setId,
        front: newFront.trim(),
        back: newBack.trim(),
        hint: null,
        difficulty: null,
      },
    ]);
    setNewFront("");
    setNewBack("");
    setIsAdding(false);
  };

  const handleDeleteCard = (card: Flashcard) => {
    Alert.alert("Delete Card", "Delete this flashcard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteFlashcard(card.id),
      },
    ]);
  };

  const difficultyColor = (d: string | null | undefined) => {
    if (d === "easy") return Colors.success;
    if (d === "medium") return Colors.warning;
    if (d === "hard") return Colors.error;
    return Colors.text.tertiary;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{set?.title || "Flashcard Set"}</Text>
          <Text style={styles.headerCount}>{setCards.length} cards</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAdding(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Study Button */}
      {setCards.length > 0 && (
        <View style={styles.studyBar}>
          <Button
            label="Study Now"
            onPress={() => router.push(`/flashcards/study/${setId}`)}
            variant="primary"
            fullWidth
            icon={<Ionicons name="play" size={16} color={Colors.white} />}
          />
        </View>
      )}

      {/* Add Card Form */}
      {isAdding && (
        <View style={styles.addForm}>
          <Text style={styles.addFormTitle}>Add Flashcard</Text>
          <TextInput
            style={styles.addInput}
            placeholder="Front (question/term)..."
            placeholderTextColor={Colors.text.tertiary}
            value={newFront}
            onChangeText={setNewFront}
            multiline
          />
          <TextInput
            style={styles.addInput}
            placeholder="Back (answer/definition)..."
            placeholderTextColor={Colors.text.tertiary}
            value={newBack}
            onChangeText={setNewBack}
            multiline
          />
          <View style={styles.addFormActions}>
            <Button
              label="Cancel"
              onPress={() => { setIsAdding(false); setNewFront(""); setNewBack(""); }}
              variant="ghost"
              size="sm"
            />
            <Button
              label="Add Card"
              onPress={handleAddCard}
              variant="primary"
              size="sm"
              disabled={!newFront.trim() || !newBack.trim()}
            />
          </View>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading cards..." />
      ) : setCards.length === 0 ? (
        <EmptyState
          emoji="🃏"
          title="No flashcards yet"
          description="Add cards manually or use AI to generate them from your notes"
          actionLabel="Add Card"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <FlatList
          data={setCards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIndex}>#{index + 1}</Text>
                {item.difficulty && (
                  <Badge
                    label={item.difficulty}
                    variant={
                      item.difficulty === "easy"
                        ? "success"
                        : item.difficulty === "hard"
                        ? "error"
                        : "warning"
                    }
                    size="sm"
                  />
                )}
                <TouchableOpacity
                  onPress={() => handleDeleteCard(item)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Front</Text>
                  <Text style={styles.cardFront}>{item.front}</Text>
                </View>
                <LinearGradient
                  colors={Colors.gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardDivider}
                />
                <View style={styles.cardSide}>
                  <Text style={[styles.cardSideLabel, { color: Colors.brand[400] }]}>Back</Text>
                  <Text style={styles.cardBack}>{item.back}</Text>
                </View>
              </View>

              {item.hint && (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintText}>💡 {item.hint}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerCount: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
  },
  studyBar: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addForm: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addInput: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    minHeight: 44,
  },
  addFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.tertiary,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  cardContent: {
    gap: 0,
  },
  cardSide: {
    padding: 14,
    paddingTop: 10,
    gap: 4,
  },
  cardSideLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.tertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardFront: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
    lineHeight: 22,
  },
  cardBack: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
  },
  cardDivider: {
    height: 1,
    marginHorizontal: 14,
    opacity: 0.4,
  },
  hintContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 158, 11, 0.15)",
  },
  hintText: {
    fontSize: 12,
    color: Colors.gold[400],
  },
});
