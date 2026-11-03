import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const helmet = require("helmet");
import { toNodeHandler } from "better-auth/node";
import type { Db } from "mongodb";
import type { Request, Response } from "express";
import { env } from "./config/env.js";
import { connectToDatabase } from "./db/mongodb.js";
import { HttpError } from "./middleware/error-handler.js";
import { createAuth } from "./modules/auth/auth.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { createStudioRouter } from "./modules/studios/studio.routes.js";
import { ensureStudioIndexes } from "./modules/studios/studio.service.js";
import { createBookingRouter } from "./modules/bookings/booking.routes.js";
import { ensureBookingIndexes } from "./modules/bookings/booking.service.js";
import { createDashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { createWishlistRouter } from "./modules/wishlist/wishlist.routes.js";
import { ensureWishlistIndexes } from "./modules/wishlist/wishlist.service.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp(database: Db) {
  const app = express();
  const auth = createAuth(database);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.webOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, `Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      limit: env.rateLimitMax,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.all("/api/auth/*", toNodeHandler(auth));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", createAuthRouter(auth));
  app.use("/api/studios", createStudioRouter(auth));
  app.use("/api/bookings", createBookingRouter(auth));
  app.use("/api/dashboard", createDashboardRouter(auth));
  app.use("/api/wishlist", createWishlistRouter(auth));
  app.use("/api/health", healthRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

type App = ReturnType<typeof createApp>;

let vercelApp: Promise<App> | undefined;

async function getVercelApp(): Promise<App> {
  if (!vercelApp) {
    vercelApp = (async () => {
      const database = await connectToDatabase(env.mongodbUri, env.mongodbDatabase);
      await ensureStudioIndexes();
      await ensureBookingIndexes();
      await ensureWishlistIndexes();
      return createApp(database);
    })();
    void vercelApp.catch(() => {
      vercelApp = undefined;
    });
  }
  return vercelApp;
}

export default async function handler(request: Request, response: Response): Promise<void> {
  const app = await getVercelApp();
  app(request, response);
}
