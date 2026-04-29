import type { Request, Response, NextFunction } from "express";

// Placeholder - will be wired to Supabase JWT verification
export function requireAuth(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function requireRole(_role: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
