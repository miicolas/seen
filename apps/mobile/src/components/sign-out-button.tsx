import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { hapticTap } from '@/lib/haptics';
import { queryClient } from '@/lib/query-client';

async function onSignOutButtonPress() {
  hapticTap();
  const { error } = await authClient.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return;
  }
  queryClient.clear();
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
