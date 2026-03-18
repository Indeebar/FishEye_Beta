import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import BubbleManager from '../utils/BubbleManager';

export default function HomeScreen({ navigation }) {
  const handleStartBubble = () => {
    BubbleManager.showBubble();
    Alert.alert(
      'Bubble Active!',
      'Bubble is active! Go to WhatsApp and copy a link.'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.emoji}>🐟</Text>

        {/* Title */}
        <Text style={styles.title}>FishEye</Text>
        <Text style={styles.subtitle}>WhatsApp Scam Link Detector</Text>
        <Text style={styles.subtitleHindi}>व्हाट्सएप स्कैम लिंक डिटेक्टर</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Instructions */}
        <Text style={styles.instructions}>
          Copy any suspicious link in WhatsApp. The FishEye bubble will instantly scan it.
        </Text>
        <Text style={styles.instructionsHindi}>
          व्हाट्सएप में कोई भी संदिग्ध लिंक कॉपी करें। FishEye बब्बल तुरंत उसे स्कैन करेगा।
        </Text>

        {/* Start Bubble Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartBubble}>
          <Text style={styles.startButtonText}>🐟 Start Bubble</Text>
        </TouchableOpacity>

        {/* View History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

      {/* Permission Warning */}
      <Text style={styles.warning}>
        Requires Overlay Permission. If bubble doesn't appear, grant 'Display over other apps' permission in Settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 2,
  },
  subtitleHindi: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 20,
  },
  instructions: {
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  instructionsHindi: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#22cc44',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  historyButton: {
    backgroundColor: '#222222',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: 15,
    color: '#aaaaaa',
  },
  warning: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    color: '#ffd700',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});
