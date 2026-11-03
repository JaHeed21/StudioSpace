import "dotenv/config";

type TestUser = { email: string; cookies: Map<string, string> };

const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const frontendOrigin = process.env.WEB_ORIGIN?.split(",")[0] ?? "http://localhost:3000";
const password = "StudioTest8";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cookieHeader(user: TestUser): string {
  return [...user.cookies.values()].join("; ");
}

function captureCookies(user: TestUser, response: Response): void {
  for (const value of response.headers.getSetCookie()) {
    const [pair, ...attributes] = value.split(";");
    if (!pair) continue;
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    if (attributes.some((attribute) => /^max-age=0$/i.test(attribute.trim()))) {
      user.cookies.delete(name);
    } else {
      user.cookies.set(name, pair.trim());
    }
  }
}

async function request(
  path: string,
  user?: TestUser,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("origin", frontendOrigin);
  if (options.body) headers.set("content-type", "application/json");
  if (user && user.cookies.size) headers.set("cookie", cookieHeader(user));
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  if (user) captureCookies(user, response);
  return response;
}

async function register(email: string, name: string): Promise<TestUser> {
  const user: TestUser = { email, cookies: new Map() };
  const response = await request("/api/auth/sign-up/email", user, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  assert(response.ok, `Could not register ${email}: HTTP ${response.status}`);
  assert(user.cookies.size > 0, "Registration did not establish the test user's session.");
  return user;
}

function futureDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function run(): Promise<void> {
  const testId = `${Date.now()}`;
  const bookingDate = futureDate(2);
  let studioId = "64b000000000000000000001";
  const payload = (startTime: string, endTime: string, extra: Record<string, unknown> = {}) => ({
    studioId,
    bookingDate,
    startTime,
    endTime,
    ...extra,
  });

  const unauthenticated = await request("/api/bookings", undefined, {
    method: "POST",
    body: JSON.stringify(payload("09:00", "10:00")),
  });
  assert(unauthenticated.status === 401, "Unauthenticated booking request must return 401.");
  console.info("PASS: unauthenticated booking rejected");
  const unauthenticatedDashboard = await request("/api/dashboard/summary");
  assert(unauthenticatedDashboard.status === 401, "Dashboard summary must require authentication.");
  const unauthenticatedWishlist = await request("/api/wishlist");
  assert(unauthenticatedWishlist.status === 401, "Wishlist must require authentication.");
  console.info("PASS: dashboard and wishlist require authentication");

  const owner = await register(`booking-host-${testId}@example.com`, "Booking Test Host");
  const customer = await register(`booking-customer-${testId}@example.com`, "Booking Test Customer");
  const stranger = await register(`booking-stranger-${testId}@example.com`, "Booking Test Stranger");

  const createdStudioResponse = await request("/api/studios", owner, {
    method: "POST",
    body: JSON.stringify({
      title: `Booking Test Studio ${testId}`,
      category: "Photo Studios",
      hourlyRate: 70,
      securityDeposit: 100,
      maxCapacity: 6,
      location: "Test Booking City",
      imageUrl: "https://example.com/booking-test.jpg",
      amenities: ["Wi-Fi"],
      description: "A test studio for verifying booking reservation behavior.",
    }),
  });
  assert(createdStudioResponse.status === 201, `Test studio create failed: ${createdStudioResponse.status}`);
  const { studio } = (await createdStudioResponse.json()) as { studio: { id: string } };
  assert(studio.id, "Test studio did not return an ID.");
  studioId = studio.id;

  const reversedTime = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("11:00", "10:00")),
  });
  assert(reversedTime.status === 400, "End time before start time must be rejected.");
  console.info("PASS: invalid time rejected");

  const pastDate = new Date();
  pastDate.setUTCDate(pastDate.getUTCDate() - 1);
  const pastResponse = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify({ ...payload("09:00", "10:00"), bookingDate: pastDate.toISOString().slice(0, 10) }),
  });
  assert(pastResponse.status === 400, "Past booking date must be rejected.");
  console.info("PASS: past date rejected");

  const missingStudio = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify({ ...payload("09:00", "10:00"), studioId: "64b000000000000000000001" }),
  });
  assert(missingStudio.status === 404, "Booking for missing studio must return 404.");
  console.info("PASS: missing studio rejected");

  const demoStudio = await request("/api/studios/featured");
  if (demoStudio.ok) {
    const featuredBody = (await demoStudio.json()) as {
      studios: Array<{ id: string; isDemo?: boolean }>;
    };
    const sample = featuredBody.studios.find((studio) => studio.isDemo);
    if (sample) {
      const demoBooking = await request("/api/bookings", customer, {
        method: "POST",
        body: JSON.stringify({ studioId: sample.id, bookingDate, startTime: "09:00", endTime: "10:00" }),
      });
      assert(demoBooking.status === 409, "Sample studios must not accept booking requests.");
    }
  }

  const forgedPrice = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("09:00", "11:00", { hourlyRate: 1, totalAmount: 1 })),
  });
  assert(forgedPrice.status === 400, "Client-supplied booking prices must be rejected.");
  console.info("PASS: client cannot submit booking prices");

  const created = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("09:00", "11:00")),
  });
  assert(created.status === 201, `Valid booking failed with HTTP ${created.status}.`);
  const { booking: first } = (await created.json()) as {
    booking: { id: string; status: string; totalHours: number; hourlyRate: number; securityDeposit: number; rentalCost: number; totalAmount: number };
  };
  assert(first.status === "Pending", "New booking must be Pending.");
  assert(first.totalHours === 2 && first.hourlyRate === 70, "Booking duration or actual hourly rate is incorrect.");
  assert(first.securityDeposit === 100 && first.rentalCost === 140 && first.totalAmount === 240, "Server-side booking price calculation is incorrect.");
  console.info("PASS: booking creation and server-side price calculation");

  const dashboardSummaryResponse = await request("/api/dashboard/summary", owner);
  assert(dashboardSummaryResponse.ok, `Dashboard summary failed: ${dashboardSummaryResponse.status}`);
  const dashboardSummary = (await dashboardSummaryResponse.json()) as {
    stats: { totalListings: number; activeListings: number; totalBookings: number; pendingBookings: number };
    recentActivity: Array<{ id: string }>;
  };
  assert(
    dashboardSummary.stats.totalListings >= 1 &&
      dashboardSummary.stats.activeListings >= 1 &&
      dashboardSummary.stats.totalBookings >= 1 &&
      dashboardSummary.stats.pendingBookings >= 1 &&
      dashboardSummary.recentActivity.some((activity) => activity.id === first.id),
    "Dashboard summary omitted current database listing or booking data.",
  );
  console.info("PASS: dashboard statistics and recent activity reflect database records");

  const wishlistAdd = await request(`/api/wishlist/${studio.id}`, customer, { method: "POST" });
  assert(wishlistAdd.status === 204, `Adding studio to wishlist failed: ${wishlistAdd.status}`);
  const wishlistRead = await request("/api/wishlist", customer);
  assert(wishlistRead.ok, "Wishlist read failed.");
  const wishlistBody = (await wishlistRead.json()) as { studios: Array<{ id: string }> };
  assert(wishlistBody.studios.some((saved) => saved.id === studio.id), "Wishlist omitted the saved studio.");
  const strangerWishlist = await request("/api/wishlist", stranger);
  assert(strangerWishlist.ok, "Another user should be able to read their own empty wishlist.");
  const strangerWishlistBody = (await strangerWishlist.json()) as { studios: Array<{ id: string }> };
  assert(!strangerWishlistBody.studios.some((saved) => saved.id === studio.id), "Wishlist leaked another user's saved studio.");
  const wishlistRemove = await request(`/api/wishlist/${studio.id}`, customer, { method: "DELETE" });
  assert(wishlistRemove.status === 204, "Removing studio from wishlist failed.");
  console.info("PASS: wishlist ownership and CRUD");

  const forbiddenStatus = await request(`/api/bookings/${first.id}/status`, customer, {
    method: "PATCH",
    body: JSON.stringify({ status: "Confirmed" }),
  });
  assert(forbiddenStatus.status === 403, "Customer must not be allowed to update booking status.");
  console.info("PASS: unauthorized status update rejected");

  const hostBookings = await request("/api/bookings", owner);
  assert(hostBookings.ok, "Host booking list request failed.");
  const hostList = (await hostBookings.json()) as { bookings: Array<{ id: string }> };
  assert(hostList.bookings.some((booking) => booking.id === first.id), "Host listing omitted its studio booking.");

  const confirmation = await request(`/api/bookings/${first.id}/status`, owner, {
    method: "PATCH",
    body: JSON.stringify({ status: "Confirmed" }),
  });
  assert(confirmation.ok, `Host could not confirm booking: ${confirmation.status}`);
  console.info("PASS: authorized host confirmation");

  const overlap = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("10:30", "11:30")),
  });
  assert(overlap.status === 409, "Overlapping confirmed booking must return 409.");
  console.info("PASS: overlapping confirmed booking rejected");

  const adjacent = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("11:00", "13:00")),
  });
  assert(adjacent.status === 201, `Non-overlapping adjacent booking failed: ${adjacent.status}`);
  console.info("PASS: non-overlapping booking accepted");

  const cancelCandidate = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("13:00", "14:00")),
  });
  assert(cancelCandidate.status === 201, "Could not create cancellation test booking.");
  const { booking: pendingToCancel } = (await cancelCandidate.json()) as { booking: { id: string } };

  const unauthorizedCancel = await request(`/api/bookings/${pendingToCancel.id}/cancel`, stranger, {
    method: "PATCH",
  });
  assert(unauthorizedCancel.status === 403, "Unrelated user must not cancel another customer's booking.");

  const cancellation = await request(`/api/bookings/${pendingToCancel.id}/cancel`, customer, {
    method: "PATCH",
  });
  assert(cancellation.ok, `Customer cancellation failed: ${cancellation.status}`);
  const cancelledBody = (await cancellation.json()) as { booking: { status: string } };
  assert(cancelledBody.booking.status === "Cancelled", "Customer booking was not cancelled.");
  const rebookCancelledTime = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("13:00", "14:00")),
  });
  assert(rebookCancelledTime.status === 201, "Cancelled booking must not block a future reservation.");
  console.info("PASS: customer cancellation and unauthorized cancellation rejection");

  const raceOne = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("14:00", "16:00")),
  });
  const raceTwo = await request("/api/bookings", customer, {
    method: "POST",
    body: JSON.stringify(payload("15:00", "17:00")),
  });
  assert(raceOne.status === 201 && raceTwo.status === 201, "Could not create concurrent confirmation test bookings.");
  const raceOneBody = (await raceOne.json()) as { booking: { id: string } };
  const raceTwoBody = (await raceTwo.json()) as { booking: { id: string } };
  const concurrentResults = await Promise.all([
    request(`/api/bookings/${raceOneBody.booking.id}/status`, owner, {
      method: "PATCH",
      body: JSON.stringify({ status: "Confirmed" }),
    }),
    request(`/api/bookings/${raceTwoBody.booking.id}/status`, owner, {
      method: "PATCH",
      body: JSON.stringify({ status: "Confirmed" }),
    }),
  ]);
  const statuses = concurrentResults.map((response) => response.status).sort();
  assert(statuses[0] === 200 && statuses[1] === 409, `Concurrent overlapping confirmations should yield 200 and 409; received ${statuses.join(", ")}.`);
  console.info("PASS: concurrent overlapping confirmations are serialized");

  const deletedStudio = await request(`/api/studios/${studio.id}`, owner, { method: "DELETE" });
  assert(deletedStudio.status === 204, "Could not clean up booking test studio.");
}

run().catch((error: unknown) => {
  console.error("Booking integration test failed", error);
  process.exitCode = 1;
});
