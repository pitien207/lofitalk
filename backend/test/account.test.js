import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { api, connectSocket, createUser, emitWithAck, login, startTestServer, uniqueEmail } from "./helpers.js";

let ctx;
let call;

before(async () => {
  ctx = await startTestServer("lofitalk-test-account");
  call = api(ctx.baseUrl);
});
after(() => ctx.close());

const models = async () => ({
  User: (await import("../src/models/User.js")).default,
  FriendRequest: (await import("../src/models/FriendRequest.js")).default,
  UserReport: (await import("../src/models/UserReport.js")).default,
  Avatar: (await import("../src/models/Avatar.js")).default,
  Conversation: (await import("../src/models/ChatConversation.js")).getChatConversationModel(),
  Message: (await import("../src/models/ChatMessage.js")).getChatMessageModel(),
});

describe("account deletion", () => {
  test("requires the correct password", async () => {
    const email = uniqueEmail("keep");
    await createUser({ email });
    const cookie = await login(call, email);
    const response = await call("DELETE", "/api/users/me", { cookie, body: { password: "wrong-password" } });
    assert.equal(response.status, 400);
    assert.equal((await call("GET", "/api/auth/me", { cookie })).status, 200);
  });

  test("removes the user and their personal data, keeps other users", async () => {
    const { User, FriendRequest, UserReport, Avatar, Conversation, Message } = await models();
    const email = uniqueEmail("leaver");
    const leaver = await createUser({ email });
    const friend = await createUser({ email: uniqueEmail("friend"), friends: [leaver._id] });
    const blocker = await createUser({ email: uniqueEmail("blocker"), blockedUsers: [leaver._id] });
    await User.updateOne({ _id: leaver._id }, { $set: { friends: [friend._id] } });
    await FriendRequest.create({ sender: leaver._id, recipient: blocker._id });
    await UserReport.create({ reporter: friend._id, target: leaver._id, message: "reported for testing purposes" });
    await Avatar.create({ userId: leaver._id, data: Buffer.from("x"), contentType: "image/webp", size: 1 });

    const cookie = await login(call, email);
    const socket = await connectSocket(ctx.baseUrl, cookie);
    const sent = await emitWithAck(socket, "chat:send-message", { text: "bye", toUserId: friend._id.toString() });
    socket.close();

    const response = await call("DELETE", "/api/users/me", { cookie, body: { password: "Password123" } });
    assert.equal(response.status, 200);

    assert.equal(await User.countDocuments({ _id: leaver._id }), 0);
    assert.equal(await Avatar.countDocuments({ userId: leaver._id }), 0);
    assert.equal(await FriendRequest.countDocuments({ sender: leaver._id }), 0);
    assert.equal(await UserReport.countDocuments({ target: leaver._id }), 0);
    assert.equal(await Conversation.countDocuments({ _id: sent.threadId }), 0);
    assert.equal(await Message.countDocuments({ sender: leaver._id }), 0);
    assert.equal((await User.findById(friend._id)).friends.length, 0);
    assert.equal((await User.findById(blocker._id)).blockedUsers.length, 0);
    assert.equal((await call("GET", "/api/auth/me", { cookie })).status, 401);
  });
});
