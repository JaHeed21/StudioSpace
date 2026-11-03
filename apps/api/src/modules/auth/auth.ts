import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import type { Db } from "mongodb";
import { env } from "../../config/env.js";

export function createAuth(database: Db) {
  return betterAuth({
    appName: "StudioSpace",
    database: mongodbAdapter(database),
    secret: env.betterAuthSecret,
    baseURL: env.betterAuthUrl,
    trustedOrigins: env.webOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: env.nodeEnv === "production",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: env.nodeEnv === "production" ? "none" : "lax",
      },
    },
    socialProviders:
      env.googleClientId && env.googleClientSecret
        ? {
            google: {
              clientId: env.googleClientId,
              clientSecret: env.googleClientSecret,
            },
          }
        : {},
  });
}
