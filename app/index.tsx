import { useEffect } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await initialize();
        } else if (event === "SIGNED_OUT") {
          useAuthStore.setState({ user: null, profile: null, isAuthenticated: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Luminary..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
