import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const VERDICT_CONFIG = {
  DANGEROUS: {
    bg: '#1a0000',
    accent: '#ff3333',
    emoji: '🔴',
    advice:
      'DO NOT open this link. It may steal your data or money.',
    adviceHindi:
      'यह लिंक न खोलें। यह आपका डेटा या पैसा चुरा सकता है।',
  },
  SUSPICIOUS: {
    bg: '#1a1200',
    accent: '#ffaa00',
    emoji: '🟡',
    advice: 'Be careful. Verify before opening.',
    adviceHindi: 'सावधान रहें। खोलने से पहले जांचें।',
  },
  SAFE: {
    bg: '#001a00',
    accent: '#33ff33',
    emoji: '🟢',
    advice: 'Looks safe. Stay alert always.',
    adviceHindi: 'सुरक्षित लगता है। हमेशा सतर्क रहें।',
  },
};

export default function ScanResultScreen({ route, navigation }) {
  const { url, verdict, reason, reasonHindi } = route.params;
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.SUSPICIOUS;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      {/* Verdict Emoji */}
      <Text style={styles.emoji}>{config.emoji}</Text>

      {/* Verdict Text */}
      <Text style={[styles.verdict, { color: config.accent }]}>{verdict}</Text>

      {/* URL */}
      <Text style={styles.url} numberOfLines={2}>
        {url}
      </Text>

      {/* Reason */}
      <Text style={styles.reason}>{reason}</Text>
      <Text style={styles.reasonHindi}>{reasonHindi}</Text>

      {/* Advice */}
      <View style={styles.adviceBox}>
        <Text style={styles.adviceText}>{config.advice}</Text>
        <Text style={styles.adviceHindi}>{config.adviceHindi}</Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { borderColor: config.accent }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.closeButtonText, { color: config.accent }]}>
          ✕ Close
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  verdict: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 2,
  },
  url: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  reason: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  reasonHindi: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  adviceBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 30,
    width: '100%',
  },
  adviceText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  adviceHindi: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 50,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
