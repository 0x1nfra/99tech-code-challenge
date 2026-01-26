import { PrismaClient } from "@prisma/client";
import {
  ServiceResponse,
  ServiceResponseError,
  ServiceResponseStatus,
} from "./types";
import { GetMoviesFilters, GetMoviesResponse, Movie } from "../types/movies";
import ApiError from "../lib/errorTypes/ApiError";
import { IErrorEnums } from "../entities/Error";
import { status } from "http-status";

const prisma = new PrismaClient();

export default class MovieService {
  async createMovie(
    data: Omit<Movie, "id" | "createdAt" | "updatedAt">,
  ): ServiceResponse<Movie> {
    const allMovies = await prisma.movie.findMany({
      select: {
        title: true,
      },
    });

    const duplicateExists = allMovies.some(
      (movie: Movie) => movie.title.toLowerCase() === data.title.toLowerCase(),
    );

    if (duplicateExists) {
      throw new ApiError(
        IErrorEnums.DuplicateMovieExists,
        "A movie with this title already exists",
        status.INTERNAL_SERVER_ERROR,
      );
    }

    const movie = await prisma.movie.create({
      data,
    });

    return {
      status: ServiceResponseStatus.Success,
      message: "Movie created successfully",
      data: movie,
    };
  }

  async getMovies(
    filters: GetMoviesFilters = {},
  ): ServiceResponse<GetMoviesResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.genre) {
        where.genre = { contains: filters.genre };
      }
      if (filters.director) {
        where.director = { contains: filters.director };
      }
      if (filters.minYear !== undefined || filters.maxYear !== undefined) {
        where.releaseYear = {};
        if (filters.minYear !== undefined)
          where.releaseYear.gte = filters.minYear;
        if (filters.maxYear !== undefined)
          where.releaseYear.lte = filters.maxYear;
      }
      if (filters.minRating !== undefined) {
        where.rating = { gte: filters.minRating };
      }

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.movie.count({ where }),
      ]);

      return {
        status: ServiceResponseStatus.Success,
        message: "Movies retrieved successfully",
        data: {
          data: movies,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      return {
        status: ServiceResponseStatus.Error,
        message: "Failed to fetch movies",
        data: {
          error: `Database error: ${(error as Error).message}`,
        },
      };
    }
  }
}
