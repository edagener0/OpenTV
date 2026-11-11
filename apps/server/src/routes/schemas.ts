import { z } from 'zod'

export const mediaTypeSchema = z.enum(['movie', 'tv'])

export const tmdbIdSchema = z.coerce.number().int().positive().max(2_147_483_647)

export const mediaParamsSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: tmdbIdSchema,
})

const imagePath = z
  .string()
  .max(200)
  .regex(/^\/[\w.-]+$/)
  .nullish()

export const favoriteBodySchema = z.object({
  title: z.string().trim().min(1).max(300),
  posterPath: imagePath,
  backdropPath: imagePath,
  voteAverage: z.number().min(0).max(10).nullish(),
  releaseDate: z.string().max(20).nullish(),
})

export const heartbeatBodySchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: tmdbIdSchema,
  season: z.number().int().min(0).max(1000).optional(),
  episode: z.number().int().min(0).max(10000).optional(),
  title: z.string().trim().min(1).max(300),
  episodeTitle: z.string().max(300).nullish(),
  posterPath: imagePath,
  backdropPath: imagePath,
  genres: z.array(z.string().max(60)).max(20).optional(),
  runtimeMinutes: z.number().min(0).max(2000).nullish(),
  seconds: z.number().min(0).max(120),
  position: z.number().min(0).max(200_000).nullish(),
  duration: z.number().min(0).max(200_000).nullish(),
  provider: z.string().max(60).nullish(),
})

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
