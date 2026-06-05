// Helpers HTTP minimos para Express.
import type { NextFunction, Request, Response } from "express";
import type { z, ZodTypeAny } from "zod";

/** Envuelve un handler async para propagar errores al middleware de error. */
export function h(
  fn: (req: Request, res: Response) => Promise<unknown> | unknown,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

/** Valida el body con un schema zod y devuelve el dato tipado (output, con defaults aplicados). */
export function parseBody<S extends ZodTypeAny>(schema: S, req: Request): z.output<S> {
  const r = schema.safeParse(req.body);
  if (!r.success) {
    const err = new HttpError(400, "Datos invalidos", r.error.flatten());
    throw err;
  }
  return r.data;
}

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
