import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import { NotebookCard } from "@/components/notebook/NotebookCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Notebook } from "@/types";

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notebooks, fetchNotebooks, deleteNotebook, isLoading } = useNotebooksStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = notebooks.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description?.toLowerCase().includes(search.toLowerCase())
  );

  const loadData = async () => {
    if (user) await fetchNotebooks(user.id);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLongPress = (notebook: Notebook) => {
    Alert.alert(notebook.title, "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Notebook",
            `Are you sure you want to delete "${notebook.title}"? This cannot be undone.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteNotebook(notebook.id),
              },
            ]
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/notebook/new")}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.text.tertiary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notebooks..."
            placeholderTextColor={Colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
        >
          <Ionicons
            name={viewMode === "grid" ? "list-outline" : "grid-outline"}
            size={20}
            color={Colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Count */}
      {notebooks.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "notebook" : "notebooks"}
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading && notebooks.length === 0 ? (
        <LoadingSpinner message="Loading your notebooks..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji={search ? "🔍" : "📚"}
          title={search ? "No results found" : "No notebooks yet"}
          description={
            search
              ? `No notebooks match "${search}"`
              : "Create your first notebook to start organizing your studies"
          }
          actionLabel={!search ? "Create Notebook" : undefined}
          onAction={!search ? () => router.push("/notebook/new") : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          numColumns={viewMode === "grid" ? 1 : 1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand[400]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <NotebookCard
              notebook={item}
              onPress={() => router.push(`/notebook/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
              compact={viewMode === "list"}
            />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  viewToggle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  countRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
