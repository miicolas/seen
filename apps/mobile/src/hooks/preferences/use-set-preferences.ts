import { preferenceKeys, recommendationKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { hapticError, hapticSuccess } from "@/lib/haptics";
import { setPreferences, type Preferences, type PreferencesInput } from "@/services/preferences";

export function useSetPreferences() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: PreferencesInput) => setPreferences(input),
    onSuccess: (data: Preferences) => {
      client.setQueryData(preferenceKeys.me(), data);
      void client.invalidateQueries({ queryKey: recommendationKeys.all() });
      hapticSuccess();
    },
    onError: () => {
      hapticError();
    },
  });
}
