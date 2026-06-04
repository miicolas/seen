import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { FieldRow } from "@/components/ui/field-row";
import { Text } from "@/components/ui/text";
import {
  BORDER_RADIUS,
  BORDER_WIDTH,
  LAYOUT,
  OPACITY,
  SPACING,
} from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import {
  hapticDelete,
  hapticError,
  hapticSelection,
  hapticSuccess,
  hapticTap,
} from "@/lib/haptics";
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

function profileErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ProfileError) return error.message;
  return fallback;
}

export function EditProfileForm({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [username, setUsername] = useState(initialProfile.username);
  const [avatar, setAvatar] = useState<AvatarUploadInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialAvatarUrl = useMemo(
    () => profileAvatarUrl(initialProfile),
    [initialProfile],
  );
  const avatarUri = avatar?.uri ?? initialAvatarUrl;
  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username],
  );
  const usernameLooksInvalid =
    normalizedUsername.length > 0 && !isValidUsername(normalizedUsername);

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
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    hapticSelection();
    setAvatar({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
  }, [t]);

  const save = useCallback(async () => {
    if (isSaving || isDeleting) return;

    hapticTap();
    setError(null);
    setIsSaving(true);

    let uploadedPath: string | null = null;
    const previousAvatarPath = initialProfile.avatar_path ?? null;

    try {
      if (avatar) {
        uploadedPath = await uploadProfileAvatar(avatar);
      }

      await updateMyProfile({
        fullName,
        username,
        ...(uploadedPath ? { avatarPath: uploadedPath } : {}),
      });

      if (
        uploadedPath &&
        previousAvatarPath &&
        previousAvatarPath !== uploadedPath
      ) {
        await deleteProfileAvatarPath(previousAvatarPath);
      }

      hapticSuccess();
      router.back();
    } catch (err) {
      if (uploadedPath) {
        await deleteProfileAvatarPath(uploadedPath);
      }
      hapticError();
      setError(profileErrorMessage(err, t("profile.saveError")));
    } finally {
      setIsSaving(false);
    }
  }, [
    avatar,
    fullName,
    isDeleting,
    isSaving,
    initialProfile.avatar_path,
    router,
    t,
    username,
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
    Alert.alert(
      t("profile.deleteAccountTitle"),
      t("profile.deleteAccountMessage"),
      [
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
      ],
    );
  }, [deleteConfirmed, t]);

  const isBusy = isSaving || isDeleting;
  const buttonWidth = Math.min(
    LAYOUT.CONTENT_MAX_WIDTH,
    Math.max(0, width - LAYOUT.SCREEN_PADDING * 2),
  );

  return (
    <EditSheetScaffold
      onClose={close}
      onSave={save}
      closeDisabled={isBusy}
      saveDisabled={isBusy}
    >
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={pickAvatar}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.avatarButton,
            { opacity: pressed ? OPACITY.DISABLED : 1 },
          ]}
        >
          <ProfileAvatar uri={avatarUri} name={fullName} size={150} />
          <View style={styles.cameraBadge}>
            <SymbolView name="camera.fill" size={28} tintColor="#000000" />
          </View>
        </Pressable>

        <View
          style={[
            styles.fieldsPanel,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <FieldRow
            label={t("profile.fullNameLabel")}
            placeholder={t("profile.fullNamePlaceholder")}
            value={fullName}
            onChangeText={setFullName}
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.backgroundSelected },
            ]}
          />
          <FieldRow
            label={t("profile.usernameLabel")}
            placeholder={t("profile.usernamePlaceholder")}
            value={username}
            onChangeText={(value) => setUsername(normalizeUsername(value))}
          />
        </View>

        <View style={styles.fieldHint}>
          <Text
            size="sm"
            weight="medium"
            color={usernameLooksInvalid ? theme.error : theme.textSecondary}
            fillWidth
          >
            {usernameLooksInvalid
              ? t("profile.usernameInvalid")
              : t("profile.usernameHelp")}
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
            title={
              isDeleting
                ? t("profile.deletingAccount")
                : t("profile.deleteAccount")
            }
            onPress={confirmDelete}
            variant="glass"
            color="red"
            size="lg"
            width={buttonWidth}
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
    alignItems: "center",
  },
});
