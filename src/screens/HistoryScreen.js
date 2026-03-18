import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getHistory, clearHistory } from '../storage/history';

const VERDICT_COLORS = {
  DANGEROUS: '#ff3333',
  SUSPICIOUS: '#ffaa00',
  SAFE: '#33ff33',
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon}, ${hours}:${mins}`;
}

function truncateUrl(url, maxLen = 40) {
  return url.length > maxLen ? url.substring(0, maxLen) + '…' : url;
}

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Are you sure you want to clear all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const barColor = VERDICT_COLORS[item.verdict] || '#888888';

    return (
      <View style={styles.entry}>
        {/* Left color bar */}
        <View style={[styles.colorBar, { backgroundColor: barColor }]} />

        <View style={styles.entryContent}>
          {/* URL and badge row */}
          <View style={styles.topRow}>
            <Text style={styles.urlText}>{truncateUrl(item.url)}</Text>
            <View style={[styles.badge, { backgroundColor: barColor + '22', borderColor: barColor }]}>
              <Text style={[styles.badgeText, { color: barColor }]}>
                {item.verdict}
              </Text>
            </View>
          </View>

          {/* Timestamp */}
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>

          {/* Reason */}
          <Text style={styles.reason}>{item.reason}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No scans yet. Copy a link in WhatsApp to start.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearText: {
    fontSize: 14,
    color: '#ff3333',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  entry: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  entryContent: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 13,
    color: '#cccccc',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  reason: {
    fontSize: 12,
    color: '#888888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    color: '#aaaaaa',
  },
});
