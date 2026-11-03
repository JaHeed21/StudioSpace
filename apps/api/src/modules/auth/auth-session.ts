import { fromNodeHeaders } from "better-auth/node";
import type { Request, RequestHandler } from "express";
import type { createAuth } from "./auth.js";

type AuthInstance = ReturnType<typeof createAuth>;
export type AuthSession = AuthInstance["$Infer"]["Session"];

declare module "express-serve-static-core" {
  interface Request {
    authSession?: AuthSession;
  }
}

export async function getCurrentSession(
  auth: AuthInstance,
  headers: Headers,
): Promise<AuthSession | null> {
  return auth.api.getSession({ headers });
}

export async function getCurrentUser(
  auth: AuthInstance,
  headers: Headers,
): Promise<AuthSession["user"] | null> {
  const session = await getCurrentSession(auth, headers);
  return session?.user ?? null;
}

export const requestHeaders = (request: Request): Headers =>
  fromNodeHeaders(request.headers);

export function requireAuth(auth: AuthInstance): RequestHandler {
  return async (request, response, next) => {
    try {
      const session = await getCurrentSession(auth, requestHeaders(request));
      if (!session) {
        response.status(401).json({ error: "Authentication required" });
        return;
      }

      request.authSession = session;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(role: string): RequestHandler {
  return (request, response, next) => {
    if (!request.authSession) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    if (request.authSession.user.role !== role) {
      response.status(403).json({ error: "You do not have permission to access this resource" });
      return;
    }

    next();
  };
}
