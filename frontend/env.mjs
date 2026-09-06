// env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const apiBaseSchema = z
  .string()
  .default("/api")
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    "NEXT_PUBLIC_API_BASE must be a relative path or HTTP(S) URL",
  );

export const env = createEnv({
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((v) => v === "true"),

    // Public API base used by browser/client code.
    // Use "/api" for same-origin routing through Next/Traefik.
    NEXT_PUBLIC_API_BASE: apiBaseSchema,
  },

  client: {
    // Exposed to the browser.
    // Must not default to localhost in production.
    NEXT_PUBLIC_API_BASE: apiBaseSchema,
  },

  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  },
});