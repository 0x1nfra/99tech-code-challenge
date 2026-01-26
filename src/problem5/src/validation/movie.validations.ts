import { z } from "zod";

export const createMovieSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  director: z.string().min(1, "Director is required").max(100),
  genre: z.string().min(1, "Genre is required").max(50),
  releaseYear: z
    .number()
    .int()
    .min(1888)
    .max(new Date().getFullYear() + 5),
  rating: z.number().min(0).max(10).optional(),
  description: z.string().max(1000).optional(),
});

export const updateMovieSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  director: z.string().min(1).max(100).optional(),
  genre: z.string().min(1).max(50).optional(),
  releaseYear: z
    .number()
    .int()
    .min(1888)
    .max(new Date().getFullYear() + 5)
    .optional(),
  rating: z.number().min(0).max(10).optional(),
  description: z.string().max(1000).optional(),
});

export const movieFilterSchema = z.object({
  genre: z.string().optional(),
  director: z.string().optional(),
  minYear: z.string().transform(Number).pipe(z.number().int()).optional(),
  maxYear: z.string().transform(Number).pipe(z.number().int()).optional(),
  minRating: z.string().transform(Number).pipe(z.number()).optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .optional(),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type MovieFilterInput = z.infer<typeof movieFilterSchema>;
