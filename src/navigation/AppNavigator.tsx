import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PreviewScreen from "../screens/PreviewScreen";
import EditBlogScreen from "../screens/EditBlogScreen";
import ResearchScreen from "../screens/ResearchScreen";
import ImageGeneratorScreen from "../screens/ImageGeneratorScreen";

// Tab Navigator Types
export type TabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  AnalyticsTab: undefined;
  SettingsTab: undefined;
};

// Stack Navigator Types
export type HomeStackParamList = {
  Home: undefined;
  Research: { topic: string };
  Preview: { blogContent: string; topic: string; researchId?: string };
  EditBlog: { blogId?: string; draft?: any };
  ImageGenerator: { topic: string; blogId?: string };
};

export type HistoryStackParamList = {
  History: undefined;
  EditBlog: { blogId: string };
  Preview: { blogContent: string; topic: string; blogId?: string };
};

export type AnalyticsStackParamList = {
  Analytics: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

// Stack Navigators
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTransparent: true,
        headerBlurEffect: "light",
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "SEO Blog Generator",
          headerLargeTitle: true,
        }}
      />
      <HomeStack.Screen
        name="Research"
        component={ResearchScreen}
        options={{
          title: "SEO Research",
          presentation: "modal",
        }}
      />
      <HomeStack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{
          title: "Blog Preview",
          presentation: "modal",
        }}
      />
      <HomeStack.Screen
        name="EditBlog"
        component={EditBlogScreen}
        options={{
          title: "Edit Blog",
          presentation: "modal",
        }}
      />
      <HomeStack.Screen
        name="ImageGenerator"
        component={ImageGeneratorScreen}
        options={{
          title: "Generate Images",
          presentation: "modal",
        }}
      />
    </HomeStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTransparent: true,
        headerBlurEffect: "light",
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <HistoryStack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "Blog History",
          headerLargeTitle: true,
        }}
      />
      <HistoryStack.Screen
        name="EditBlog"
        component={EditBlogScreen}
        options={{
          title: "Edit Blog",
          presentation: "modal",
        }}
      />
      <HistoryStack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{
          title: "Blog Preview",
          presentation: "modal",
        }}
      />
    </HistoryStack.Navigator>
  );
}

function AnalyticsStackNavigator() {
  return (
    <AnalyticsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTransparent: true,
        headerBlurEffect: "light",
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <AnalyticsStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: "SEO Analytics",
          headerLargeTitle: true,
        }}
      />
    </AnalyticsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTransparent: true,
        headerBlurEffect: "light",
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerLargeTitle: true,
        }}
      />
    </SettingsStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case "HomeTab":
                iconName = focused ? "create" : "create-outline";
                break;
              case "HistoryTab":
                iconName = focused ? "library" : "library-outline";
                break;
              case "AnalyticsTab":
                iconName = focused ? "analytics" : "analytics-outline";
                break;
              case "SettingsTab":
                iconName = focused ? "settings" : "settings-outline";
                break;
              default:
                iconName = "ellipse-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === "ios" ? 90 : 70,
            paddingBottom: Platform.OS === "ios" ? 30 : 10,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                overflow: "hidden",
              }}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            tabBarLabel: "Create",
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStackNavigator}
          options={{
            tabBarLabel: "History",
          }}
        />
        <Tab.Screen
          name="AnalyticsTab"
          component={AnalyticsStackNavigator}
          options={{
            tabBarLabel: "Analytics",
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: "Settings",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}