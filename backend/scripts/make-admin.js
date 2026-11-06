// Promotes an existing, already registered user to admin (the app itself cannot create
// the first admin). Idempotent: running it again for the same email changes nothing.
//
// Usage (run from backend/, MONGO_URI from the environment or backend/.env):
//   node scripts/make-admin.js you@example.com
import "dotenv/config";
import mongoose from "mongoose";

const email = (process.argv[2] || "").trim();

const main = async () => {
  if (!email) {
    throw new Error("Usage: node scripts/make-admin.js <email>");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const users = mongoose.connection.db.collection("users");

  const user = await users.findOne(
    { email },
    { projection: { email: 1, accountType: 1 } }
  );

  if (!user) {
    throw new Error(
      `No user with email "${email}". Sign up on the website first (email must match exactly).`
    );
  }

  if (user.accountType === "admin") {
    console.log(`${email} is already an admin. Nothing to do.`);
    return;
  }

  await users.updateOne({ _id: user._id }, { $set: { accountType: "admin" } });
  console.log(`${email} is now an admin. Log out and log in again to see the admin pages.`);
};

main()
  .catch((error) => {
    console.error("make-admin failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
