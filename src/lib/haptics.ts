// Semantic haptic feedback helpers.
//
// Use these instead of calling expo-haptics directly so every "principal action"
// (button validation, deletion, page/tab switches, selections, toggles) gives a
// consistent, native-feeling response. Pick the helper by *intent*, not by waveform.
//
// All calls are iOS-guarded (the only platform Seen targets) and fire-and-forget —
// never await them in a press handler. Haptics do NOT fire on the iOS simulator;
// test on a physical device.
import * as Haptics from "expo-haptics";

const isIOS = process.env.EXPO_OS === "ios";

/** A successful, validating action: form submit succeeded, item saved/created. */
export function hapticSuccess() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** A failed/blocked action: submit error, validation failure. */
export function hapticError() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** A cautionary action that needs attention but isn't a hard failure. */
export function hapticWarning() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** A destructive action: delete / remove. Heavier impact to signal weight. */
export function hapticDelete() {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Discrete value/selection change: tab switch, segmented control, picker. */
export function hapticSelection() {
  if (isIOS) Haptics.selectionAsync();
}

/** A primary button press / confirm tap. Default light/medium impact. */
export function hapticTap(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) {
  if (isIOS) Haptics.impactAsync(style);
}

// Re-export so callers that need a one-off custom waveform stay consistent.
export { Haptics };
