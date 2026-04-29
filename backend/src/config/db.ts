import { createClient } from "@libsql/client/http";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL || "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export const initDb = async () => {
  try {
    // Basic connectivity check
    await db.execute("SELECT 1");
    console.log("Connected to Turso/LibSQL database");

    // 1. Core Schema Initialization
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        email TEXT UNIQUE, 
        password TEXT, 
        role TEXT NOT NULL DEFAULT 'student', 
        profile_photo TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. High-Fidelity Schema Synchronization (Handle Legacy Tables)
    try {
      const tableInfo = await db.execute("PRAGMA table_info(users)");
      const hasRole = tableInfo.rows.some((row: any) => row.name === 'role');
      
      if (!hasRole) {
        console.log("[Sector-X] Role Manifest Missing. Initializing ALTER TABLE protocol...");
        await db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
      }
    } catch (columnError) {
      console.warn("[Sector-X] Non-critical schema sync friction:", columnError);
    }

    // 3. Legacy Authority Recovery (Force-Sync Admins)
    await db.execute(`
      UPDATE users 
      SET role = 'admin' 
      WHERE (email LIKE '%admin%' OR email LIKE 'kishor%') AND role != 'admin'
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        duration INTEGER,
        schedule_start DATETIME,
        schedule_end DATETIME,
        passing_score INTEGER DEFAULT 40,
        created_by TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Initialize remaining tables
    await db.batch([
      // Questions Table
      {
        sql: `CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          exam_id TEXT,
          type TEXT NOT NULL,
          question_text TEXT NOT NULL,
          options TEXT, -- JSON string
          correct_answer TEXT,
          marks INTEGER DEFAULT 1,
          explanation TEXT,
          coding_language TEXT,
          test_cases TEXT, -- JSON string
          FOREIGN KEY (exam_id) REFERENCES exams(id)
        )`,
        args: []
      },
      // Attempts Table
      {
        sql: `CREATE TABLE IF NOT EXISTS attempts (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exam_id TEXT,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          status TEXT DEFAULT 'in-progress',
          score INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (exam_id) REFERENCES exams(id)
        )`,
        args: []
      },
      // Answers Table
      {
        sql: `CREATE TABLE IF NOT EXISTS answers (
          id TEXT PRIMARY KEY,
          attempt_id TEXT,
          question_id TEXT,
          response TEXT,
          is_correct BOOLEAN,
          last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(attempt_id, question_id),
          FOREIGN KEY (attempt_id) REFERENCES attempts(id),
          FOREIGN KEY (question_id) REFERENCES questions(id)
        )`,
        args: []
      },
      // Notifications Table
      {
        sql: `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL, -- 'exam_published' | 'result_available' | 'general'
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        args: []
      }
    ] as any);

    console.log("Database tables checked/initialized successfully");

    // Migration: Ensure 'role' and 'profile_photo' columns exist in users table
    try {
      const columns = await db.execute("PRAGMA table_info(users)");
      const colNames = columns.rows.map((r: any) => r.name);
      
      if (!colNames.includes("role")) {
        await db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
        console.log("Added 'role' column to 'users' table");
      }
      if (!colNames.includes("profile_photo")) {
        await db.execute("ALTER TABLE users ADD COLUMN profile_photo TEXT");
        console.log("Added 'profile_photo' column to 'users' table");
      }
      if (!colNames.includes("created_at")) {
        await db.execute("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        console.log("Added 'created_at' column to 'users' table");
      }
    } catch (e) {
      console.warn("Migration check failed (might be first run):", e);
    }

  } catch (error) {
    console.error("Database connection/init failed:", error);
    process.exit(1);
  }
};
