import { db } from "./index";
import { sql } from "drizzle-orm";
import { userSkills, userActivity } from "../shared/schema";

async function createTables() {
  try {
    console.log("Creating user_skills table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        skill TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log("Creating user_activity table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log("Tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

createTables().then(() => {
  console.log("Database setup complete.");
  process.exit(0);
}).catch(error => {
  console.error("Database setup failed:", error);
  process.exit(1);
});
