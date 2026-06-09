import { useNativeState } from "@expo/ui/swift-ui";
import { profileKeys } from "@seen/shared";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { FieldRow } from "@/components/ui/field-row";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, BORDER_WIDTH, LAYOUT, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticDelete, hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
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

import { EditSheetScaffold } from "../edit-sheet-scaffold";
import { AvatarPicker } from "./avatar-picker";
import { DeleteAccountSection } from "./delete-account-section";

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

  const pickAvatar = useCallback((picked: AvatarUploadInput) => {
    setError(null);
    setAvatar(picked);
  }, []);

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

  const isBusy = isSaving || isDeleting;

  return (
    <EditSheetScaffold onClose={close} onSave={save} closeDisabled={isBusy} saveDisabled={isBusy}>
      <View style={styles.content}>
        <AvatarPicker
          uri={avatarUri}
          name={displayName}
          disabled={isBusy}
          onPick={pickAvatar}
          onError={setError}
        />

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

        <DeleteAccountSection
          isDeleting={isDeleting}
          disabled={isBusy}
          onDelete={deleteConfirmed}
        />
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
});
