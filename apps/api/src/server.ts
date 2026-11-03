import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabaseConnection, connectToDatabase } from "./db/mongodb.js";
import { ensureStudioIndexes } from "./modules/studios/studio.service.js";
import { ensureBookingIndexes } from "./modules/bookings/booking.service.js";
import { ensureWishlistIndexes } from "./modules/wishlist/wishlist.service.js";

async function startServer() {
  const database = await connectToDatabase(env.mongodbUri, env.mongodbDatabase);
  await ensureStudioIndexes();
  await ensureBookingIndexes();
  await ensureWishlistIndexes();
  const app = createApp(database);
  const server = app.listen(env.port, () => {
    console.info(`StudioSpace API listening on http://localhost:${env.port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`${signal} received; shutting down gracefully`);
    server.close((error) => {
      void closeDatabaseConnection()
        .then(() => {
          if (error) {
            console.error("HTTP server shutdown failed", error);
            process.exitCode = 1;
          }
        })
        .catch((closeError: unknown) => {
          console.error("Database shutdown failed", closeError);
          process.exitCode = 1;
        });
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(async (error: unknown) => {
  console.error("Failed to start StudioSpace API", error);
  await closeDatabaseConnection();
  process.exitCode = 1;
});
