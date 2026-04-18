import { env } from '../config/env.js';
import { HttpError } from '../errors/httpError.js';

export const notFoundHandler = (req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const payload = {
    error: statusCode >= 500 && env.isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
  };

  if (err instanceof HttpError && err.details) {
    payload.details = err.details;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json(payload);
};