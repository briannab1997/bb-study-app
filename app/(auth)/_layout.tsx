import { Platform } from "react-native";
import { Stack } from "expo-router";

const slideRight = Platform.OS === "web" ? {} : { animation: "slide_from_right" as const };

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" options={slideRight} />
      <Stack.Screen name="register" options={slideRight} />
    </Stack>
  );
}
