import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { useNotebooksStore } from "@/store/notebooks";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

const ACHIEVEMENTS = [
  { emoji: "🌟", name: "First Note", desc: "Created your first note", unlocked: true },
  { emoji: "⚡", name: "Speed Learner", desc: "Study 50 cards in one session", unlocked: false },
  { emoji: "🔥", name: "On Fire", desc: "7-day study streak", unlocked: false },
  { emoji: "🏆", name: "Champion", desc: "Score 100% on a test", unlocked: false },
  { emoji: "🧠", name: "Knowledge Master", desc: "Study 1000 cards", unlocked: false },
  { emoji: "📚", name: "Bookworm", desc: "Create 10 notebooks", unlocked: false },
];

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { notebooks } = useNotebooksStore();

  const firstName = profile?.full_name?.split(" ")[0] || "Learner";
  const streak = profile?.streak_days ?? 0;
  const totalCards = profile?.total_cards_studied ?? 0;
  const studyTime = Math.round((profile?.total_study_time ?? 0) / 60);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={["#1A1040", "#14142A"]}
          style={styles.profileCard}
        >
          <LinearGradient
            colors={Colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileAccent}
          />
          <View style={styles.profileContent}>
            <LinearGradient
              colors={Colors.gradients.brand}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {firstName[0].toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || "Learner"}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.profileBadges}>
                <Badge label={`🔥 ${streak} streak`} variant="gold" />
                <Badge label="Active Learner" variant="brand" />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            value={notebooks.length}
            label="Notebooks"
            icon="library"
            color={Colors.brand[500]}
          />
          <StatCard
            value={totalCards.toLocaleString()}
            label="Cards Studied"
            icon="flash"
            color={Colors.gold[500]}
          />
          <StatCard
            value={studyTime}
            label="Mins Studied"
            icon="time"
            color={Colors.success}
          />
          <StatCard
            value={`${streak}🔥`}
            label="Day Streak"
            icon="flame"
            color={Colors.error}
          />
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.weekActivity}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
              const hasActivity = [0, 1, 3].includes(i); // Mock data
              const intensity = [0.4, 0.8, 0, 1, 0, 0.3, 0][i];
              return (
                <View key={i} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        height: hasActivity ? `${intensity * 80 + 20}%` : "10%",
                        backgroundColor: hasActivity
                          ? Colors.brand[500]
                          : Colors.surface.tertiary,
                        opacity: hasActivity ? intensity * 0.8 + 0.2 : 1,
                      },
                    ]}
                  />
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Learning Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Goals</Text>
          <View style={styles.goalsCard}>
            <GoalRow
              label="Daily Cards"
              current={0}
              target={20}
              color={Colors.brand[500]}
            />
            <View style={styles.divider} />
            <GoalRow
              label="Weekly Sessions"
              current={0}
              target={5}
              color={Colors.gold[500]}
            />
            <View style={styles.divider} />
            <GoalRow
              label="Monthly Notes"
              current={0}
              target={30}
              color={Colors.success}
            />
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement, i) => (
              <View
                key={i}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked,
                ]}
              >
                <Text
                  style={[
                    styles.achievementEmoji,
                    !achievement.unlocked && { opacity: 0.3 },
                  ]}
                >
                  {achievement.emoji}
                </Text>
                <Text
                  style={[
                    styles.achievementName,
                    !achievement.unlocked && { color: Colors.text.tertiary },
                  ]}
                >
                  {achievement.name}
                </Text>
                <Text style={styles.achievementDesc}>{achievement.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            <SettingRow icon="notifications-outline" label="Study Reminders" />
            <SettingRow icon="moon-outline" label="Dark Mode" value="On" />
            <SettingRow icon="globe-outline" label="Language" value="English" />
            <SettingRow icon="shield-outline" label="Privacy Policy" />
            <SettingRow
              icon="log-out-outline"
              label="Sign Out"
              color={Colors.error}
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GoalRow({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalLeft}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalProgress}>
          {current}/{target}
        </Text>
      </View>
      <ProgressBar
        progress={target > 0 ? current / target : 0}
        color={color}
        height={6}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={color || Colors.text.secondary}
        />
        <Text style={[styles.settingLabel, color ? { color } : undefined]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.text.tertiary}
        />
      </View>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    overflow: "hidden",
    position: "relative",
  },
  profileAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingTop: 22,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  profileBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderTopWidth: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.text.tertiary,
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
  weekActivity: {
    flexDirection: "row",
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    height: 120,
    alignItems: "flex-end",
    gap: 6,
  },
  dayColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  dayBar: {
    width: "100%",
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  goalsCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.secondary,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalLeft: {
    width: 120,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  goalProgress: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementCard: {
    width: "31%",
    backgroundColor: Colors.surface.primary,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 4,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
  },
  achievementDesc: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textAlign: "center",
    lineHeight: 14,
  },
  settingsList: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
});
