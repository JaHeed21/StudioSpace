import { Router, type Request } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import { requireAuth } from "../auth/auth-session.js";
import type { createAuth } from "../auth/auth.js";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "./wishlist.service.js";

type AuthInstance = ReturnType<typeof createAuth>;

function currentUserId(request: Request): string {
  const user = request.authSession?.user;
  if (!user) throw new HttpError(401, "Authentication required");
  return user.id;
}

export function createWishlistRouter(auth: AuthInstance) {
  const router = Router();
  router.use(requireAuth(auth));
  router.get("/", async (request, response, next) => {
    try {
      response.json(await getWishlist(currentUserId(request)));
    } catch (error) {
      next(error);
    }
  });
  router.post("/:studioId", async (request, response, next) => {
    try {
      await addToWishlist(currentUserId(request), request.params.studioId ?? "");
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  router.delete("/:studioId", async (request, response, next) => {
    try {
      await removeFromWishlist(currentUserId(request), request.params.studioId ?? "");
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  return router;
}
