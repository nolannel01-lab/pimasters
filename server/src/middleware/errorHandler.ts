import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${status}: ${message}`, err);

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || "INTERNAL_ERROR",
      status,
    },
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
      status: 404,
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
