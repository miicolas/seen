import { createModifier } from "@expo/ui/swift-ui/modifiers";

export type SymbolReplaceTransitionOptions = {
  fallback?: "downUp" | "offUp" | "upUp";
  scope?: "byLayer" | "wholeSymbol";
  nonRepeating?: boolean;
};

export function symbolReplaceTransition({
  fallback = "downUp",
  scope = "wholeSymbol",
  nonRepeating = true,
}: SymbolReplaceTransitionOptions = {}) {
  return createModifier("seenSymbolReplaceTransition", {
    fallback,
    scope,
    nonRepeating,
  });
}
