import { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 no captura promesas rechazadas en handlers async: si un await falla
// sin try/catch, la request queda colgada. Este wrapper redirige cualquier
// error async al error handler global de index.ts (responde 500 genérico).
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
