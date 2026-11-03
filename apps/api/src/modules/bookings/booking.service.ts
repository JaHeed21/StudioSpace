import { ObjectId, type ClientSession, type WithId } from "mongodb";
import { getCollection } from "../../db/collection.js";
import { getDatabase, getMongoClient } from "../../db/mongodb.js";
import { HttpError } from "../../middleware/error-handler.js";
import type { StudioDocument } from "../studios/studio.types.js";
import type {
  Booking,
  BookingDocument,
  BookingInput,
  BookingStatus,
} from "./booking.types.js";

function toBooking(document: WithId<BookingDocument>, studioImageUrl?: string): Booking {
  const { _id, ...booking } = document;
  return {
    ...booking,
    id: _id.toString(),
    ...(studioImageUrl ? { studioImageUrl } : {}),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Booking not found");
  return new ObjectId(id);
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

async function ensureReservationGuard(studioId: string, bookingDate: string): Promise<void> {
  try {
    await getCollection("booking_reservation_guards").updateOne(
      { studioId, bookingDate },
      { $setOnInsert: { version: 0 } },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
}

async function lockReservationDay(
  studioId: string,
  bookingDate: string,
  session: ClientSession,
): Promise<void> {
  const result = await getCollection("booking_reservation_guards").updateOne(
    { studioId, bookingDate },
    { $inc: { version: 1 } },
    { session },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Reservation guard was not initialized.");
  }
}

function assertNotPast(bookingDate: string): void {
  const today = new Date().toISOString().slice(0, 10);
  if (bookingDate < today) throw new HttpError(400, "Booking date cannot be in the past.");
}

function durationInHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return ((endHour! * 60 + endMinute!) - (startHour! * 60 + startMinute!)) / 60;
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

async function assertNoConfirmedOverlap(
  studioId: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
  session: ClientSession,
  excludingId?: ObjectId,
): Promise<void> {
  const overlap = await getCollection<BookingDocument>("bookings").findOne(
    {
      studioId,
      bookingDate,
      status: "Confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      ...(excludingId ? { _id: { $ne: excludingId } } : {}),
    },
    { session, projection: { _id: 1 } },
  );
  if (overlap) throw new HttpError(409, "This studio is already booked for part of that time.");
}

export async function createBooking(
  input: BookingInput,
  customer: { id: string; name: string; email: string },
): Promise<Booking> {
  assertNotPast(input.bookingDate);
  const studioId = new ObjectId(input.studioId).toString();
  await ensureReservationGuard(studioId, input.bookingDate);

  const client = getMongoClient();
  return client.withSession(async (session) =>
    session.withTransaction(async () => {
      await lockReservationDay(studioId, input.bookingDate, session);
      const studio = await getCollection<StudioDocument>("studios").findOne(
        { _id: new ObjectId(studioId), status: "published" },
        { session },
      );
      if (!studio) throw new HttpError(404, "Studio not found");
      if (studio.demoKey) {
        throw new HttpError(409, "Sample studio listings are for display only and cannot be booked.");
      }
      if (studio.ownerId === customer.id) {
        throw new HttpError(403, "You cannot book your own studio.");
      }

      await assertNoConfirmedOverlap(
        studioId,
        input.bookingDate,
        input.startTime,
        input.endTime,
        session,
      );

      const totalHours = durationInHours(input.startTime, input.endTime);
      const rentalCost = roundCurrency(totalHours * studio.hourlyRate);
      const document: Omit<BookingDocument, "_id"> = {
        ...input,
        studioId,
        studioTitle: studio.title,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        totalHours,
        hourlyRate: studio.hourlyRate,
        securityDeposit: studio.securityDeposit,
        rentalCost,
        totalAmount: roundCurrency(rentalCost + studio.securityDeposit),
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const inserted = await getCollection<BookingDocument>("bookings").insertOne(document, {
        session,
      });
      return toBooking({ ...document, _id: inserted.insertedId }, studio.imageUrl);
    }),
  );
}

async function listBookings(
  query: Record<string, unknown>,
): Promise<Booking[]> {
  const bookings = await getCollection<BookingDocument>("bookings")
    .find(query)
    .sort({ bookingDate: 1, startTime: 1, createdAt: -1 })
    .toArray();
  const studioIds = [...new Set(bookings.map((booking) => booking.studioId))]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const studios = studioIds.length
    ? await getCollection<StudioDocument>("studios")
        .find({ _id: { $in: studioIds } }, { projection: { imageUrl: 1 } })
        .toArray()
    : [];
  const imageByStudio = new Map(studios.map((studio) => [studio._id.toString(), studio.imageUrl]));
  return bookings.map((booking) => toBooking(booking, imageByStudio.get(booking.studioId)));
}

export function getCustomerBookings(customerId: string, status?: BookingStatus): Promise<Booking[]> {
  return listBookings({ customerId, ...(status ? { status } : {}) });
}

export async function getHostBookings(
  ownerId: string,
  status?: BookingStatus,
): Promise<Booking[]> {
  const studios = await getCollection<StudioDocument>("studios")
    .find({ ownerId }, { projection: { _id: 1 } })
    .toArray();
  const studioIds = studios.map(({ _id }) => _id.toString());
  if (!studioIds.length) return [];
  return listBookings({
    studioId: { $in: studioIds },
    ...(status ? { status } : {}),
  });
}

async function updateBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus,
  allowedCurrent: BookingStatus[],
  authorize: (booking: WithId<BookingDocument>, session: ClientSession) => Promise<void>,
): Promise<Booking> {
  const objectId = toObjectId(bookingId);
  const initial = await getCollection<BookingDocument>("bookings").findOne({ _id: objectId });
  if (!initial) throw new HttpError(404, "Booking not found");
  await ensureReservationGuard(initial.studioId, initial.bookingDate);

  const client = getMongoClient();
  return client.withSession(async (session) =>
    session.withTransaction(async () => {
      await lockReservationDay(initial.studioId, initial.bookingDate, session);
      const booking = await getCollection<BookingDocument>("bookings").findOne(
        { _id: objectId },
        { session },
      );
      if (!booking) throw new HttpError(404, "Booking not found");
      await authorize(booking, session);
      if (!allowedCurrent.includes(booking.status)) {
        throw new HttpError(409, `A ${booking.status.toLowerCase()} booking cannot be changed to ${nextStatus}.`);
      }
      if (nextStatus === "Confirmed") {
        assertNotPast(booking.bookingDate);
        await assertNoConfirmedOverlap(
          booking.studioId,
          booking.bookingDate,
          booking.startTime,
          booking.endTime,
          session,
          objectId,
        );
      }
      const updated = await getCollection<BookingDocument>("bookings").findOneAndUpdate(
        { _id: objectId, status: booking.status },
        { $set: { status: nextStatus, updatedAt: new Date() } },
        { session, returnDocument: "after" },
      );
      if (!updated) throw new HttpError(409, "Booking status changed; reload and try again.");
      return toBooking(updated);
    }),
  );
}

export function cancelCustomerBooking(bookingId: string, customerId: string): Promise<Booking> {
  return updateBookingStatus(
    bookingId,
    "Cancelled",
    ["Pending"],
    async (booking) => {
      if (booking.customerId !== customerId) {
        throw new HttpError(403, "You can only cancel your own booking.");
      }
    },
  );
}

export function cancelHostBooking(bookingId: string, ownerId: string): Promise<Booking> {
  return updateBookingStatus(
    bookingId,
    "Cancelled",
    ["Pending", "Confirmed"],
    async (booking, session) => {
      await assertStudioOwner(booking, ownerId, session);
    },
  );
}

export function setHostBookingStatus(
  bookingId: string,
  ownerId: string,
  status: BookingStatus,
): Promise<Booking> {
  const transitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
    Confirmed: ["Pending"],
    Cancelled: ["Pending"],
    Completed: ["Confirmed"],
  };
  const allowedCurrent = transitions[status];
  if (!allowedCurrent) throw new HttpError(400, "That booking status transition is not allowed.");
  return updateBookingStatus(
    bookingId,
    status,
    allowedCurrent,
    async (booking, session) => {
      await assertStudioOwner(booking, ownerId, session);
    },
  );
}

async function assertStudioOwner(
  booking: WithId<BookingDocument>,
  ownerId: string,
  session: ClientSession,
): Promise<void> {
  if (!ObjectId.isValid(booking.studioId)) throw new HttpError(404, "Studio not found");
  const studio = await getCollection<StudioDocument>("studios").findOne(
    { _id: new ObjectId(booking.studioId) },
    { session, projection: { ownerId: 1 } },
  );
  if (!studio) throw new HttpError(404, "Studio not found");
  if (studio.ownerId !== ownerId) throw new HttpError(403, "Only the studio owner can manage this booking.");
}

export async function ensureBookingIndexes(): Promise<void> {
  const database = getDatabase();
  await Promise.all([
    database.collection<BookingDocument>("bookings").createIndex({
      customerId: 1,
      bookingDate: 1,
      startTime: 1,
    }),
    database.collection<BookingDocument>("bookings").createIndex({
      studioId: 1,
      bookingDate: 1,
      status: 1,
      startTime: 1,
      endTime: 1,
    }),
    database.collection("booking_reservation_guards").createIndex(
      { studioId: 1, bookingDate: 1 },
      { unique: true },
    ),
  ]);
}
