import "dotenv/config";

const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const frontendOrigin = process.env.WEB_ORIGIN?.split(",")[0] ?? "http://localhost:3000";
const email = `auth-test-${Date.now()}@example.com`;
const password = "StudioTest8";
const cookies = new Map<string, string>();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cookieHeader(): string {
  return [...cookies.values()].join("; ");
}

function captureCookies(response: Response): void {
  for (const value of response.headers.getSetCookie()) {
    const [pair, ...attributes] = value.split(";");
    if (!pair) continue;
    const separator = pair?.indexOf("=") ?? -1;
    if (separator <= 0) continue;

    const name = pair.slice(0, separator).trim();
    const expires = attributes.some((attribute) => /^max-age=0$/i.test(attribute.trim()));
    if (expires) cookies.delete(name);
    else cookies.set(name, pair.trim());
  }
}

async function request(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("origin", frontendOrigin);
  if (options.body) headers.set("content-type", "application/json");
  if (authenticated && cookies.size > 0) headers.set("cookie", cookieHeader());

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  captureCookies(response);
  return response;
}

async function run(): Promise<void> {
  const weakPasswordResponse = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: "Weak Password",
      email: `weak-${Date.now()}@example.com`,
      password: "short",
    }),
  });
  assert(!weakPasswordResponse.ok, "Registration must reject passwords under 6 characters.");
  console.info("PASS: invalid password rejected");

  const registration = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: "StudioSpace Test",
      email,
      password,
      image: "https://example.com/profile.png",
    }),
  });
  assert(registration.ok, `Registration failed with HTTP ${registration.status}.`);
  const registrationBody = (await registration.json()) as {
    user?: { id?: string; email?: string };
  };
  assert(registrationBody.user?.id, "Registration did not return a user.");
  assert(registrationBody.user.email === email, "Registration returned an unexpected user.");
  console.info("PASS: email registration");

  const invalidLogin = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "WrongPass8" }),
  });
  assert(!invalidLogin.ok, "Invalid credentials must not sign in.");
  console.info("PASS: invalid login rejected");

  const unauthenticated = await request("/api/me");
  assert(unauthenticated.status === 401, `Expected unauthenticated API to return 401, got ${unauthenticated.status}.`);
  console.info("PASS: protected API rejects unauthenticated request");

  const login = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.ok, `Email/password login failed with HTTP ${login.status}.`);
  assert(cookies.size > 0, "Login did not set a session cookie.");
  console.info("PASS: email/password login and session cookie");

  const sessionAfterLogin = await request("/api/auth/get-session", {}, true);
  assert(sessionAfterLogin.ok, `Session lookup failed with HTTP ${sessionAfterLogin.status}.`);
  const firstSession = (await sessionAfterLogin.json()) as {
    user?: { id?: string; email?: string };
  };
  assert(firstSession.user?.id === registrationBody.user.id, "Session user differs from signed-in user.");

  const sessionAfterReload = await request("/api/auth/get-session", {}, true);
  const persistedSession = (await sessionAfterReload.json()) as {
    user?: { id?: string };
  };
  assert(
    persistedSession.user?.id === firstSession.user.id,
    "Session did not persist across separate requests.",
  );
  console.info("PASS: session persists across requests");

  const protectedResponse = await request("/api/me", {}, true);
  assert(protectedResponse.ok, `Authenticated API returned HTTP ${protectedResponse.status}.`);
  const protectedBody = (await protectedResponse.json()) as {
    user?: { id?: string; email?: string };
  };
  assert(protectedBody.user?.id === registrationBody.user.id, "API returned an unexpected identity.");
  assert(protectedBody.user.email === email, "API identity was not taken from the verified session.");
  console.info("PASS: protected API accepts verified session");

  const forbidden = await request("/api/admin", {}, true);
  assert(forbidden.status === 403, `Expected non-admin user to receive 403, got ${forbidden.status}.`);
  console.info("PASS: authenticated user without role receives 403");

  const unauthenticatedCreate = await request("/api/studios", {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert(unauthenticatedCreate.status === 401, "Studio creation must require authentication.");

  const studioInput = {
    title: "Test Cyclorama Studio",
    category: "Photo Studios",
    hourlyRate: 85,
    securityDeposit: 150,
    maxCapacity: 8,
    location: "Brooklyn, NY",
    imageUrl: "https://example.com/studio.jpg",
    amenities: ["Natural light", "Cyclorama wall"],
    description: "A bright test studio with space for a complete creative crew.",
  };
  const invalidStudio = await request("/api/studios", {
    method: "POST",
    body: JSON.stringify({ ...studioInput, ownerId: "forged-owner" }),
  }, true);
  assert(invalidStudio.status === 400, "Studio creation must validate request fields and reject owner data.");
  console.info("PASS: studio validation rejects invalid and forged ownership fields");

  const createResponse = await request("/api/studios", {
    method: "POST",
    body: JSON.stringify(studioInput),
  }, true);
  assert(createResponse.status === 201, `Studio creation failed with HTTP ${createResponse.status}.`);
  const createdBody = (await createResponse.json()) as {
    studio?: { id?: string; ownerId?: string; ownerEmail?: string; title?: string };
  };
  const createdStudio = createdBody.studio;
  assert(createdStudio, "Studio creation did not return a studio.");
  const studioId = createdStudio.id;
  assert(studioId, "Studio creation did not return an ID.");
  assert(createdStudio.ownerId === registrationBody.user.id, "Studio owner was not derived from the session.");
  assert(!("ownerEmail" in createdStudio), "Public studio response must not expose owner email.");
  console.info("PASS: authenticated studio creation derives owner from session");

  const detailsResponse = await request(`/api/studios/${studioId}`);
  assert(detailsResponse.ok, `Studio detail returned HTTP ${detailsResponse.status}.`);
  const details = (await detailsResponse.json()) as { studio?: { title?: string } };
  assert(details.studio?.title === studioInput.title, "Studio detail did not return the created listing.");

  const browseResponse = await request("/api/studios?search=Brooklyn&minPrice=80&sort=price_asc");
  assert(browseResponse.ok, `Studio browse returned HTTP ${browseResponse.status}.`);
  const browseBody = (await browseResponse.json()) as {
    studios?: Array<{ id?: string }>;
    pagination?: { total?: number };
  };
  assert(browseBody.studios?.some((studio) => studio.id === studioId), "Filtered browse omitted the created studio.");
  assert(typeof browseBody.pagination?.total === "number", "Browse response omitted pagination.");
  console.info("PASS: public studio read and filtering");

  const myListingsResponse = await request("/api/studios/my-listings", {}, true);
  assert(myListingsResponse.ok, `Owner listing request returned HTTP ${myListingsResponse.status}.`);
  const myListings = (await myListingsResponse.json()) as {
    studios?: Array<{ id?: string }>;
  };
  assert(myListings.studios?.some((studio) => studio.id === studioId), "Owner listings omitted the new studio.");

  const otherRegistration = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: "Other Studio Owner",
      email: `other-${Date.now()}@example.com`,
      password,
    }),
  });
  assert(otherRegistration.ok, `Second test account registration failed with HTTP ${otherRegistration.status}.`);

  const unauthorizedPatch = await request(`/api/studios/${studioId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "Changed by another user" }),
  }, true);
  assert(unauthorizedPatch.status === 403, `Expected unauthorized update to return 403, got ${unauthorizedPatch.status}.`);
  const unauthorizedDelete = await request(`/api/studios/${studioId}`, { method: "DELETE" }, true);
  assert(unauthorizedDelete.status === 403, `Expected unauthorized delete to return 403, got ${unauthorizedDelete.status}.`);
  console.info("PASS: non-owners cannot update or delete listings");

  const ownerLogin = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(ownerLogin.ok, "Owner could not re-authenticate for edit/delete tests.");
  const updateResponse = await request(`/api/studios/${studioId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "Updated Test Cyclorama Studio" }),
  }, true);
  assert(updateResponse.ok, `Owner update failed with HTTP ${updateResponse.status}.`);
  const updatedBody = (await updateResponse.json()) as { studio?: { title?: string } };
  assert(updatedBody.studio?.title === "Updated Test Cyclorama Studio", "Owner update was not persisted.");

  const deleteResponse = await request(`/api/studios/${studioId}`, { method: "DELETE" }, true);
  assert(deleteResponse.status === 204, `Owner delete failed with HTTP ${deleteResponse.status}.`);
  const deletedRead = await request(`/api/studios/${studioId}`);
  assert(deletedRead.status === 404, "Deleted studio should return 404.");
  console.info("PASS: owner update and delete lifecycle");

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const google = await request("/api/auth/sign-in/social", {
      method: "POST",
      body: JSON.stringify({
        provider: "google",
        callbackURL: `${frontendOrigin}/dashboard`,
      }),
    });
    assert(google.ok, `Google OAuth initialization failed with HTTP ${google.status}.`);
    const googleBody = (await google.json()) as { url?: string };
    assert(googleBody.url?.startsWith("https://accounts.google.com/"), "Google did not return an OAuth URL.");
    console.info("PASS: Google OAuth authorization URL");
  } else {
    console.info("SKIP: Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  const logout = await request("/api/auth/sign-out", { method: "POST" }, true);
  assert(logout.ok, `Logout failed with HTTP ${logout.status}.`);
  const sessionAfterLogout = await request("/api/auth/get-session", {}, true);
  const clearedSession = await sessionAfterLogout.json();
  assert(clearedSession === null, "Session remained active after logout.");
  const protectedAfterLogout = await request("/api/me", {}, true);
  assert(protectedAfterLogout.status === 401, "Protected API still accepted a logged-out session.");
  console.info("PASS: logout revokes the session");
}

run().catch((error: unknown) => {
  console.error("Authentication integration test failed", error);
  process.exitCode = 1;
});
