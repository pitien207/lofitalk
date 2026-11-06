import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { api, connectSocket, createUser, login, startTestServer, uniqueEmail } from "./helpers.js";

let ctx;
let call;
let adminCookie;
let adminId;

before(async () => {
  ctx = await startTestServer("lofitalk-test-admin");
  call = api(ctx.baseUrl);
  const email = uniqueEmail("admin");
  const admin = await createUser({ email, accountType: "admin" });
  adminId = admin._id.toString();
  adminCookie = await login(call, email);
});
after(() => ctx.close());

describe("account suspension", () => {
  test("suspending ends sessions, blocks login and sockets; lifting restores access", async () => {
    const email = uniqueEmail("member");
    const member = await createUser({ email });
    const session = await login(call, email);

    const ban = await call("PUT", `/api/admin/users/${member._id}/ban`, {
      cookie: adminCookie,
      body: { days: 7, reason: "spam" },
    });
    assert.equal(ban.status, 200);
    assert.ok(new Date(ban.body.user.bannedUntil) > new Date());

    assert.equal((await call("GET", "/api/auth/me", { cookie: session })).status, 401, "old session ended");
    const relogin = await call("POST", "/api/auth/login", { body: { email, password: "Password123" } });
    assert.equal(relogin.status, 403);
    assert.equal(relogin.body.code, "ACCOUNT_SUSPENDED");
    assert.equal(relogin.body.reason, "spam");

    const lift = await call("DELETE", `/api/admin/users/${member._id}/ban`, { cookie: adminCookie });
    assert.equal(lift.status, 200);
    assert.ok(await login(call, email));
  });

  test("a suspension set directly in the database blocks API and socket access", async () => {
    const { default: User } = await import("../src/models/User.js");
    const email = uniqueEmail("direct");
    const member = await createUser({ email });
    const session = await login(call, email);
    await User.updateOne({ _id: member._id }, { $set: { bannedUntil: new Date(Date.now() + 60_000) } });

    const me = await call("GET", "/api/auth/me", { cookie: session });
    assert.equal(me.status, 403);
    assert.equal(me.body.code, "ACCOUNT_SUSPENDED");
    await assert.rejects(connectSocket(ctx.baseUrl, session), /Account suspended/);
  });

  test("permanent suspension, and guard rails", async () => {
    const member = await createUser({ email: uniqueEmail("perm") });
    const permanent = await call("PUT", `/api/admin/users/${member._id}/ban`, {
      cookie: adminCookie,
      body: { permanent: true },
    });
    assert.equal(permanent.status, 200);

    assert.equal(
      (await call("PUT", `/api/admin/users/${adminId}/ban`, { cookie: adminCookie, body: { days: 1 } })).status,
      400,
      "cannot suspend yourself"
    );
    const otherAdmin = await createUser({ email: uniqueEmail("admin2"), accountType: "admin" });
    assert.equal(
      (await call("PUT", `/api/admin/users/${otherAdmin._id}/ban`, { cookie: adminCookie, body: { days: 1 } })).status,
      403
    );
    assert.equal(
      (await call("PUT", `/api/admin/users/${member._id}/ban`, { cookie: adminCookie, body: { days: 0 } })).status,
      400
    );

    const regular = await createUser({ email: uniqueEmail("regular") });
    const regularCookie = await login(call, regular.email);
    assert.equal(
      (await call("PUT", `/api/admin/users/${member._id}/ban`, { cookie: regularCookie, body: { days: 1 } })).status,
      403,
      "non-admins cannot suspend"
    );
  });
});
