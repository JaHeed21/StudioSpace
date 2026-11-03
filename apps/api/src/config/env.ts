import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (origins.length === 0) {
  throw new Error("WEB_ORIGIN must contain at least one allowed origin");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be configured");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: positiveInteger("PORT", 4000),
  webOrigins: origins,
  mongodbUri: required("MONGODB_URI"),
  mongodbDatabase: required("MONGODB_DB"),
  betterAuthSecret: required("BETTER_AUTH_SECRET"),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  googleClientId,
  googleClientSecret,
  imgbbApiKey: process.env.IMGBB_API_KEY?.trim() || undefined,
  rateLimitWindowMs: positiveInteger("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  rateLimitMax: positiveInteger("RATE_LIMIT_MAX", 100),
};
