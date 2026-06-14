import { Directory, File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";

import { tmdbImageUrl } from "@/lib/tmdb/images";

const NOW_WATCHING_POSTERS_DIRECTORY = "now-watching-posters";
const POSTER_SIZE = "w185";

export async function cacheWidgetPosterImage(posterPath: string | null | undefined) {
  const posterUrl = tmdbImageUrl(posterPath, POSTER_SIZE);
  if (!posterPath || !posterUrl || !widgetsDirectory) return undefined;

  try {
    const directory = new Directory(widgetsDirectory, NOW_WATCHING_POSTERS_DIRECTORY);
    directory.create({ intermediates: true, idempotent: true });

    const file = new File(directory, buildPosterFileName(posterPath));
    if (!file.exists) {
      const downloadedFile = await File.downloadFileAsync(posterUrl, file, {
        idempotent: true,
      });
      return downloadedFile.uri;
    }

    return file.uri;
  } catch {
    return undefined;
  }
}

function buildPosterFileName(posterPath: string) {
  const normalizedPath = posterPath.replace(/^\/+/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${POSTER_SIZE}_${normalizedPath}`;
}
