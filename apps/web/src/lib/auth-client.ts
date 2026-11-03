"use client";

import { createAuthClient } from "better-auth/react";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
  /\/$/,
  "",
);

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/auth`,
  fetchOptions: {
    credentials: "include",
  },
});
