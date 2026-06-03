import { Stack } from "expo-router";

export function MediaDetailToolbar({
  hasReview,
  myStars,
  onReview,
  onShare,
  onOpenTmdb,
}: {
  hasReview: boolean;
  myStars: number;
  onReview: (rating?: number) => void;
  onShare: () => void;
  onOpenTmdb: () => void;
}) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={hasReview ? "checkmark" : "plus"}
        variant="prominent"
        onPress={() => onReview(myStars || undefined)}>
        Mark as seen
      </Stack.Toolbar.Button>
      <Stack.Toolbar.Menu icon="ellipsis">
        {hasReview ? (
          <Stack.Toolbar.MenuAction
            icon="star"
            onPress={() => onReview(myStars || undefined)}>
            Edit review
          </Stack.Toolbar.MenuAction>
        ) : null}
        <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={onShare}>
          Share
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="safari" onPress={onOpenTmdb}>
          Open in TMDB
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
