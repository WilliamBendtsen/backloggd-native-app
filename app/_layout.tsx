import "react-native-url-polyfill/auto";

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "../lib/auth";

function RootLayoutNav() {
  const { loading, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [loading, router, segments, session]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#16181c",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="game"
        options={{
          headerShown: true,
          headerTitle: "Game",
          headerStyle: { backgroundColor: "#242832" },
          headerTintColor: "#ffffff",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
