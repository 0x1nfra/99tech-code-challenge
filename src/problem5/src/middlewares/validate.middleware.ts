import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert query parameters to proper format for Zod
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value)) {
          query[key] = value[0];
        } else if (typeof value === "string") {
          query[key] = value;
        }
      }

      const validated = await schema.parseAsync(query);
      req.query = validated as any; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};

export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid parameters",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};
