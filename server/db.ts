import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);

export async function runMigrations() {
  try {
    await client`ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_number text`;
    await client`
      CREATE TABLE IF NOT EXISTS app_counter (
        id integer PRIMARY KEY DEFAULT 1,
        next_value integer NOT NULL DEFAULT 1
      )
    `;
    await client`INSERT INTO app_counter (id, next_value) VALUES (1, 1) ON CONFLICT DO NOTHING`;
    console.log("Migrations OK");
  } catch (err) {
    console.error("Migration warning:", err);
  }
}
