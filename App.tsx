import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AppNavigator from "./src/navigation/AppNavigator";
import { networkService } from "./src/utils/network";
import useHistoryStore from "./src/state/historyStore";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { processQueue } = useHistoryStore();
  
  const prepare = async () => {
    try {
      // Pre-load fonts, make any API calls you need to do here
      await Font.loadAsync({
        // Add your custom fonts here if needed
      });
      
      // Artificial delay to show splash screen (optional)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.warn(e);
    } finally {
      // Tell the application to render
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    prepare();
    
    // Set up network listener to process queue when coming back online
    const unsubscribe = networkService.addListener((networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        // Process queue when coming back online
        processQueue().catch(console.error);
      }
    });
    
    return unsubscribe;
  }, [processQueue]);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
