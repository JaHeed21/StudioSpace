import { Router } from "express";
import type { createAuth } from "./auth.js";
import { requireAuth, requireRole } from "./auth-session.js";

type AuthInstance = ReturnType<typeof createAuth>;

export function createAuthRouter(auth: AuthInstance) {
  const router = Router();

  router.get("/me", requireAuth(auth), (request, response) => {
    const user = request.authSession?.user;
    if (!user) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    });
  });

  router.get("/admin", requireAuth(auth), requireRole("admin"), (_request, response) => {
    response.json({ status: "ok" });
  });

  return router;
}
