import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { apiBaseUrl } from './src/config/api';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...');

  useEffect(() => {
    if (!__DEV__) return;

    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    async function checkConnection() {
      try {
        const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/health`, {
          signal: controller.signal,
        });
        if (active) setConnectionStatus(response.ok ? 'Connected' : 'Connection Failed');
      } catch {
        if (active) setConnectionStatus('Connection Failed');
      } finally {
        clearTimeout(timeout);
      }
    }

    void checkConnection();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Personal Finance Intelligence Platform</Text>
      <Text style={styles.title}>FinSight</Text>
      <Text style={styles.subtitle}>Build a clearer picture of your finances.</Text>
      {__DEV__ && <Text style={styles.api}>API: {connectionStatus}</Text>}
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f8f6', justifyContent: 'center', padding: 32 },
  eyebrow: { color: '#285f63', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#14343b', fontSize: 48, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#14343b', fontSize: 16, marginTop: 8 },
  api: { color: '#5c6b70', fontSize: 12, marginTop: 24 },
});
