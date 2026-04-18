import { ZodError } from 'zod';
import { HttpError } from '../errors/httpError.js';

const mapIssues = (error) => error.issues.map((issue) => ({
  path: issue.path.join('.'),
  message: issue.message,
}));

const validate = (schema, target) => (req, res, next) => {
  try {
    const parsed = schema.parse(req[target]);
    req[target] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new HttpError(400, `Invalid ${target}.`, mapIssues(error)));
      return;
    }

    next(error);
  }
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateParams = (schema) => validate(schema, 'params');