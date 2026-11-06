import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { api, createUser, login, startTestServer, uniqueEmail } from "./helpers.js";

let ctx;
let call;

before(async () => {
  ctx = await startTestServer("lofitalk-test-auth");
  call = api(ctx.baseUrl);
});
after(() => ctx.close());

describe("signup with email verification", () => {
  test("creates the account only after the emailed code, with a normalized email", async () => {
    const { default: PendingSignup } = await import("../src/models/PendingSignup.js");
    const { default: User } = await import("../src/models/User.js");
    const typed = `  New.User.${Date.now()}@Example.COM `;
    const normalized = typed.trim().toLowerCase();

    const signup = await call("POST", "/api/auth/signup", {
      body: { email: typed, password: "Password123", fullName: "New User" },
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.cookie, "", "signup must not log in");
    assert.equal(await User.countDocuments({ email: normalized }), 0);

    const pending = await PendingSignup.findOne({ email: normalized });
    assert.ok(pending, "pending signup stored with lower-case email");

    const verify = await call("POST", "/api/auth/verify-code", {
      body: { email: normalized.toUpperCase(), code: pending.verificationCode },
    });
    assert.equal(verify.status, 200);
    assert.ok(verify.cookie.startsWith("jwt="));
    assert.equal(verify.body.token, undefined, "web clients get the cookie only");
    assert.equal((await User.findOne({ email: normalized })).isEmailVerified, true);
  });

  test("rejects passwords shorter than 8 characters", async () => {
    const response = await call("POST", "/api/auth/signup", {
      body: { email: uniqueEmail("short"), password: "Pass123", fullName: "Short" },
    });
    assert.equal(response.status, 400);
    assert.match(response.body.message, /at least 8/);
  });
});

describe("login", () => {
  test("works case-insensitively and returns the token in the body only for mobile", async () => {
    const email = uniqueEmail("login");
    await createUser({ email });

    const web = await call("POST", "/api/auth/login", {
      body: { email: email.toUpperCase(), password: "Password123" },
    });
    assert.equal(web.status, 200);
    assert.equal(web.body.token, undefined);
    assert.ok(web.cookie);

    const mobile = await call("POST", "/api/auth/login", {
      body: { email, password: "Password123" },
      headers: { "X-Client-Platform": "mobile" },
    });
    assert.equal(mobile.status, 200);
    assert.equal(typeof mobile.body.token, "string");
  });

  test("legacy mixed-case email can log in and is normalized on success", async () => {
    const { default: User } = await import("../src/models/User.js");
    const legacy = `Legacy.${Date.now()}@Example.com`;
    const user = await createUser({ email: legacy });

    const response = await call("POST", "/api/auth/login", {
      body: { email: legacy.toLowerCase(), password: "Password123" },
    });
    assert.equal(response.status, 200);
    assert.equal((await User.findById(user._id)).email, legacy.toLowerCase());
  });

  test("garbage or missing tokens get 401, not 500", async () => {
    assert.equal((await call("GET", "/api/auth/me", { cookie: "jwt=not.a.token" })).status, 401);
    assert.equal((await call("GET", "/api/auth/me")).status, 401);
  });

  test("10 failed attempts lock the account+IP pair (429)", async () => {
    const email = uniqueEmail("bruteforce");
    await createUser({ email });
    const statuses = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await call("POST", "/api/auth/login", { body: { email, password: "wrong-password" } })).status);
    }
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
    assert.equal(statuses[10], 429);
  });
});

describe("sessions and passwords", () => {
  test("changing the password logs out other sessions and keeps the current one", async () => {
    const email = uniqueEmail("change");
    await createUser({ email });
    const sessionA = await login(call, email);
    const sessionB = await login(call, email);

    const change = await call("PUT", "/api/auth/password", {
      cookie: sessionA,
      body: { currentPassword: "Password123", newPassword: "NewPassword456" },
    });
    assert.equal(change.status, 200);
    assert.ok(change.cookie && change.cookie !== sessionA);

    assert.equal((await call("GET", "/api/auth/me", { cookie: change.cookie })).status, 200);
    assert.equal((await call("GET", "/api/auth/me", { cookie: sessionB })).status, 401);
    assert.equal((await call("GET", "/api/auth/me", { cookie: sessionA })).status, 401);
  });

  test("reset code is voided after 5 wrong attempts; a correct reset ends all sessions", async () => {
    const { default: User } = await import("../src/models/User.js");
    const email = uniqueEmail("reset");
    await createUser({ email });
    const oldSession = await login(call, email);

    assert.equal((await call("POST", "/api/auth/forgot-password", { body: { email } })).status, 200);
    let user = await User.findOne({ email });
    const wrong = user.passwordResetCode === "000000" ? "111111" : "000000";
    let last;
    for (let i = 0; i < 5; i += 1) {
      last = await call("POST", "/api/auth/reset-password", {
        body: { email, code: wrong, newPassword: "NewPassword456" },
      });
    }
    assert.match(last.body.message, /Too many incorrect codes/);
    const voided = await call("POST", "/api/auth/reset-password", {
      body: { email, code: user.passwordResetCode, newPassword: "NewPassword456" },
    });
    assert.equal(voided.status, 400);

    await call("POST", "/api/auth/forgot-password", { body: { email } });
    user = await User.findOne({ email });
    const ok = await call("POST", "/api/auth/reset-password", {
      body: { email, code: user.passwordResetCode, newPassword: "NewPassword456" },
    });
    assert.equal(ok.status, 200);
    assert.equal((await call("GET", "/api/auth/me", { cookie: oldSession })).status, 401);
    assert.ok(await login(call, email, "NewPassword456"));
  });
});
