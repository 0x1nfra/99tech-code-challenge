import { PrismaClient } from "@prisma/client";
import { ServiceResponse, ServiceResponseStatus } from "./types";
import { GetMoviesFilters, GetMoviesResponse, Movie } from "../types/movies";
import ApiError from "../lib/errorTypes/ApiError";
import { IErrorEnums } from "../entities/Error";
import { status } from "http-status";

const prisma = new PrismaClient();

export default class MovieService {
  async createMovie(
    data: Omit<Movie, "id" | "createdAt" | "updatedAt">,
  ): ServiceResponse<Movie> {
    try {
      const existingMovie = await prisma.movie.findFirst({
        where: {
          title: {
            equals: data.title,
          },
        },
        select: { id: true },
      });

      if (existingMovie) {
        throw new ApiError(
          IErrorEnums.DuplicateMovieExists,
          "A movie with this title already exists",
          status.CONFLICT,
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
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Prisma unique constraint violations (if you add a unique index)
      if ((error as any).code === "P2002") {
        throw new ApiError(
          IErrorEnums.DuplicateMovieExists,
          "A movie with this title already exists",
          status.CONFLICT,
        );
      }

      // Handle unexpected errors
      throw new ApiError(
        IErrorEnums.DatabaseError,
        `Failed to create movie: ${(error as Error).message}`,
        status.INTERNAL_SERVER_ERROR,
      );
    }
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
      // Throw ApiError instead of returning error response
      throw new ApiError(
        IErrorEnums.DatabaseError,
        `Failed to fetch movies: ${(error as Error).message}`,
        status.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMovieById(id: number): ServiceResponse<Movie> {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id },
      });

      if (!movie) {
        throw new ApiError(
          IErrorEnums.MovieNotFound,
          "Movie not found",
          status.NOT_FOUND,
        );
      }

      return {
        status: ServiceResponseStatus.Success,
        message: "Movie retrieved successfully",
        data: movie,
      };
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle unexpected errors
      throw new ApiError(
        IErrorEnums.DatabaseError,
        `Failed to fetch movie: ${(error as Error).message}`,
        status.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMovie(
    id: number,
    data: Partial<Omit<Movie, "id" | "createdAt" | "updatedAt">>,
  ): ServiceResponse<Movie> {
    try {
      // Check if movie exists
      const existingMovie = await prisma.movie.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingMovie) {
        throw new ApiError(
          IErrorEnums.MovieNotFound,
          "Movie not found",
          status.NOT_FOUND,
        );
      }

      // Check for duplicate title if title is being updated
      if (data.title) {
        const duplicateMovie = await prisma.movie.findFirst({
          where: {
            title: {
              equals: data.title,
            },
            NOT: {
              id: id, // Exclude current movie from duplicate check
            },
          },
          select: { id: true },
        });

        if (duplicateMovie) {
          throw new ApiError(
            IErrorEnums.DuplicateMovieExists,
            "A movie with this title already exists",
            status.CONFLICT,
          );
        }
      }

      const movie = await prisma.movie.update({
        where: { id },
        data,
      });

      return {
        status: ServiceResponseStatus.Success,
        message: "Movie updated successfully",
        data: movie,
      };
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Prisma errors
      if ((error as any).code === "P2025") {
        throw new ApiError(
          IErrorEnums.MovieNotFound,
          "Movie not found",
          status.NOT_FOUND,
        );
      }

      if ((error as any).code === "P2002") {
        throw new ApiError(
          IErrorEnums.DuplicateMovieExists,
          "A movie with this title already exists",
          status.CONFLICT,
        );
      }

      // Handle unexpected errors
      throw new ApiError(
        IErrorEnums.DatabaseError,
        `Failed to update movie: ${(error as Error).message}`,
        status.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMovie(id: number): ServiceResponse<null> {
    try {
      // Check if movie exists first to provide clearer error message
      const movieExists = await prisma.movie.findUnique({
        where: { id },
        select: { id: true }, // Only fetch id for efficiency
      });

      if (!movieExists) {
        throw new ApiError(
          IErrorEnums.MovieNotFound,
          "Movie not found",
          status.NOT_FOUND,
        );
      }

      // Prisma will handle cascading deletes based on your schema
      const data = await prisma.movie.delete({
        where: { id },
      });

      return {
        status: ServiceResponseStatus.Success,
        message: "Movie deleted successfully",
        data,
      };
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle any unexpected database errors
      throw new ApiError(
        IErrorEnums.DatabaseError,
        `Failed to delete movie: ${(error as Error).message}`,
        status.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
