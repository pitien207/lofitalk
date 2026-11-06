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
  ctx = await startTestServer("lofitalk-test-chat");
  call = api(ctx.baseUrl);
  for (const name of ["alice", "bob", "eve"]) {
    const email = uniqueEmail(name);
    const user = await createUser({ email });
    users[name] = { id: user._id.toString(), cookie: await login(call, email) };
  }
});
after(() => ctx.close());

describe("chat authorization", () => {
  test("only participants can join, post to or mark a thread", async () => {
    const alice = await connectSocket(ctx.baseUrl, users.alice.cookie);
    const bob = await connectSocket(ctx.baseUrl, users.bob.cookie);
    const eve = await connectSocket(ctx.baseUrl, users.eve.cookie);
    try {
      const first = await emitWithAck(alice, "chat:send-message", { text: "hi bob", toUserId: users.bob.id });
      assert.equal(first.ok, true);
      const threadId = first.threadId;

      const bobGot = [];
      const eveGot = [];
      bob.on("chat:message:new", (payload) => bobGot.push(payload.message.text));
      eve.on("chat:message:new", (payload) => eveGot.push(payload.message.text));
      bob.emit("chat:join", { threadId });
      eve.emit("chat:join", { threadId });
      await sleep(300);

      await emitWithAck(alice, "chat:send-message", { text: "private", threadId });
      await sleep(300);
      assert.deepEqual(bobGot, ["private"]);
      assert.deepEqual(eveGot, [], "outsider must not receive thread messages");

      const injected = await emitWithAck(eve, "chat:send-message", { text: "spoof", threadId });
      assert.equal(injected.error, "Conversation not found");

      const rest = await call("POST", "/api/chat/messages", {
        cookie: users.eve.cookie,
        body: { text: "spoof", threadId },
      });
      assert.equal(rest.status, 404);
      assert.equal(
        (await call("POST", `/api/chat/threads/${threadId}/read`, { cookie: users.eve.cookie })).status,
        404
      );
      assert.equal(
        (await call("GET", `/api/chat/threads/${threadId}/messages`, { cookie: users.eve.cookie })).status,
        404
      );

      const mismatch = await emitWithAck(alice, "chat:send-message", {
        text: "x",
        threadId,
        toUserId: users.eve.id,
      });
      assert.match(mismatch.error, /does not match/);
      assert.equal(
        (await call("GET", `/api/chat/threads/${threadId}/messages`, { cookie: users.bob.cookie })).status,
        200
      );
    } finally {
      [alice, bob, eve].forEach((socket) => socket.close());
    }
  });

  test("message bursts are rate limited per user", async () => {
    const alice = await connectSocket(ctx.baseUrl, users.alice.cookie);
    try {
      const acks = [];
      for (let i = 0; i < 25; i += 1) {
        acks.push(await emitWithAck(alice, "chat:send-message", { text: `m${i}`, toUserId: users.bob.id }));
      }
      assert.ok(acks.some((ack) => ack.code === "RATE_LIMITED"));
      assert.ok(acks.filter((ack) => ack.ok).length <= 20);
    } finally {
      alice.close();
    }
  });
});
