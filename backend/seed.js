const { createClient } = require("@libsql/client/http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

const db = createClient({
  url: url,
  authToken: authToken,
});

const seed = async () => {
    try {
        console.log("Connecting to Turso: " + url);
        await db.execute("SELECT 1");

        console.log("Reading schema...");
        const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
        const statements = schema.split(";").filter(s => s.trim() !== "");

        console.log("Initializing tables...");
        for (const statement of statements) {
            const clean = statement.trim();
            if (clean) {
                console.log("Executing: " + clean.substring(0, 50) + "...");
                await db.execute(clean);
            }
        }

        console.log("Inserting Admin...");
        const adminId = crypto.randomUUID();
        const adminHash = await bcrypt.hash("admin123", 10);
        await db.execute({
            sql: "INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            args: [adminId, "Super Admin", "admin@exampro.com", adminHash, "admin"]
        });

        console.log("Inserting Student...");
        const studentId = crypto.randomUUID();
        const studentHash = await bcrypt.hash("student123", 10);
        await db.execute({
            sql: "INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            args: [studentId, "Jane Student", "student@exampro.com", studentHash, "student"]
        });

        console.log("Inserting Exam...");
        const examId = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO exams (id, title, duration, schedule_start, schedule_end, passing_score, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [examId, "Full-Stack Development Basics", 60, "2026-04-15 10:00:00", "2026-04-30 10:00:00", 70, adminId, "published"]
        });

        console.log("Inserting Question 1...");
        const q1Id = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO questions (id, exam_id, type, question_text, options, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [q1Id, examId, "MCQ", "What does HTML stand for?", JSON.stringify(["Hyper Text Markup Language", "Hyperlink Text Mark Language", "Home Tool Markup Language"]), "Hyper Text Markup Language", 10]
        });

        console.log("✅ Turso Database initialized and seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Action failed:", error);
        process.exit(1);
    }
};

seed();
