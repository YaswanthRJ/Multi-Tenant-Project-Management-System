import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { app } from "./app.js";

async function startServer(): Promise<void> {
  try {
    // Verify PostgreSQL connection before starting the server
    await pool.query("SELECT 1");

    console.log("Database connected successfully");

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    await pool.end();

    process.exit(1);
  }
}

startServer();

