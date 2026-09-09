import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../config/db.js";

const migrationsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../sql/migrations"
);

async function migrate(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((filename) => /^\d+.*\.sql$/.test(filename))
      .sort();

    const appliedResult = await client.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations"
    );

    const applied = new Set(
      appliedResult.rows.map(({ filename }) => filename)
    );

    for (const filename of migrationFiles) {
      if (applied.has(filename)) {
        console.log(`Skipping migration: ${filename}`);
        continue;
      }

      const filePath = resolve(migrationsDirectory, filename);
      const sql = await readFile(filePath, "utf8");

      console.log(`Applying migration: ${filename}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          `
            INSERT INTO schema_migrations (filename)
            VALUES ($1)
          `,
          [filename]
        );

        await client.query("COMMIT");

        console.log(`Applied migration: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Database migrations are up to date");
  } finally {
    client.release();
  }
}

migrate()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
