import { eden, unwrapEden } from "@/lib/eden";

export async function deleteEpisodeReview(params: {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden["episode-reviews"].my.delete(undefined, {
      query: params,
    }),
  );
}
