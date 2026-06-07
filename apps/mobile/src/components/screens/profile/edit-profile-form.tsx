import { useNativeState } from "@expo/ui/swift-ui";
import { profileKeys } from "@seen/shared";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FieldRow } from "@/components/ui/field-row";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, BORDER_WIDTH, LAYOUT, OPACITY, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import {
  hapticDelete,
  hapticError,
  hapticSelection,
  hapticSuccess,
  hapticTap,
} from "@/lib/haptics";
import { queryClient } from "@/lib/query-client";
import {
  deleteAccount,
  deleteProfileAvatarPath,
  isValidUsername,
  normalizeUsername,
  profileAvatarUrl,
  ProfileError,
  updateMyProfile,
  uploadProfileAvatar,
  type AvatarUploadInput,
  type Profile,
} from "@/services/profiles";

import { EditSheetScaffold } from "./edit-sheet-scaffold";
import { ProfileAvatar } from "./profile-avatar";

function profileErrorMessage(
  error: unknown,
  fallback: string,
  overrides: Partial<Record<ProfileError["code"], string>> = {},
) {
  if (error instanceof ProfileError) return overrides[error.code] ?? error.message;
  return fallback;
}

export function EditProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const fullNameState = useNativeState(initialProfile.full_name);
  const usernameState = useNativeState(initialProfile.username);
  const [avatar, setAvatar] = useState<AvatarUploadInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live initials in the avatar track the typed name; the field text itself
  // lives in `fullNameState`.
  const [displayName, setDisplayName] = useState(initialProfile.full_name);
  // Validity hint stays reactive off a cheap boolean that only flips when the
  // normalized username crosses the valid↔invalid boundary.
  const [usernameLooksInvalid, setUsernameLooksInvalid] = useState(() => {
    const normalized = normalizeUsername(initialProfile.username);
    return normalized.length > 0 && !isValidUsername(normalized);
  });

  const onUsernameChange = useCallback((value: string) => {
    const normalized = normalizeUsername(value);
    const invalid = normalized.length > 0 && !isValidUsername(normalized);
    setUsernameLooksInvalid((prev) => (prev === invalid ? prev : invalid));
  }, []);

  const initialAvatarUrl = useMemo(() => profileAvatarUrl(initialProfile), [initialProfile]);
  const avatarUri = avatar?.uri ?? initialAvatarUrl;

  const close = useCallback(() => {
    hapticTap();
    router.back();
  }, [router]);

  const pickAvatar = useCallback(async () => {
    setError(null);
    hapticTap();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      hapticError();
      setError(t("profile.photoPermissionError"));
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
    setAvatar({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    });
  }, [t]);

  const save = useCallback(async () => {
    if (isSaving || isDeleting) return;

    hapticTap();
    setError(null);
    setIsSaving(true);

    let uploadedPath: string | null = null;
    const previousAvatarPath = initialProfile.avatar_path ?? null;
    const fullName = fullNameState.value;
    const username = normalizeUsername(usernameState.value);

    try {
      if (avatar) {
        uploadedPath = await uploadProfileAvatar(avatar);
      }

      const savedProfile = await updateMyProfile({
        fullName,
        username,
        ...(uploadedPath ? { avatarPath: uploadedPath } : {}),
      });
      queryClient.setQueryData(profileKeys.me(), savedProfile);

      if (uploadedPath && previousAvatarPath && previousAvatarPath !== uploadedPath) {
        void deleteProfileAvatarPath(previousAvatarPath).catch((cleanupError) => {
          console.warn("previous avatar cleanup failed", cleanupError);
        });
      }

      hapticSuccess();
      router.back();
    } catch (err) {
      console.error("Profile save failed", err);
      if (uploadedPath) {
        await deleteProfileAvatarPath(uploadedPath).catch((cleanupError) => {
          console.warn("uploaded avatar cleanup failed", cleanupError);
        });
      }
      hapticError();
      setError(
        profileErrorMessage(err, t("profile.saveError"), {
          "avatar-too-large": t("profile.avatarTooLarge"),
          "avatar-invalid-type": t("profile.avatarInvalidType"),
        }),
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    avatar,
    fullNameState,
    usernameState,
    isDeleting,
    isSaving,
    initialProfile.avatar_path,
    router,
    t,
  ]);

  const deleteConfirmed = useCallback(async () => {
    if (isDeleting) return;

    hapticDelete();
    setError(null);
    setIsDeleting(true);

    try {
      await deleteAccount();
    } catch {
      hapticError();
      setError(t("profile.deleteError"));
      setIsDeleting(false);
    }
  }, [isDeleting, t]);

  const confirmDelete = useCallback(() => {
    hapticDelete();
    Alert.alert(t("profile.deleteAccountTitle"), t("profile.deleteAccountMessage"), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.continueDelete"),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t("profile.deleteAccountFinalTitle"),
            t("profile.deleteAccountFinalMessage"),
            [
              { text: t("profile.cancel"), style: "cancel" },
              {
                text: t("profile.deleteAccount"),
                style: "destructive",
                onPress: deleteConfirmed,
              },
            ],
          );
        },
      },
    ]);
  }, [deleteConfirmed, t]);

  const isBusy = isSaving || isDeleting;

  return (
    <EditSheetScaffold onClose={close} onSave={save} closeDisabled={isBusy} saveDisabled={isBusy}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={pickAvatar}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.avatarButton,
            { opacity: pressed ? OPACITY.DISABLED : 1 },
          ]}>
          <ProfileAvatar uri={avatarUri} name={displayName} size={150} />
          <View style={styles.cameraBadge}>
            <SymbolView name="camera.fill" size={28} tintColor="#000000" />
          </View>
        </Pressable>

        <View style={[styles.fieldsPanel, { backgroundColor: theme.backgroundElement }]}>
          <FieldRow
            label={t("profile.fullNameLabel")}
            placeholder={t("profile.fullNamePlaceholder")}
            state={fullNameState}
            onChangeText={setDisplayName}
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <FieldRow
            label={t("profile.usernameLabel")}
            placeholder={t("profile.usernamePlaceholder")}
            state={usernameState}
            onChangeText={onUsernameChange}
          />
        </View>

        <View style={styles.fieldHint}>
          <Text
            size="sm"
            weight="medium"
            color={usernameLooksInvalid ? theme.error : theme.textSecondary}
            fillWidth>
            {usernameLooksInvalid ? t("profile.usernameInvalid") : t("profile.usernameHelp")}
          </Text>
        </View>

        {error ? (
          <View style={styles.fieldHint}>
            <Text size="sm" weight="semibold" color={theme.error} fillWidth>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.destructive}>
          <Button
            title={isDeleting ? t("profile.deletingAccount") : t("profile.deleteAccount")}
            onPress={confirmDelete}
            variant="glass"
            color="red"
            size="lg"
            width="fill"
            disabled={isBusy}
          />
        </View>
      </View>
    </EditSheetScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.MD,
    gap: SPACING.MD,
  },
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
  fieldsPanel: {
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  divider: {
    height: BORDER_WIDTH.THIN,
    marginLeft: LAYOUT.FIELD_ROW_PADDING,
  },
  fieldHint: {
    paddingHorizontal: LAYOUT.FIELD_ROW_PADDING,
  },
  destructive: {
    paddingTop: SPACING.XL,
    paddingHorizontal: SPACING.MD,
    alignItems: "center",
  },
});
