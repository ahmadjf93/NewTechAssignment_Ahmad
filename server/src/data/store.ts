import fs from 'fs/promises';
import path from 'path';
import { Database } from '../types';

// Absolute path to the JSON database file on disk.
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');

// Default empty database used on first run or parse failure.
const emptyDb: Database = { teams: [], users: [], counters: { team: 0, user: 0 } };

// Ensure the database file exists, creating directories and seed data if needed.
async function ensureDbFile(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch (err) {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2), 'utf8');
  }
}

// Read and parse the database JSON file with safe defaults.
export async function readDb(): Promise<Database> {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw) as Database;
    return {
      teams: parsed.teams ?? [],
      users: parsed.users ?? [],
      counters: parsed.counters ?? { team: (parsed.teams?.length ?? 0), user: (parsed.users?.length ?? 0) },
    };
  } catch (err) {
    return { ...emptyDb };
  }
}

// Serialize and persist the database JSON file.
export async function writeDb(db: Database): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}
