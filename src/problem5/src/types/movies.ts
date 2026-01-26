export interface Movie {
  id: number;
  title: string;
  director: string;
  genre: string;
  releaseYear: number;
  rating: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMoviesFilters {
  genre?: string;
  director?: string;
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface GetMoviesResponse {
  data: Movie[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
