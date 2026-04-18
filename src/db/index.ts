import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization — prevents build-time crash when DATABASE_URL is not set
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a proxy that throws at runtime, not at module load time
    return drizzle(neon("postgresql://placeholder:placeholder@placeholder/placeholder"), { schema });
  }
  return drizzle(neon(url), { schema });
}

export const db = getDb();
export type DB = typeof db;
