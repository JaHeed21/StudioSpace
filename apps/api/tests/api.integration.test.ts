import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import supertest, { type Agent } from "supertest";
import type { Db } from "mongodb";
import type { Express } from "express";
import { env } from "../src/config/env.js";
import { connectToDatabase, closeDatabaseConnection } from "../src/db/mongodb.js";
import { createApp } from "../src/app.js";
import { ensureBookingIndexes } from "../src/modules/bookings/booking.service.js";
import { ensureStudioIndexes } from "../src/modules/studios/studio.service.js";
import { ensureWishlistIndexes } from "../src/modules/wishlist/wishlist.service.js";

const origin = env.webOrigins[0]!;
const testPassword = "StudioTest8";

describe("StudioSpace API integration", () => {
  let database: Db;
  let app: Express;
  let owner: Agent;
  let customer: Agent;
  let stranger: Agent;
  let studioId: string;
  let bookingDate: string;
  const bookingInput = (startTime: string, endTime: string) => ({
    studioId,
    bookingDate,
    startTime,
    endTime,
  });

  beforeAll(async () => {
    const databaseName = `${env.mongodbDatabase.slice(0, 12)}_qa_${randomUUID().slice(0, 8)}`;
    database = await connectToDatabase(env.mongodbUri, databaseName);
    await Promise.all([
      ensureStudioIndexes(),
      ensureBookingIndexes(),
      ensureWishlistIndexes(),
    ]);
    app = createApp(database);

    owner = supertest.agent(app);
    customer = supertest.agent(app);
    stranger = supertest.agent(app);
    const suffix = randomUUID();
    await register(owner, `qa-owner-${suffix}@example.com`, "QA Studio Host");
    await register(customer, `qa-customer-${suffix}@example.com`, "QA Studio Customer");
    await register(stranger, `qa-stranger-${suffix}@example.com`, "QA Studio Stranger");

    const studioResponse = await owner
      .post("/api/studios")
      .set("Origin", origin)
      .send(studioInput(`QA Studio ${suffix}`));
    expect(studioResponse.status).toBe(201);
    studioId = studioResponse.body.studio.id as string;
    bookingDate = futureDate(30);
  }, 30_000);

  afterAll(async () => {
    try {
      if (database) await database.dropDatabase();
    } finally {
      await closeDatabaseConnection();
    }
  });

  it("requires a verified session and rejects malformed studio input", async () => {
    const unauthorized = await supertest(app)
      .post("/api/studios")
      .set("Origin", origin)
      .send({});
    expect(unauthorized.status).toBe(401);

    const malformed = await customer
      .post("/api/studios")
      .set("Origin", origin)
      .send({ ...studioInput("Invalid"), ownerId: "forged" });
    expect(malformed.status).toBe(400);
  });

  it("enforces studio ownership for update and deletion", async () => {
    const otherStudioResponse = await owner
      .post("/api/studios")
      .set("Origin", origin)
      .send(studioInput("Ownership QA Studio"));
    expect(otherStudioResponse.status).toBe(201);
    const otherStudioId = otherStudioResponse.body.studio.id as string;

    const deniedUpdate = await customer
      .patch(`/api/studios/${otherStudioId}`)
      .set("Origin", origin)
      .send({ title: "Unauthorized edit" });
    const deniedDelete = await stranger
      .delete(`/api/studios/${otherStudioId}`)
      .set("Origin", origin);
    expect(deniedUpdate.status).toBe(403);
    expect(deniedDelete.status).toBe(403);

    const allowedUpdate = await owner
      .patch(`/api/studios/${otherStudioId}`)
      .set("Origin", origin)
      .send({ title: "Authorized edit" });
    expect(allowedUpdate.status).toBe(200);
    expect(allowedUpdate.body.studio.title).toBe("Authorized edit");

    const allowedDelete = await owner
      .delete(`/api/studios/${otherStudioId}`)
      .set("Origin", origin);
    expect(allowedDelete.status).toBe(204);
  });

  it("calculates booking totals from studio data and enforces booking ownership", async () => {
    const invalidTime = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send(bookingInput("11:00", "10:00"));
    const pastDate = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send({ ...bookingInput("10:00", "11:00"), bookingDate: pastDateString() });
    const missingStudio = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send({ ...bookingInput("10:00", "11:00"), studioId: "64b000000000000000000001" });
    const forgedPrice = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send({ ...bookingInput("10:00", "12:00"), hourlyRate: 1, totalAmount: 1 });
    expect(invalidTime.status).toBe(400);
    expect(pastDate.status).toBe(400);
    expect(missingStudio.status).toBe(404);
    expect(forgedPrice.status).toBe(400);

    const created = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send(bookingInput("10:00", "12:00"));
    expect(created.status).toBe(201);
    expect(created.body.booking).toMatchObject({
      studioId,
      status: "Pending",
      totalHours: 2,
      hourlyRate: 70,
      securityDeposit: 100,
      rentalCost: 140,
      totalAmount: 240,
    });

    const unauthorizedStatus = await customer
      .patch(`/api/bookings/${created.body.booking.id}/status`)
      .set("Origin", origin)
      .send({ status: "Confirmed" });
    expect(unauthorizedStatus.status).toBe(403);

    const deniedCancel = await stranger
      .patch(`/api/bookings/${created.body.booking.id}/cancel`)
      .set("Origin", origin);
    expect(deniedCancel.status).toBe(403);

    const cancelled = await customer
      .patch(`/api/bookings/${created.body.booking.id}/cancel`)
      .set("Origin", origin);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.booking.status).toBe("Cancelled");
  });

  it("serializes concurrent overlapping confirmations and allows adjacent bookings", async () => {
    const createPending = async (startTime: string, endTime: string) => {
      const response = await customer
        .post("/api/bookings")
        .set("Origin", origin)
        .send(bookingInput(startTime, endTime));
      expect(response.status).toBe(201);
      return response.body.booking.id as string;
    };

    const confirm = (id: string) =>
      owner
        .patch(`/api/bookings/${id}/status`)
        .set("Origin", origin)
        .send({ status: "Confirmed" });

    const first = await createPending("13:00", "15:00");
    const firstConfirmed = await confirm(first);
    expect(firstConfirmed.status).toBe(200);
    const adjacent = await createPending("15:00", "17:00");
    const adjacentConfirmed = await confirm(adjacent);
    expect(adjacentConfirmed.status).toBe(200);

    const overlap = await createPending("18:00", "20:00");
    const concurrentOverlap = await createPending("19:00", "21:00");
    const results = await Promise.all([confirm(overlap), confirm(concurrentOverlap)]);
    expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
  });

  it("scopes dashboard summaries and wishlists to the verified user", async () => {
    const summary = await owner
      .get("/api/dashboard/summary")
      .set("Origin", origin);
    expect(summary.status).toBe(200);
    expect(summary.body.stats.totalListings).toBeGreaterThanOrEqual(1);
    expect(summary.body.stats.confirmedBookings).toBeGreaterThanOrEqual(1);

    const saved = await customer
      .post(`/api/wishlist/${studioId}`)
      .set("Origin", origin);
    expect(saved.status).toBe(204);
    const customerWishlist = await customer.get("/api/wishlist").set("Origin", origin);
    const strangerWishlist = await stranger.get("/api/wishlist").set("Origin", origin);
    expect(customerWishlist.body.studios.map((studio: { id: string }) => studio.id)).toContain(studioId);
    expect(strangerWishlist.body.studios.map((studio: { id: string }) => studio.id)).not.toContain(studioId);
  });

  it("marks sample studios and prevents booking them", async () => {
    const sample = await database.collection("studios").insertOne({
      ...studioInput("Sample-only studio"),
      ownerId: "studiospace-demo-host",
      ownerName: "StudioSpace Demo Host",
      ownerEmail: "demo-host@example.invalid",
      rating: 4.8,
      demoKey: "qa-sample-only",
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const details = await supertest(app)
      .get(`/api/studios/${sample.insertedId.toString()}`)
      .set("Origin", origin);
    expect(details.status).toBe(200);
    expect(details.body.studio.isDemo).toBe(true);

    const booking = await customer
      .post("/api/bookings")
      .set("Origin", origin)
      .send({
        studioId: sample.insertedId.toString(),
        bookingDate,
        startTime: "08:00",
        endTime: "09:00",
      });
    expect(booking.status).toBe(409);
  });
});

async function register(agent: Agent, email: string, name: string): Promise<void> {
  const response = await agent
    .post("/api/auth/sign-up/email")
    .set("Origin", origin)
    .send({ name, email, password: testPassword });
  expect(response.status).toBe(200);
  expect(response.body.user?.email).toBe(email);
}

function studioInput(title: string) {
  return {
    title,
    category: "Photo Studios",
    hourlyRate: 70,
    securityDeposit: 100,
    maxCapacity: 6,
    location: "QA Test City",
    imageUrl: "https://example.com/qa-studio.jpg",
    amenities: ["Wi-Fi"],
    description: "A private integration test studio with the required description length.",
  };
}

function futureDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function pastDateString(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
