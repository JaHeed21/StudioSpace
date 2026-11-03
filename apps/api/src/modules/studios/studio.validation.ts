import { z } from "zod";
import { STUDIO_CATEGORIES } from "./studio.types.js";

const studioFields = {
  title: z.string().trim().min(3).max(120),
  category: z.enum(STUDIO_CATEGORIES),
  hourlyRate: z.number().finite().min(1).max(100_000),
  securityDeposit: z.number().finite().min(0).max(1_000_000),
  maxCapacity: z.number().int().min(1).max(10_000),
  location: z.string().trim().min(2).max(200),
  imageUrl: z.string().url().max(2048),
  amenities: z.array(z.string().trim().min(1).max(60)).max(30),
  description: z.string().trim().min(20).max(10_000),
};

export const studioInputSchema = z.object(studioFields).strict();
export const studioPatchSchema = z.object(studioFields).partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update.",
);

const optionalNonNegative = z.coerce.number().finite().min(0).optional();

export const studioQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    category: z.enum(STUDIO_CATEGORIES).optional(),
    minPrice: optionalNonNegative,
    maxPrice: optionalNonNegative,
    minRating: z.coerce.number().finite().min(0).max(5).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { path: ["maxPrice"], message: "Maximum price must be greater than or equal to minimum price." },
  );

export const studioIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid studio ID.");
export type ParsedStudioInput = z.infer<typeof studioInputSchema>;
