import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { applications } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

async function run() {
  const csvPath = path.resolve(process.argv[2] || 'volunteer_applications_2026-04-17.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
  console.log(`📥 Found ${rows.length} rows in CSV`);

  // Fetch existing emails to skip duplicates
  const existing = await db.select({ email: applications.email }).from(applications);
  const existingEmails = new Set(existing.map(r => r.email.toLowerCase().trim()));

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = (row.email || '').toLowerCase().trim();
    if (!email) { skipped++; continue; }
    if (existingEmails.has(email)) {
      console.log(`  ⏭  Skipping duplicate: ${email}`);
      skipped++;
      continue;
    }

    const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
    const notes = [
      row.occupation ? `Occupation: ${row.occupation}` : null,
      row.volunteer_type ? `Type: ${row.volunteer_type}` : null,
      row.dob ? `DOB: ${row.dob}` : null,
    ].filter(Boolean).join(' | ') || null;

    const createdAt = row.created_at ? new Date(row.created_at) : new Date();

    await db.insert(applications).values({
      id: row.id || crypto.randomUUID(),
      name,
      email,
      phone: row.phone || '',
      city: row.city || null,
      programInterest: row.projects || null,
      notes,
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    });

    existingEmails.add(email);
    console.log(`  ✅ Imported: ${name} (${email})`);
    inserted++;
  }

  console.log(`\nDone! Imported: ${inserted}, Skipped: ${skipped}`);
  await client.end();
}

run().catch(err => {
  console.error('❌ Import failed:', err.message);
  process.exit(1);
});
