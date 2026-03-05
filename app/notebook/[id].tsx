import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useNotebooksStore } from "@/store/notebooks";
import { useAuthStore } from "@/store/auth";
import { FlashCardSetCard } from "@/components/flashcard/FlashCardSetCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  generateFlashcardsFromNote,
  summarizeNote,
  chatWithNotes,
  importPDFNote,
} from "@/lib/claude";
import { db } from "@/lib/supabase";
import type { ChatMessage, Note } from "@/types";

type TabType = "notes" | "flashcards" | "chat";

const COLOR_GRADIENTS: Record<string, [string, string]> = {
  violet: ["#7C3AED", "#4F46E5"],
  blue: ["#3B82F6", "#2563EB"],
  emerald: ["#10B981", "#059669"],
  rose: ["#F43F5E", "#E11D48"],
  amber: ["#F59E0B", "#D97706"],
  cyan: ["#06B6D4", "#0891B2"],
};

export default function NotebookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    notebooks,
    notes,
    flashcardSets,
    fetchNotes,
    fetchFlashcardSets,
    createNote,
    updateNote,
    deleteNote,
    createFlashcardSet,
    createFlashcards,
  } = useNotebooksStore();

  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [isLoading, setIsLoading] = useState(true);

  // Note editing state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPDFImporting, setIsPDFImporting] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const notebook = notebooks.find((n) => n.id === id);
  const gradientColors = notebook
    ? COLOR_GRADIENTS[notebook.color] || COLOR_GRADIENTS.violet
    : (Colors.gradients.brand as [string, string]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchNotes(id), fetchFlashcardSets(id)]);
    setIsLoading(false);

    // Load chat history
    const { data } = await db.chatMessages.list(id);
    if (data) setChatMessages(data as unknown as ChatMessage[]);
  };

  // ─── Notes ──────────────────────────────────────────────────────────────────
  const handleCreateNote = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() && !noteTitle.trim()) return;

    const wordCount = noteContent.trim().split(/\s+/).filter(Boolean).length;

    if (editingNote) {
      await updateNote(editingNote.id, {
        title: noteTitle || "Untitled Note",
        content: noteContent,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      });
    } else {
      await createNote({
        notebook_id: id,
        title: noteTitle || "Untitled Note",
        content: noteContent,
        ai_summary: null,
        source_type: "text",
        source_url: null,
        word_count: wordCount,
      });
    }
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert("Delete Note", `Delete "${note.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteNote(note.id),
      },
    ]);
  };

  // ─── AI: Generate Flashcards ─────────────────────────────────────────────────
  const handleGenerateFlashcards = async (note: Note) => {
    setIsGeneratingFlashcards(true);
    try {
      const generated = await generateFlashcardsFromNote(
        note.content,
        note.title,
        15
      );

      // Create flashcard set
      const set = await createFlashcardSet({
        notebookId: id,
        title: `${note.title} – Flashcards`,
        description: `Auto-generated from "${note.title}"`,
      });

      if (!set) throw new Error("Failed to create flashcard set");

      // Insert cards
      await createFlashcards(
        generated.map((c) => ({
          set_id: set.id,
          front: c.front,
          back: c.back,
          hint: c.hint || null,
          difficulty: c.difficulty,
        }))
      );

      setActiveTab("flashcards");
      Alert.alert(
        "✨ Flashcards Generated!",
        `Created ${generated.length} flashcards from "${note.title}"`
      );
    } catch (err) {
      Alert.alert("Error", "Failed to generate flashcards. Check your API key.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // ─── AI: Summarize Note ──────────────────────────────────────────────────────
  const handleSummarize = async (note: Note) => {
    if (note.content.trim().length < 50) {
      Alert.alert("Too short", "Add more content before summarizing.");
      return;
    }
    setIsSummarizing(true);
    try {
      const summary = await summarizeNote(note.content, note.title);
      await updateNote(note.id, { ai_summary: summary });
    } catch {
      Alert.alert("Error", "Failed to summarize. Check your API key.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // ─── PDF Import ──────────────────────────────────────────────────────────────
  const handleImportPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setIsPDFImporting(true);

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Claude — it extracts text and suggests a title
      const { title, content } = await importPDFNote(
        base64,
        file.name || "document.pdf"
      );

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

      await createNote({
        notebook_id: id,
        title,
        content,
        ai_summary: null,
        source_type: "pdf",
        source_url: null,
        word_count: wordCount,
      });

      Alert.alert(
        "PDF Imported ✓",
        `"${title}" has been added to your notes.`
      );
    } catch (err) {
      Alert.alert(
        "Import failed",
        "Couldn't import the PDF. Make sure your API key is set and try again."
      );
    } finally {
      setIsPDFImporting(false);
    }
  };

  // ─── AI: Chat ───────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      notebook_id: id,
      role: "user",
      content: chatInput.trim(),
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const question = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Build context from all notes
      const notesContext = notes
        .map((n) => `## ${n.title}\n${n.content}`)
        .join("\n\n---\n\n");

      const response = await chatWithNotes(question, notesContext, chatMessages);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        notebook_id: id,
        role: "assistant",
        content: response,
        created_at: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      // Save to DB
      await db.chatMessages.insert({ notebook_id: id, role: "user", content: question });
      await db.chatMessages.insert({ notebook_id: id, role: "assistant", content: response });
    } catch {
      Alert.alert("Error", "Failed to get AI response. Check your API key.");
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!notebook) {
    return <LoadingSpinner fullScreen />;
  }

  // ─── Note Editor Mode ────────────────────────────────────────────────────────
  if (editingNote !== null || (noteTitle !== "" || noteContent !== "")) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity
              onPress={() => {
                setEditingNote(null);
                setNoteTitle("");
                setNoteContent("");
              }}
              style={styles.backBtn}
            >
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.editorTitle}>
              {editingNote ? "Edit Note" : "New Note"}
            </Text>
            <TouchableOpacity
              onPress={handleSaveNote}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.noteTitleInput}
              placeholder="Note title..."
              placeholderTextColor={Colors.text.tertiary}
              value={noteTitle}
              onChangeText={setNoteTitle}
              multiline={false}
              returnKeyType="next"
            />
            <TextInput
              style={styles.noteContentInput}
              placeholder="Start typing your notes here..."
              placeholderTextColor={Colors.text.tertiary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
              autoFocus={!editingNote}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Notebook Header */}
      <LinearGradient
        colors={[`${gradientColors[0]}30`, "transparent"]}
        style={styles.notebookHeader}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notebookInfo}>
          <LinearGradient
            colors={gradientColors}
            style={styles.notebookEmoji}
          >
            <Text style={{ fontSize: 28 }}>{notebook.emoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.notebookTitle}>{notebook.title}</Text>
            {notebook.description && (
              <Text style={styles.notebookDesc} numberOfLines={2}>
                {notebook.description}
              </Text>
            )}
            <View style={styles.notebookStats}>
              <Badge label={`${notes.length} notes`} variant="neutral" size="sm" />
              <Badge label={`${flashcardSets.length} sets`} variant="neutral" size="sm" />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["notes", "flashcards", "chat"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "notes"
                ? "📝 Notes"
                : tab === "flashcards"
                ? "⚡ Flashcards"
                : "💬 AI Chat"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading..." />
      ) : activeTab === "notes" ? (
        <NotesList
          notes={notes}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          onGenerateFlashcards={handleGenerateFlashcards}
          onSummarize={handleSummarize}
          onAddNote={handleCreateNote}
          isGeneratingFlashcards={isGeneratingFlashcards}
          isSummarizing={isSummarizing}
          onImportPDF={handleImportPDF}
          isImportingPDF={isPDFImporting}
        />
      ) : activeTab === "flashcards" ? (
        <FlashcardsList
          sets={flashcardSets}
          router={router}
          notebookId={id}
          onCreateSet={async () => {
            const set = await createFlashcardSet({
              notebookId: id,
              title: "New Set",
            });
            if (set) router.push(`/flashcards/${set.id}`);
          }}
        />
      ) : (
        <ChatTab
          messages={chatMessages}
          input={chatInput}
          onInputChange={setChatInput}
          onSend={handleSendMessage}
          isLoading={isChatLoading}
          scrollRef={chatScrollRef}
          hasNotes={notes.length > 0}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function NotesList({
  notes,
  onEdit,
  onDelete,
  onGenerateFlashcards,
  onSummarize,
  onAddNote,
  isGeneratingFlashcards,
  isSummarizing,
  onImportPDF,
  isImportingPDF,
}: {
  notes: Note[];
  onEdit: (n: Note) => void;
  onDelete: (n: Note) => void;
  onGenerateFlashcards: (n: Note) => void;
  onSummarize: (n: Note) => void;
  onAddNote: () => void;
  isGeneratingFlashcards: boolean;
  isSummarizing: boolean;
  onImportPDF: () => void;
  isImportingPDF: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      {/* Quick action bar — always visible */}
      <View style={styles.noteActionsBar}>
        <TouchableOpacity style={styles.noteActionBarBtn} onPress={onAddNote}>
          <Ionicons name="create-outline" size={15} color={Colors.text.primary} />
          <Text style={styles.noteActionBarText}>New Note</Text>
        </TouchableOpacity>
        <View style={styles.noteActionBarDivider} />
        <TouchableOpacity
          style={styles.noteActionBarBtn}
          onPress={onImportPDF}
          disabled={isImportingPDF}
        >
          <Ionicons
            name="document-attach-outline"
            size={15}
            color={Colors.gold[400]}
          />
          <Text style={[styles.noteActionBarText, { color: Colors.gold[400] }]}>
            {isImportingPDF ? "Importing..." : "Import PDF"}
          </Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No notes yet"
          description="Write a note or import a PDF to get started"
        />
      ) : (
        <>
          <FlatList
            data={notes}
            keyExtractor={(n) => n.id}
            contentContainerStyle={styles.notesList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <TouchableOpacity
                  onPress={() => onEdit(item)}
                  style={styles.noteContent}
                >
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.notePreview} numberOfLines={3}>
                    {item.content}
                  </Text>
                  {item.ai_summary && (
                    <View style={styles.summaryContainer}>
                      <Text style={styles.summaryLabel}>✨ AI Summary</Text>
                      <Text style={styles.summaryText} numberOfLines={3}>
                        {item.ai_summary}
                      </Text>
                    </View>
                  )}
                  <View style={styles.noteMeta}>
                    <Text style={styles.noteMetaText}>{item.word_count} words</Text>
                    {item.source_type === "pdf" && (
                      <View style={styles.pdfBadge}>
                        <Ionicons
                          name="document-attach"
                          size={10}
                          color={Colors.gold[500]}
                        />
                        <Text style={styles.pdfBadgeText}>PDF</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* AI Actions */}
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.noteAction}
                    onPress={() => onGenerateFlashcards(item)}
                    disabled={isGeneratingFlashcards}
                  >
                    <Ionicons name="flash" size={14} color={Colors.gold[500]} />
                    <Text style={[styles.noteActionText, { color: Colors.gold[500] }]}>
                      {isGeneratingFlashcards ? "Generating..." : "Make Cards"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.noteAction}
                    onPress={() => onSummarize(item)}
                    disabled={isSummarizing}
                  >
                    <Ionicons name="sparkles" size={14} color={Colors.brand[400]} />
                    <Text style={[styles.noteActionText, { color: Colors.brand[400] }]}>
                      {isSummarizing ? "Summarizing..." : "Summarize"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.noteAction}
                    onPress={() => onDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={styles.fab} onPress={onAddNote}>
            <LinearGradient
              colors={Colors.gradients.brand}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function FlashcardsList({
  sets,
  router,
  notebookId,
  onCreateSet,
}: {
  sets: any[];
  router: ReturnType<typeof useRouter>;
  notebookId: string;
  onCreateSet: () => void;
}) {
  if (sets.length === 0) {
    return (
      <EmptyState
        emoji="⚡"
        title="No flashcard sets"
        description="Add notes and use AI to auto-generate flashcards, or create a set manually"
        actionLabel="Create Set"
        onAction={onCreateSet}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sets}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.notesList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <FlashCardSetCard
            set={item}
            onPress={() => router.push(`/flashcards/${item.id}`)}
            onStudy={() =>
              router.push(`/flashcards/study/${item.id}`)
            }
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={onCreateSet}>
        <LinearGradient
          colors={Colors.gradients.brand}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function ChatTab({
  messages,
  input,
  onInputChange,
  onSend,
  isLoading,
  scrollRef,
  hasNotes,
}: {
  messages: ChatMessage[];
  input: string;
  onInputChange: (t: string) => void;
  onSend: () => void;
  isLoading: boolean;
  scrollRef: React.RefObject<ScrollView>;
  hasNotes: boolean;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {!hasNotes ? (
        <EmptyState
          emoji="💬"
          title="Add notes first"
          description="AI chat works best when you have notes in this notebook for context"
        />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.length === 0 && (
              <View style={styles.chatWelcome}>
                <Text style={styles.chatWelcomeEmoji}>✨</Text>
                <Text style={styles.chatWelcomeTitle}>
                  Ask me anything about your notes
                </Text>
                <Text style={styles.chatWelcomeDesc}>
                  I have full context of all your notes in this notebook
                </Text>
              </View>
            )}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={
                  msg.role === "user" ? styles.userMsgRow : styles.assistantMsgRow
                }
              >
                {msg.role === "assistant" && (
                  <View style={styles.chatAvatar}>
                    <Text style={{ fontSize: 14 }}>✨</Text>
                  </View>
                )}
                <View
                  style={
                    msg.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble
                  }
                >
                  <Text
                    style={
                      msg.role === "user"
                        ? styles.userBubbleText
                        : styles.assistantBubbleText
                    }
                  >
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
            {isLoading && (
              <View style={styles.assistantMsgRow}>
                <View style={styles.chatAvatar}>
                  <Text style={{ fontSize: 14 }}>✨</Text>
                </View>
                <View style={styles.assistantBubble}>
                  <Text style={styles.typingIndicator}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about your notes..."
              placeholderTextColor={Colors.text.tertiary}
              value={input}
              onChangeText={onInputChange}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
            <TouchableOpacity
              onPress={onSend}
              disabled={!input.trim() || isLoading}
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={Colors.gradients.brand}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  notebookHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  notebookInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  notebookEmoji: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notebookTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  notebookDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  notebookStats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.brand[500],
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: Colors.brand[400],
  },
  notesList: {
    padding: 20,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden",
  },
  noteContent: {
    padding: 16,
    gap: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  notePreview: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    gap: 4,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.brand[400],
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  noteMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 4,
  },
  noteMetaText: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  pdfBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pdfBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.gold[500],
    letterSpacing: 0.5,
  },
  noteActionsBar: {
    flexDirection: "row" as const,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden" as const,
  },
  noteActionBarBtn: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 12,
  },
  noteActionBarDivider: {
    width: 1,
    backgroundColor: Colors.border.primary,
  },
  noteActionBarText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
    padding: 10,
  },
  noteAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    shadowColor: Colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  // Editor
  editorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  editorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.brand[500],
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
  editorContent: {
    padding: 20,
    flexGrow: 1,
    gap: 12,
  },
  noteTitleInput: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  noteContentInput: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 26,
    minHeight: 400,
    paddingTop: 8,
  },

  // Chat
  chatContent: {
    padding: 20,
    paddingBottom: 16,
    gap: 0,
  },
  chatWelcome: {
    alignItems: "center",
    padding: 32,
    gap: 10,
  },
  chatWelcomeEmoji: {
    fontSize: 40,
  },
  chatWelcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
  },
  chatWelcomeDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  userMsgRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  assistantMsgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  chatAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  userBubble: {
    backgroundColor: Colors.brand[500],
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "80%",
  },
  userBubbleText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  assistantBubble: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
  },
  assistantBubbleText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  typingIndicator: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.bg.secondary,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    maxHeight: 120,
  },
  sendButton: {},
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
