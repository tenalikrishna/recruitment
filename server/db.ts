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

    // Backfill HUM numbers for existing applicants that don't have one
    const unNumbered = await client`
      SELECT id FROM applications WHERE applicant_number IS NULL ORDER BY created_at ASC
    `;
    if (unNumbered.length > 0) {
      const counterRow = await client`SELECT next_value FROM app_counter WHERE id = 1`;
      let next = counterRow[0]?.next_value ?? 1;
      for (const app of unNumbered) {
        const num = `HUM-${String(next).padStart(4, "0")}`;
        await client`UPDATE applications SET applicant_number = ${num} WHERE id = ${app.id}`;
        next++;
      }
      await client`UPDATE app_counter SET next_value = ${next} WHERE id = 1`;
      console.log(`Backfilled HUM numbers for ${unNumbered.length} applicants`);
    }

    console.log("Migrations OK");
  } catch (err) {
    console.error("Migration warning:", err);
  }
}
