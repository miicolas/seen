import * as Haptics from "expo-haptics";

const isIOS = process.env.EXPO_OS === "ios";

export function hapticSuccess() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticError() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function hapticWarning() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function hapticDelete() {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function hapticSelection() {
  if (isIOS) Haptics.selectionAsync();
}

export function hapticTap(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) {
  if (isIOS) Haptics.impactAsync(style);
}

export { Haptics };
