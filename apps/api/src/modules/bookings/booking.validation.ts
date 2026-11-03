import { z } from "zod";
import { BOOKING_STATUSES } from "./booking.types.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const bookingInputSchema = z
  .object({
    studioId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid studio ID."),
    bookingDate: z.string().regex(datePattern, "Use a YYYY-MM-DD booking date."),
    startTime: z.string().regex(timePattern, "Use a valid 24-hour start time."),
    endTime: z.string().regex(timePattern, "Use a valid 24-hour end time."),
  })
  .strict()
  .refine((value) => value.endTime > value.startTime, {
    path: ["endTime"],
    message: "End time must be after start time.",
  })
  .refine((value) => {
    const date = new Date(`${value.bookingDate}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value.bookingDate;
  }, {
    path: ["bookingDate"],
    message: "Enter a real calendar date.",
  });

export const bookingIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid booking ID.");

export const bookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
}).strict();

export const bookingListQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
}).strict();
