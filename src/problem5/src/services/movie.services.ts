import { PrismaClient } from "@prisma/client";
import {
  ServiceResponse,
  ServiceResponseError,
  ServiceResponseStatus,
} from "./types";
import { Movie } from "../types/movies";

const prisma = new PrismaClient();

export default class MovieService {
  async createMovie(data: Movie): ServiceResponse<Movie> {
    // TODO: add checking for duplicate titles
    const movie = await prisma.movie.create({
      data,
    });
    return {
      status: ServiceResponseStatus.Success,
      message: "Movie created successfully",
      data: movie,
    };
  }
}
