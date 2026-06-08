import { platformKeys, recommendationKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { hapticError, hapticSuccess } from "@/lib/haptics";
import {
  setMyPlatforms,
  type SetUserPlatformsInput,
  type UserPlatforms,
} from "@/services/platforms";

export function useSetMyPlatforms() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: SetUserPlatformsInput) => setMyPlatforms(input),
    onSuccess: (data: UserPlatforms) => {
      client.setQueryData(platformKeys.me(data.region), data);
      void client.invalidateQueries({ queryKey: platformKeys.me(data.region) });
      void client.invalidateQueries({ queryKey: recommendationKeys.all() });
      hapticSuccess();
    },
    onError: () => {
      hapticError();
    },
  });
}
