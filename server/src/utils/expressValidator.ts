import { validationResult, body } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Filter from 'bad-words';

export const validationResultMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const USERNAME_VALIDATOR = body(
  'username',
  'username must be at least 3 characters and can contain only letters, numbers, underscores, and periods.'
)
  .trim()
  .matches(/^[a-zA-Z0-9]+([_-]?[a-zA-Z0-9]){2,20}$/)
  .custom((value) => {
    const filter = new Filter();
    return !filter.isProfane(value);
  })
  .customSanitizer((value) => value.toLowerCase());

export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-]{8,100}$/;
