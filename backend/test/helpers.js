// Shared test setup: a real Express app + Socket.IO on an ephemeral port, backed by a
// throwaway MongoDB database (TEST_MONGO_URI, default local Docker MongoDB).
import http from "node:http";

const baseUri = (process.env.TEST_MONGO_URI || "mongodb://localhost:27017").replace(/\/+$/, "");

export const startTestServer = async (dbName) => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET_KEY = "test-secret";
  process.env.MONGO_URI = `${baseUri}/${dbName}`;
  process.env.FRONTEND_URLS = "http://localhost:5173";
  delete process.env.CHAT_MONGO_URI;
  delete process.env.MAIL_HOST; // no SMTP: codes are printed in non-production

  const { default: mongoose } = await import("mongoose");
  const { connectDB } = await import("../src/lib/db.js");
  const { connectChatDB } = await import("../src/lib/chatDb.js");
  const { ensureIndexes } = await import("../src/lib/indexes.js");
  const { setupChatSocket } = await import("../src/lib/chatSocket.js");
  const { default: app } = await import("../src/app.js");

  await connectDB();
  await mongoose.connection.db.dropDatabase();
  await connectChatDB();
  await ensureIndexes();

  const server = http.createServer(app);
  const io = setupChatSocket(server, ["http://localhost:5173"]);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const close = async () => {
    io.close();
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  };

  return { baseUrl, close, mongoose };
};

let counter = 0;
export const uniqueEmail = (label) => `${label}-${Date.now().toString(36)}-${counter++}@example.com`;

// Creates a verified, onboarded user directly in the database.
export const createUser = async ({ email, password = "Password123", accountType = "standard", ...rest } = {}) => {
  const { default: User } = await import("../src/models/User.js");
  return User.create({
    email: email || uniqueEmail("user"),
    fullName: "Test User",
    password,
    isEmailVerified: true,
    isOnboarded: true,
    gender: "male",
    country: "Vietnam",
    city: "Hanoi",
    accountType,
    ...rest,
  });
};

export const api = (baseUrl) => async (method, path, { body, cookie, headers = {} } = {}) => {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      "X-Client-Platform": "web",
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const setCookie = response.headers.get("set-cookie") || "";
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json().catch(() => null),
    cookie: setCookie.startsWith("jwt=") ? setCookie.split(";")[0] : "",
  };
};

export const login = async (call, email, password = "Password123") => {
  const response = await call("POST", "/api/auth/login", { body: { email, password } });
  return response.cookie;
};

export const connectSocket = async (baseUrl, cookie) => {
  const { io } = await import("socket.io-client");
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ["websocket"],
      auth: { token: cookie.replace(/^jwt=/, "") },
      reconnection: false,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });
};

export const emitWithAck = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
