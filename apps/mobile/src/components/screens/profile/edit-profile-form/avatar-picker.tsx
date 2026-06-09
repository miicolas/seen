import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { OPACITY, SPACING } from "@/constants/design-tokens";
import { hapticError, hapticSelection, hapticTap } from "@/lib/haptics";
import type { AvatarUploadInput } from "@/services/profiles";

export function AvatarPicker({
  uri,
  name,
  disabled,
  onPick,
  onError,
}: {
  uri: string | null;
  name: string;
  disabled: boolean;
  onPick: (avatar: AvatarUploadInput) => void;
  onError: (message: string | null) => void;
}) {
  const { t } = useTranslation();

  const pickAvatar = useCallback(async () => {
    onError(null);
    hapticTap();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      hapticError();
      onError(t("profile.photoPermissionError"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    hapticSelection();
    onPick({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    });
  }, [onError, onPick, t]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={pickAvatar}
      disabled={disabled}
      style={({ pressed }) => [styles.avatarButton, { opacity: pressed ? OPACITY.DISABLED : 1 }]}>
      <ProfileAvatar uri={uri} name={name} size={150} />
      <View style={styles.cameraBadge}>
        <SymbolView name="camera.fill" size={28} tintColor="#000000" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    alignSelf: "center",
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  cameraBadge: {
    position: "absolute",
    right: 8,
    bottom: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
