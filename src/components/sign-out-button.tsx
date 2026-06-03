import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { hapticTap } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

async function onSignOutButtonPress() {
  hapticTap();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    console.error('Error signing out:', error);
  }
}

export default function SignOutButton() {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onSignOutButtonPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.button}>
        <ThemedText type="smallBold">{t('home.signOut')}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Spacing.three,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
