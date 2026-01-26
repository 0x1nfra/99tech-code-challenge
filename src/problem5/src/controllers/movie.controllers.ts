import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
//FIXME: move validators to routes instead
import {
  updateMovieSchema,
  movieFilterSchema,
} from "../validation/movie.validations";
import { date, ZodError } from "zod";
import MovieService from "../services/movie.services";
import { ServiceResponseStatus } from "../services/types";
import ApiError from "../lib/errorTypes/ApiError";

const prisma = new PrismaClient();

export const createMovie = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const response = await new MovieService().createMovie(req.body);

    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.httpCode).json({
        code: error.errorCode,
        error: error.errorMessage,
      });
      return;
    }

    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }

    res.status(500).json({ error: "Failed to create movie" });
  }
};

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Convert query parameters to strings if they're arrays to satisfy Zod schema
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        query[key] = value[0];
      } else if (typeof value === "string") {
        query[key] = value;
      }
    }

    const filters = movieFilterSchema.parse(query);
    const response = await new MovieService().getMovies(filters);

    if (response.status === ServiceResponseStatus.Error) {
      res.status(500).json({ error: response.message });
      return;
    }

    res.json({
      data: response.data.data,
      pagination: response.data.pagination,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Invalid query parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to fetch movies" });
  }
};

export const getMovieById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const response = await new MovieService().getMovieById(id);

    res.json(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.httpCode).json({
        code: error.errorCode,
        error: error.errorMessage,
      });
      return;
    }

    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }

    res.status(500).json({ error: "Failed to fetch specific movie" });
  }
};

export const updateMovie = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const validatedData = updateMovieSchema.parse(req.body);
    const response = await new MovieService().updateMovie(id, validatedData);

    res.json(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.httpCode).json({
        code: error.errorCode,
        error: error.errorMessage,
      });
      return;
    }

    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }

    res.status(500).json({ error: "Failed to update movie" });
  }
};

export const deleteMovie = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const response = await new MovieService().deleteMovie(id);

    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.httpCode).json({
        code: error.errorCode,
        error: error.errorMessage,
      });
      return;
    }
    res.status(500).json({ error: "Failed to delete movie" });
  }
};
