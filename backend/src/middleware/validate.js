import { ZodError } from 'zod';
import { HttpError } from '../errors/httpError.js';

const mapIssues = (error) => error.issues.map((issue) => ({
  path: issue.path.join('.'),
  message: issue.message,
}));

/**
 * Builds middleware that validates either req.body or req.params with zod.
 *
 * Behavior:
 * - Success: replaces req[target] with parsed/coerced data.
 * - Validation failure: passes HttpError(400) with a normalized details array
 *   so the frontend can show field-specific messages.
 */
const validate = (schema, target) => (req, res, next) => {
  try {
    // Parse step also applies any zod coercions/defaults.
    const parsed = schema.parse(req[target]);
    req[target] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Keep validation output stable so the UI can render friendly field errors.
      next(new HttpError(400, `Invalid ${target}.`, mapIssues(error)));
      return;
    }

    next(error);
  }
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateParams = (schema) => validate(schema, 'params');