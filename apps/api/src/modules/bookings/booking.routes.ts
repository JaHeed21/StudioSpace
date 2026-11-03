import { Router, type Request } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import { requireAuth } from "../auth/auth-session.js";
import type { createAuth } from "../auth/auth.js";
import {
  cancelCustomerBooking,
  cancelHostBooking,
  createBooking,
  getCustomerBookings,
  getHostBookings,
  setHostBookingStatus,
} from "./booking.service.js";
import {
  bookingIdSchema,
  bookingInputSchema,
  bookingListQuerySchema,
  bookingStatusSchema,
} from "./booking.validation.js";

type AuthInstance = ReturnType<typeof createAuth>;

function actorFrom(request: Request) {
  const user = request.authSession?.user;
  if (!user) throw new HttpError(401, "Authentication required");
  return { id: user.id, name: user.name, email: user.email };
}

function validationError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return new HttpError(
    400,
    error.issues
      .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
      .join("; "),
  );
}

function parseId(value: string): string {
  const parsed = bookingIdSchema.safeParse(value);
  if (!parsed.success) throw new HttpError(404, "Booking not found");
  return parsed.data;
}

export function createBookingRouter(auth: AuthInstance) {
  const router = Router();
  const authenticated = requireAuth(auth);

  router.post("/", authenticated, async (request, response, next) => {
    try {
      const parsed = bookingInputSchema.safeParse(request.body);
      if (!parsed.success) throw validationError(parsed.error);
      response.status(201).json({ booking: await createBooking(parsed.data, actorFrom(request)) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/my-bookings", authenticated, async (request, response, next) => {
    try {
      const parsed = bookingListQuerySchema.safeParse(request.query);
      if (!parsed.success) throw validationError(parsed.error);
      response.json({
        bookings: await getCustomerBookings(actorFrom(request).id, parsed.data.status),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/", authenticated, async (request, response, next) => {
    try {
      const parsed = bookingListQuerySchema.safeParse(request.query);
      if (!parsed.success) throw validationError(parsed.error);
      response.json({ bookings: await getHostBookings(actorFrom(request).id, parsed.data.status) });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/cancel", authenticated, async (request, response, next) => {
    try {
      const bookingId = parseId(request.params.id ?? "");
      const actorId = actorFrom(request).id;
      try {
        response.json({ booking: await cancelCustomerBooking(bookingId, actorId) });
      } catch (error) {
        if (!(error instanceof HttpError) || error.statusCode !== 403) throw error;
        response.json({ booking: await cancelHostBooking(bookingId, actorId) });
      }
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/status", authenticated, async (request, response, next) => {
    try {
      const parsed = bookingStatusSchema.safeParse(request.body);
      if (!parsed.success) throw validationError(parsed.error);
      response.json({
        booking: await setHostBookingStatus(
          parseId(request.params.id ?? ""),
          actorFrom(request).id,
          parsed.data.status,
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
