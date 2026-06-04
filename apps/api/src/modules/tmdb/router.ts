import { Elysia } from "elysia";

import { TmdbModel } from "./model";
import {
  discoverFeed,
  getMediaDetail,
  getTvEpisodeDetail,
  getTvSeasonDetail,
  search,
} from "./queries";

const DEFAULT_LANGUAGE = "fr-FR";

export const tmdbController = new Elysia({
  name: "Tmdb.Controller",
  prefix: "/tmdb",
})
  .use(TmdbModel)
  .get(
    "/discover",
    ({ query }) =>
      discoverFeed(query.filter ?? "all", query.language ?? DEFAULT_LANGUAGE),
    {
      query: "tmdb.DiscoverQuery",
      response: {
        200: "tmdb.DiscoverFeed",
      },
    },
  )
  .get(
    "/search",
    ({ query }) =>
      search(
        query.filter ?? "all",
        query.query,
        query.page,
        query.language ?? DEFAULT_LANGUAGE,
      ),
    {
      query: "tmdb.SearchQuery",
      response: {
        200: "tmdb.SummaryList",
      },
    },
  )
  .get(
    "/:mediaType/:tmdbId",
    ({ params, query }) =>
      getMediaDetail(
        params.mediaType,
        params.tmdbId,
        query.language ?? DEFAULT_LANGUAGE,
      ),
    {
      params: "tmdb.MediaParams",
      query: "tmdb.LanguageQuery",
      response: {
        200: "tmdb.Detail",
      },
    },
  )
  .get(
    "/tv/:seriesId/season/:seasonNumber",
    ({ params, query }) =>
      getTvSeasonDetail(
        params.seriesId,
        params.seasonNumber,
        query.language ?? DEFAULT_LANGUAGE,
      ),
    {
      params: "tmdb.SeasonParams",
      query: "tmdb.LanguageQuery",
      response: {
        200: "tmdb.Detail",
      },
    },
  )
  .get(
    "/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber",
    ({ params, query }) =>
      getTvEpisodeDetail(
        params.seriesId,
        params.seasonNumber,
        params.episodeNumber,
        query.language ?? DEFAULT_LANGUAGE,
      ),
    {
      params: "tmdb.EpisodeParams",
      query: "tmdb.LanguageQuery",
      response: {
        200: "tmdb.Detail",
      },
    },
  );
