import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Section } from '@/components/ui/section';
import { SPACING } from '@/constants/design-tokens';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

type Mode = 'sign-in' | 'sign-up';

export function Login() {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    const credentials = { email: email.trim(), password };
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setLoading(false);
    if (error) {
      hapticError();
      setError(error.message);
    } else {
      hapticSuccess();
    }
    // On success the auth listener flips `isLoggedIn` and the guard redirects.
  }

  function toggleMode() {
    setError(null);
    setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
  }

  const isSignIn = mode === 'sign-in';

  // Widths: content area, then field width inside the Section card padding.
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.four * 2;
  const fieldWidth = contentWidth - SPACING.MD * 2;

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="title">{isSignIn ? 'Connexion' : 'Inscription'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {isSignIn
                ? 'Connecte-toi pour continuer.'
                : 'Crée ton compte pour commencer.'}
            </ThemedText>
          </View>

          <Section title={isSignIn ? 'Connexion' : 'Inscription'}>
            <Input
              placeholder="email@exemple.com"
              onChangeText={setEmail}
              width={fieldWidth}
              keyboardType="email-address"
              textContentType="emailAddress"
              autocapitalization="never"
              autocorrection={false}
              submitLabel="next"
            />
            <Input
              placeholder="Mot de passe"
              onChangeText={setPassword}
              secure
              width={fieldWidth}
              textContentType={isSignIn ? 'password' : 'newPassword'}
              submitLabel="go"
              onSubmit={handleSubmit}
            />
          </Section>

          {error ? (
            <ThemedText type="small" selectable style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={isSignIn ? 'Se connecter' : 'Créer un compte'}
              onPress={handleSubmit}
              variant="glass"
              size="lg"
              width={contentWidth}
              disabled={!canSubmit}
              loading={loading}
            />
            <Button
              title={
                isSignIn
                  ? 'Pas encore de compte ? Créer un compte'
                  : 'Déjà un compte ? Se connecter'
              }
              onPress={toggleMode}
              variant="link"
              size="sm"
              haptic={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  error: {
    color: '#ff3b30',
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.three,
  },
});
