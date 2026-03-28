import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Our Landing Screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* The Tabs interface */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
