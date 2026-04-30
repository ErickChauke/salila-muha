import type { User } from "@salila/types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
