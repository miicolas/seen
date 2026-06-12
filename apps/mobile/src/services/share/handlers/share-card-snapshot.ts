import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { PixelRatio, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

// Snapshot a rendered card view to a PNG sized for social platforms
// (exactly 1080×1920 px for stories, 1080×1080 for square) and hand it to the
// iOS share sheet. Throws if the ref isn't mounted or sharing is unavailable;
// callers handle UX.
export async function shareCardSnapshot(
  ref: RefObject<View | null>,
  fileName: string,
  pixelSize: { width: number; height: number },
): Promise<void> {
  if (!ref.current) throw new Error("Nothing to share yet.");

  const scale = PixelRatio.get();
  const uri = await captureRef(ref, {
    format: "png",
    quality: 1,
    fileName,
    width: pixelSize.width / scale,
    height: pixelSize.height / scale,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }

  await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png" });
}
