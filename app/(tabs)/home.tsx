import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import { NotebookCard } from "@/components/notebook/NotebookCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";

const GREETING = (() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
})();

const STUDY_TIPS = [
  "Spaced repetition improves retention by up to 80%.",
  "Testing yourself is more effective than re-reading.",
  "Short, frequent sessions beat long cramming sessions.",
  "Teaching concepts reinforces your own understanding.",
  "Sleep consolidates memories — study before bed!",
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { notebooks, fetchNotebooks, isLoading } = useNotebooksStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todayGoal] = useState(20); // 20 cards/day goal
  const [todayProgress] = useState(0); // TODO: fetch from sessions
  const tip = STUDY_TIPS[new Date().getDay() % STUDY_TIPS.length];

  const firstName = profile?.full_name?.split(" ")[0] || "Learner";

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

  const recentNotebooks = notebooks.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand[400]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{GREETING},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {firstName[0].toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Goal Card */}
        <LinearGradient
          colors={["#1A1040", "#0F0F28"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goalCard}
        >
          <LinearGradient
            colors={Colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goalAccent}
          />
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalTitle}>Daily Goal</Text>
              <Text style={styles.goalSubtitle}>
                {todayProgress}/{todayGoal} cards studied
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>
                {profile?.streak_days ?? 0} day streak
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={todayGoal > 0 ? todayProgress / todayGoal : 0}
            color={Colors.brand[400]}
            backgroundColor="rgba(124, 58, 237, 0.15)"
            height={8}
            showLabel
            labelPosition="right"
            style={{ marginTop: 12 }}
          />
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatItem
            icon="layers"
            value={notebooks.length}
            label="Notebooks"
            color={Colors.brand[400]}
          />
          <StatItem
            icon="flash"
            value={profile?.total_cards_studied ?? 0}
            label="Cards Studied"
            color={Colors.gold[500]}
          />
          <StatItem
            icon="time"
            value={Math.round((profile?.total_study_time ?? 0) / 60)}
            label="Mins"
            color={Colors.success}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              emoji="📓"
              label="New Notebook"
              color={Colors.brand[500]}
              onPress={() => router.push("/notebook/new")}
            />
            <QuickAction
              emoji="⚡"
              label="Study Now"
              color={Colors.gold[500]}
              onPress={() => router.push("/(tabs)/study")}
            />
            <QuickAction
              emoji="📚"
              label="Library"
              color={Colors.success}
              onPress={() => router.push("/(tabs)/library")}
            />
            <QuickAction
              emoji="📊"
              label="Progress"
              color="#06B6D4"
              onPress={() => router.push("/(tabs)/profile")}
            />
          </View>
        </View>

        {/* Recent Notebooks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notebooks</Text>
            {notebooks.length > 3 && (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/library")}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentNotebooks.length === 0 ? (
            <EmptyState
              emoji="📚"
              title="No notebooks yet"
              description="Create your first notebook to start studying"
              actionLabel="Create Notebook"
              onAction={() => router.push("/notebook/new")}
            />
          ) : (
            <View style={styles.notebookGrid}>
              {recentNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  onPress={() => router.push(`/notebook/${notebook.id}`)}
                  compact
                />
              ))}
            </View>
          )}
        </View>

        {/* Daily Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Badge label="Study Tip" variant="gold" />
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statItem, { borderTopColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  emoji,
  label,
  color,
  onPress,
}: {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickAction} activeOpacity={0.85}>
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: `${color}18`, borderColor: `${color}30` },
        ]}
      >
        <Text style={styles.quickActionEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: "400",
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  notificationBtn: {},
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.brand[400],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },

  // Goal Card
  goalCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    overflow: "hidden",
    position: "relative",
  },
  goalAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.tertiary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gold[400],
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderTopWidth: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.text.tertiary,
  },

  // Sections
  section: {
    marginBottom: 24,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.brand[400],
    fontWeight: "600",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // Notebook Grid
  notebookGrid: {
    gap: 10,
  },

  // Tip Card
  tipCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 10,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
});
