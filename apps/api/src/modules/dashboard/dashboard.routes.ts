import { Router, type Request } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import { requireAuth } from "../auth/auth-session.js";
import type { createAuth } from "../auth/auth.js";
import { getDashboardSummary } from "./dashboard.service.js";

type AuthInstance = ReturnType<typeof createAuth>;

export function createDashboardRouter(auth: AuthInstance) {
  const router = Router();
  router.get("/summary", requireAuth(auth), async (request: Request, response, next) => {
    try {
      const user = request.authSession?.user;
      if (!user) throw new HttpError(401, "Authentication required");
      response.json(await getDashboardSummary(user.id));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
