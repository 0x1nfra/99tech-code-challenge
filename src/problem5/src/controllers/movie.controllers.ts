import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
//FIXME: move validators to routes instead
import {
  createMovieSchema,
  updateMovieSchema,
  movieFilterSchema,
} from "../validation/movie.validations";
import { date, ZodError } from "zod";
import MovieService from "../services/movie.services";
import { ServiceResponseStatus } from "../services/types";

const prisma = new PrismaClient();

export const createMovie = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const response = await new MovieService().createMovie(req.body);

    if (response.status === ServiceResponseStatus.Error) {
      res.status(500).json({ error: response.message });
      return;
    }

    res.status(response.status).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    res.status(500).json({ error });
  }
};

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = movieFilterSchema.parse(req.query);
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
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie" });
  }
};

export const updateMovie = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const validatedData = updateMovieSchema.parse(req.body);

    const movie = await prisma.movie.update({
      where: { id },
      data: validatedData,
    });

    res.json(movie);
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    if ((error as any).code === "P2025") {
      res.status(404).json({ error: "Movie not found" });
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
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    await prisma.movie.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if ((error as any).code === "P2025") {
      res.status(404).json({ error: "Movie not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete movie" });
  }
};
