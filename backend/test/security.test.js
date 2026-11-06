import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { api, createUser, login, startTestServer, uniqueEmail } from "./helpers.js";

let ctx;
let call;
let cookie;

before(async () => {
  ctx = await startTestServer("lofitalk-test-security");
  call = api(ctx.baseUrl);
  const email = uniqueEmail("sec");
  await createUser({ email });
  cookie = await login(call, email);
});
after(() => ctx.close());

describe("input validation", () => {
  test("MongoDB operators in JSON bodies are rejected", async () => {
    const response = await call("POST", "/api/auth/login", {
      body: { email: { $ne: null }, password: "x" },
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "INVALID_INPUT");
  });

  test("operators in query strings are rejected", async () => {
    assert.equal((await call("GET", "/api/users?gender[$ne]=x", { cookie })).status, 400);
  });

  test("__proto__ keys are rejected", async () => {
    const response = await call("POST", "/api/auth/login", {
      body: '{"__proto__": {"admin": true}, "email": "a@b.c", "password": "x"}',
    });
    assert.equal(response.status, 400);
  });

  test("credential fields must be plain values", async () => {
    const response = await call("POST", "/api/auth/login", { body: { email: ["a@b.c"], password: "x" } });
    assert.equal(response.status, 400);
  });

  test("malformed ids return 400 instead of 500", async () => {
    assert.equal((await call("GET", "/api/users/profile/not-an-id", { cookie })).status, 400);
    assert.equal((await call("GET", "/api/chat/threads/xyz/messages", { cookie })).status, 400);
  });
});

describe("headers and health", () => {
  test("security headers are set and X-Powered-By is hidden", async () => {
    const response = await call("GET", "/api/health");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const csp = response.headers.get("content-security-policy") || "";
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /connect-src 'self' ws:\/\/localhost:5173/);
    assert.doesNotMatch(csp, /upgrade-insecure-requests/, "only added when all origins are https");
  });

  test("liveness and readiness endpoints", async () => {
    assert.deepEqual((await call("GET", "/api/health")).body, { status: "ok" });
    const ready = await call("GET", "/api/health/ready");
    assert.equal(ready.status, 200);
    assert.equal(ready.body.database, "up");
  });
});
