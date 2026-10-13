import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiBaseUrl } from './src/config/api';
import { supabase } from './src/config/supabase';

type AuthenticatedUser = { id: string; email: string | null };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [apiStatus, setApiStatus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    }).catch(() => {
      if (active) setNotice('Could not restore the previous session.');
    }).finally(() => {
      if (active) setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setUser(null);
      setApiStatus('');
      return;
    }
    const controller = new AbortController();
    setApiStatus('Checking API access…');
    void fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('API rejected the session');
      const identity = await response.json() as AuthenticatedUser;
      if (controller.signal.aborted) return;
      setUser(identity);
      setApiStatus('API access confirmed');
    }).catch(() => {
      if (!controller.signal.aborted) {
        setUser(null);
        setApiStatus('API access unavailable');
      }
    });
    return () => controller.abort();
  }, [session?.access_token]);

  async function submit() {
    if (!supabase) return;
    setBusy(true);
    setNotice('');
    try {
      const result = signUp
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) setNotice(result.error.message);
      else {
        setPassword('');
        if (signUp && !result.data.session) setNotice('Check your email to confirm your account, then sign in.');
      }
    } catch {
      setNotice('Authentication is unavailable. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Personal Finance Intelligence Platform</Text>
      <Text style={styles.title}>FinSight</Text>
      <Text style={styles.subtitle}>Build a clearer picture of your finances.</Text>
      {!supabase ? (
        <Text style={styles.notice}>Set the public Supabase URL and publishable key in the mobile environment to enable sign-in.</Text>
      ) : !authReady ? (
        <Text style={styles.notice}>Restoring session…</Text>
      ) : session ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Your session</Text>
          <Text>{user?.email ?? session.user.email ?? 'Signed in'}</Text>
          <Text style={styles.notice}>{apiStatus}</Text>
          <Button title="Sign out" onPress={() => void supabase?.auth.signOut()} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.heading}>{signUp ? 'Create account' : 'Sign in'}</Text>
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry autoComplete={signUp ? 'new-password' : 'current-password'} value={password} onChangeText={setPassword} />
          <Button title={busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'} disabled={busy || !email || !password} onPress={() => void submit()} />
          <Pressable onPress={() => { setSignUp(!signUp); setNotice(''); }}>
            <Text style={styles.switch}>{signUp ? 'Already have an account? Sign in' : 'New to FinSight? Create an account'}</Text>
          </Pressable>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </View>
      )}
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f8f6', justifyContent: 'center', padding: 32 },
  eyebrow: { color: '#285f63', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#14343b', fontSize: 48, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#14343b', fontSize: 16, marginTop: 8 },
  card: { marginTop: 24, padding: 20, backgroundColor: 'white', borderRadius: 12, gap: 12 },
  heading: { color: '#14343b', fontSize: 22, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#a6b9b8', borderRadius: 8, padding: 12 },
  switch: { color: '#285f63', textDecorationLine: 'underline', marginTop: 4 },
  notice: { color: '#285f63', marginTop: 8 },
});
