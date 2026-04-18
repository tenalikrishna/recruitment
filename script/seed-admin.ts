import 'dotenv/config';
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers } from "../shared/schema";
import crypto from "crypto";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  // ✅ Use postgres (NOT neon)
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  const id = crypto.randomUUID();

  const plainPassword = "humanity@admin123";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await db.insert(adminUsers).values({
    id,
    name: "Admin",
    email: "admin@humanityorg.foundation",
    username: "admin",
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin user created:");
  console.log("   Username: admin");
  console.log("   Password: humanity@admin123");
}

seed().catch((err) => {
  console.error("❌ Error seeding admin:", err);
});