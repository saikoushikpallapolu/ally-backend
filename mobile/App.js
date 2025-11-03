import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, Vibration, View } from 'react-native';

const MOCK_ALERTS = [
  'Assist a user to reach Auditorium Gate.',
  'Guide a visually impaired person to the Cafeteria.',
  'Help a wheelchair user navigate to Block B.',
  'Support a deaf attendee at Registration Desk.',
  'Escort senior citizen to Medical Help Desk.'
];

const UPCOMING_EVENTS = [
  'Accessibility Walk — 5 PM',
  'Support Camp — Hall 2',
  'Volunteer Meet — Nov 6'
];

export default function App() {
  const [activeAlert, setActiveAlert] = useState(null);
  const [isListening, setIsListening] = useState(true);
  const [nextTimerMs, setNextTimerMs] = useState(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const alertTimeoutRef = useRef(null);

  const vibrationPattern = useMemo(() => [0, 400, 100, 400], []);

  const startFlash = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true })
      ])
    ).start();
  }, [flashAnim]);

  const stopFlash = useCallback(() => {
    flashAnim.stopAnimation();
    flashAnim.setValue(0);
  }, [flashAnim]);

  const pickRandomAlert = useCallback(() => {
    const idx = Math.floor(Math.random() * MOCK_ALERTS.length);
    return MOCK_ALERTS[idx];
  }, []);

  const scheduleNextAlert = useCallback((min = 15000, max = 30000) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setNextTimerMs(delay);
    alertTimeoutRef.current = setTimeout(() => {
      triggerAlert();
    }, delay);
  }, []);

  const triggerAlert = useCallback(() => {
    const message = pickRandomAlert();
    setActiveAlert(message);
    setIsListening(false);
    Vibration.vibrate(vibrationPattern, true);
    startFlash();
  }, [pickRandomAlert, startFlash, vibrationPattern]);

  const acknowledgeAlert = useCallback(() => {
    Vibration.cancel();
    stopFlash();
    setActiveAlert(null);
    setIsListening(true);
    scheduleNextAlert();
  }, [scheduleNextAlert, stopFlash]);

  useEffect(() => {
    // On mount, schedule the first mock alert
    scheduleNextAlert();
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      Vibration.cancel();
      stopFlash();
    };
  }, [scheduleNextAlert, stopFlash]);

  const flashingStyle = {
    opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] })
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Volunteer Dashboard</Text>
          <Text style={styles.subtitle}>Accessibility Assistance</Text>
        </View>

        {isListening && !activeAlert ? (
          <View style={styles.listeningCard}>
            <Text style={styles.listeningText}>Listening for help requests…</Text>
            {typeof nextTimerMs === 'number' ? (
              <Text style={styles.timerHint}>(Next mock alert in ~{Math.ceil(nextTimerMs / 1000)}s)</Text>
            ) : null}
          </View>
        ) : null}

        {!isListening && activeAlert ? (
          <Animated.View style={[styles.alertCard, flashingStyle]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive">
            <Text style={styles.alertTitle}>Incoming Help Request</Text>
            <Text style={styles.alertMessage}>{activeAlert}</Text>
            <Pressable
              onPress={acknowledgeAlert}
              style={({ pressed }) => [styles.ackButton, pressed && styles.ackButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Acknowledge alert to stop vibration">
              <Text style={styles.ackButtonText}>Acknowledge</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.controlsRow}>
          <Pressable
            onPress={() => {
              if (isListening) {
                if (alertTimeoutRef.current) { clearTimeout(alertTimeoutRef.current); }
                triggerAlert();
              }
            }}
            style={({ pressed }) => [styles.simButton, pressed && styles.simButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Simulate help alert">
            <Text style={styles.simButtonText}>Simulate Alert</Text>
          </Pressable>
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Volunteer Events</Text>
          {UPCOMING_EVENTS.map((evt, idx) => (
            <View key={idx} style={styles.eventItem}>
              <View style={styles.bullet} />
              <Text style={styles.eventText}>{evt}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0b0b'
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0b0b0b'
  },
  header: {
    marginBottom: 12
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700'
  },
  subtitle: {
    color: '#cfcfcf',
    fontSize: 14,
    marginTop: 4
  },
  listeningCard: {
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    marginTop: 8
  },
  listeningText: {
    color: '#e6e6e6',
    fontSize: 18,
    fontWeight: '600'
  },
  timerHint: {
    color: '#9e9e9e',
    marginTop: 6
  },
  alertCard: {
    borderRadius: 12,
    backgroundColor: '#1a0000',
    padding: 20,
    borderWidth: 2,
    borderColor: '#ff3b30',
    marginTop: 12
  },
  alertTitle: {
    color: '#ffb3ae',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  alertMessage: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16
  },
  ackButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  ackButtonPressed: {
    backgroundColor: '#d2322a'
  },
  ackButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  controlsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12
  },
  simButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  simButtonPressed: {
    backgroundColor: '#1d4ed8'
  },
  simButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 20
  },
  eventsSection: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  sectionTitle: {
    color: '#e6e6e6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    marginRight: 10
  },
  eventText: {
    color: '#d4d4d4',
    fontSize: 16
  }
});
