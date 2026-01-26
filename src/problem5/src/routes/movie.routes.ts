import { Router } from "express";
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "../controllers/movie.controllers";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middlewares/validate.middleware";
import {
  createMovieSchema,
  updateMovieSchema,
  movieFilterSchema,
  movieIdParamSchema,
} from "../validation/movie.validations";

const router = Router();

router.post("/", validate(createMovieSchema), createMovie);
router.get("/", validateQuery(movieFilterSchema), getMovies);
router.get("/:id", validateParams(movieIdParamSchema), getMovieById);
router.put(
  "/:id",
  validateParams(movieIdParamSchema),
  validate(updateMovieSchema),
  updateMovie,
);
router.delete("/:id", validateParams(movieIdParamSchema), deleteMovie);

export default router;
