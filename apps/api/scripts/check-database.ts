import { env } from "../src/config/env.js";
import { closeDatabaseConnection, connectToDatabase } from "../src/db/mongodb.js";

try {
  await connectToDatabase(env.mongodbUri, env.mongodbDatabase);
  console.info(`MongoDB connection successful (${env.mongodbDatabase})`);
} catch (error) {
  console.error("MongoDB connection test failed", error);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}

