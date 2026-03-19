import React, { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import ScanResultScreen from './src/screens/ScanResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';

import BubbleManager from './src/utils/BubbleManager';
import { scanUrl } from './src/utils/scanner';
import { saveToHistory } from './src/storage/history';

const Stack = createStackNavigator();

const DarkTheme = {
  dark: true,
  colors: {
    primary: '#33ff33',
    background: '#0a0a0a',
    card: '#0a0a0a',
    text: '#ffffff',
    border: '#222222',
    notification: '#ff3333',
  },
};

export default function App() {
  const navigationRef = useRef(null);
  const lastScanRef = useRef(null);

  useEffect(() => {
    // Listen for URLs copied via the bubble overlay
    const urlSub = BubbleManager.onUrlCopied(async (url) => {
      BubbleManager.setBubbleVerdict('SCANNING');

      const result = await scanUrl(url);

      await saveToHistory(url, result.verdict, result.reason, result.reasonHindi);

      BubbleManager.setBubbleVerdict(result.verdict, url, result.reason, result.reasonHindi);

      // Store last scan for bubble-tap navigation
      lastScanRef.current = {
        url,
        verdict: result.verdict,
        reason: result.reason,
        reasonHindi: result.reasonHindi,
      };

      // Vibrate on dangerous verdict
      if (result.verdict === 'DANGEROUS') {
        Vibration.vibrate([0, 300, 100, 300]);
      }
    });

    // Listen for bubble taps — navigate to result screen
    const tapSub = BubbleManager.onBubbleTapped(() => {
      if (lastScanRef.current && navigationRef.current) {
        navigationRef.current.navigate('ScanResult', lastScanRef.current);
      }
    });

    return () => {
      urlSub.remove();
      tapSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={DarkTheme} ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
