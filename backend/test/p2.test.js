// P2 features: request schema validation (E3), realtime change notifications
// instead of polling (D7), read receipts (F3) and the preset avatar list (E4).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  connectSocket,
  createUser,
  emitWithAck,
  login,
  sleep,
  startTestServer,
  uniqueEmail,
} from "./helpers.js";

let ctx;
let call;
const users = {};

before(async () => {
  ctx = await startTestServer("lofitalk-test-p2");
  call = api(ctx.baseUrl);
  for (const [name, accountType] of [
    ["alice", "standard"],
    ["bob", "standard"],
    ["admin", "admin"],
  ]) {
    const email = uniqueEmail(name);
    const user = await createUser({ email, accountType });
    users[name] = { id: user._id.toString(), email, cookie: await login(call, email) };
  }
});
after(() => ctx.close());

const waitFor = async (predicate, timeoutMs = 2000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return true;
    await sleep(25);
  }
  return false;
};

describe("schema validation", () => {
  test("rejects wrong types and oversized fields with a readable 400", async () => {
    const longSituation = await call("POST", "/api/tarot/reading", {
      cookie: users.alice.cookie,
      body: { currentSituation: "x".repeat(1001), questions: ["a", "b", "c"], cards: ["a", "b", "c"] },
    });
    assert.equal(longSituation.status, 400);
    assert.equal(longSituation.body.code, "INVALID_INPUT");
    assert.match(longSituation.body.message, /currentSituation.*at most 1000/);
    assert.equal(longSituation.body.errors[0].path, "currentSituation");

    const twoQuestions = await call("POST", "/api/tarot/reading", {
      cookie: users.alice.cookie,
      body: { currentSituation: "s", questions: ["a", "b"], cards: ["a", "b", "c"] },
    });
    assert.equal(twoQuestions.status, 400);
    assert.match(twoQuestions.body.message, /exactly 3/);

    const arrayQuery = await call("GET", "/api/users?gender=male&gender=female", {
      cookie: users.alice.cookie,
    });
    assert.equal(arrayQuery.status, 400);

    const badMessage = await call("POST", "/api/chat/messages", {
      cookie: users.alice.cookie,
      body: { toUserId: users.bob.id, text: "x".repeat(1001) },
    });
    assert.equal(badMessage.status, 400);

    const badRole = await call("PUT", `/api/admin/users/${users.bob.id}/account-type`, {
      cookie: users.admin.cookie,
      body: { accountType: "superuser" },
    });
    assert.equal(badRole.status, 400);
    assert.match(badRole.body.message, /standard, plus, admin/);
  });

  test("keeps accepting valid requests, unknown extra fields and legacy short passwords", async () => {
    const onboarding = await call("POST", "/api/auth/onboarding", {
      cookie: users.alice.cookie,
      body: {
        fullName: "Alice",
        gender: "female",
        birthDate: "2000-01-01",
        country: "Vietnam",
        city: "Hanoi",
        hobbies: "Reading",
        someFutureField: true,
      },
    });
    assert.equal(onboarding.status, 200);

    const legacyEmail = uniqueEmail("legacy");
    await createUser({ email: legacyEmail, password: "abc123" }); // created before the 8-char rule
    const legacyLogin = await call("POST", "/api/auth/login", {
      body: { email: legacyEmail, password: "abc123" },
    });
    assert.equal(legacyLogin.status, 200);

    const filtered = await call("GET", "/api/users?gender=female&hobby=Reading", {
      cookie: users.bob.cookie,
    });
    assert.equal(filtered.status, 200);
  });
});

describe("realtime change notifications", () => {
  test("friend request changes reach both users; reports reach admins only", async () => {
    const alice = await connectSocket(ctx.baseUrl, users.alice.cookie);
    const bob = await connectSocket(ctx.baseUrl, users.bob.cookie);
    const admin = await connectSocket(ctx.baseUrl, users.admin.cookie);
    const got = { alice: [], bob: [], admin: [] };
    alice.on("notify:changed", ({ topic }) => got.alice.push(topic));
    bob.on("notify:changed", ({ topic }) => got.bob.push(topic));
    admin.on("notify:changed", ({ topic }) => got.admin.push(topic));
    try {
      const sent = await call("POST", `/api/users/friend-request/${users.bob.id}`, {
        cookie: users.alice.cookie,
      });
      assert.equal(sent.status, 201);
      assert.ok(await waitFor(() => got.alice.includes("friendRequests") && got.bob.includes("friendRequests")));
      assert.deepEqual(got.admin, [], "unrelated users get nothing");

      const accepted = await call("PUT", `/api/users/friend-request/${sent.body._id}/accept`, {
        cookie: users.bob.cookie,
      });
      assert.equal(accepted.status, 200);
      assert.ok(await waitFor(() => got.alice.length === 2 && got.bob.length === 2));

      const report = await call("POST", `/api/users/report/${users.bob.id}`, {
        cookie: users.alice.cookie,
        body: { message: "test report" },
      });
      assert.equal(report.status, 201);
      assert.ok(await waitFor(() => got.admin.includes("reports")));
      assert.ok(!got.alice.includes("reports") && !got.bob.includes("reports"));
    } finally {
      alice.disconnect();
      bob.disconnect();
      admin.disconnect();
    }
  });
});

describe("read receipts", () => {
  test("the sender is told when the partner reads the thread", async () => {
    const alice = await connectSocket(ctx.baseUrl, users.alice.cookie);
    const bob = await connectSocket(ctx.baseUrl, users.bob.cookie);
    try {
      const sent = await emitWithAck(alice, "chat:send-message", { text: "seen?", toUserId: users.bob.id });
      assert.equal(sent.ok, true);
      const { threadId } = sent;
      alice.emit("chat:join", { threadId });
      await sleep(200);

      const reads = [];
      alice.on("chat:read", (payload) => reads.push(payload));
      bob.emit("chat:join", { threadId });
      bob.emit("chat:mark-read", { threadId });
      assert.ok(await waitFor(() => reads.some((r) => r.userId === users.bob.id)));

      const messages = await call("GET", `/api/chat/threads/${threadId}/messages`, {
        cookie: users.alice.cookie,
      });
      const mine = messages.body.messages.find((m) => m.text === "seen?");
      assert.ok(mine.readBy.includes(users.bob.id));
    } finally {
      alice.disconnect();
      bob.disconnect();
    }
  });
});

describe("preset avatars", () => {
  test("GET /api/meta/avatars lists boy and girl presets as absolute URLs", async () => {
    const response = await call("GET", "/api/meta/avatars");
    assert.equal(response.status, 200);
    assert.equal(response.body.boy.length, 50);
    assert.equal(response.body.girl.length, 50);
    assert.match(response.body.boy[0], /^https?:\/\/.+\/static\/avatars\/boy\/AV\d+\.png$/);
  });
});

describe("web push", () => {
  test("subscriptions are validated and offline recipients get a push, online ones do not", async () => {
    const { default: webpush } = await import("web-push");
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.VAPID_SUBJECT = "mailto:test@example.com";
    const push = await import("../src/lib/pushService.js");
    const sent = [];
    let failWith = null;
    push.setPushSenderForTests(async (subscription, payload) => {
      if (failWith) {
        const error = new Error("gone");
        error.statusCode = failWith;
        throw error;
      }
      sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) });
    });

    const config = await call("GET", "/api/push/config");
    assert.equal(config.body.enabled, true);
    assert.equal(config.body.publicKey, keys.publicKey);

    const insecure = await call("POST", "/api/push/subscriptions", {
      cookie: users.bob.cookie,
      body: { endpoint: "http://push.example.com/abc", keys: { p256dh: "k", auth: "a" } },
    });
    assert.equal(insecure.status, 400);

    const endpoint = "https://push.example.com/bob-browser";
    const subscribed = await call("POST", "/api/push/subscriptions", {
      cookie: users.bob.cookie,
      body: { endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } },
    });
    assert.equal(subscribed.status, 201);

    // Bob has no socket open: Alice's message becomes a push.
    const offline = await call("POST", "/api/chat/messages", {
      cookie: users.alice.cookie,
      body: { toUserId: users.bob.id, text: "are you there?" },
    });
    assert.equal(offline.status, 201);
    assert.ok(await waitFor(() => sent.length === 1));
    assert.equal(sent[0].endpoint, endpoint);
    assert.equal(sent[0].payload.body, "are you there?");
    assert.equal(sent[0].payload.url, `/chat/${users.alice.id}`);

    // Bob opens the app: no push, the message arrives in the app.
    const bob = await connectSocket(ctx.baseUrl, users.bob.cookie);
    try {
      await call("POST", "/api/chat/messages", {
        cookie: users.alice.cookie,
        body: { toUserId: users.bob.id, text: "now online" },
      });
      await sleep(300);
      assert.equal(sent.length, 1);
    } finally {
      bob.disconnect();
    }
    await sleep(200);

    // The push service says the subscription is gone: it is removed.
    failWith = 410;
    await call("POST", "/api/chat/messages", {
      cookie: users.alice.cookie,
      body: { toUserId: users.bob.id, text: "gone?" },
    });
    const { default: PushSubscription } = await import("../src/models/PushSubscription.js");
    await sleep(300);
    assert.equal(await PushSubscription.countDocuments({ endpoint }), 0);

    // Logging out on that browser removes the subscription too.
    failWith = null;
    await call("POST", "/api/push/subscriptions", {
      cookie: users.bob.cookie,
      body: { endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } },
    });
    const removed = await call("DELETE", "/api/push/subscriptions", {
      cookie: users.bob.cookie,
      body: { endpoint },
    });
    assert.equal(removed.status, 200);
    assert.equal(await PushSubscription.countDocuments({ endpoint }), 0);
  });
});
