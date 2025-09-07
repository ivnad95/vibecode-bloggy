import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "../screens/HomeScreen";
import PreviewScreen from "../screens/PreviewScreen";

export type RootStackParamList = {
  Home: undefined;
  Preview: { blogContent: string; topic: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#1e40af",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "SEO Blog Generator",
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="Preview"
          component={PreviewScreen}
          options={{
            title: "Generated Blog",
            presentation: "modal",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}