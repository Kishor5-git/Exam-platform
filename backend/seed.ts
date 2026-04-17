import { db } from "./src/config/db";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const seed = async () => {
    try {
        console.log("Reading schema...");
        const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
        const statements = schema.split(";").filter(s => s.trim() !== "");

        console.log("Initializing tables...");
        for (const statement of statements) {
            await db.execute(statement);
        }

        console.log("Inserting seed data...");
        
        // 1. Create Admin
        const adminId = crypto.randomUUID();
        const adminHash = await bcrypt.hash("admin123", 10);
        await db.execute({
            sql: "INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            args: [adminId, "Super Admin", "admin@exampro.com", adminHash, "admin"]
        });

        // 2. Create Student
        const studentId = crypto.randomUUID();
        const studentHash = await bcrypt.hash("student123", 10);
        await db.execute({
            sql: "INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            args: [studentId, "Jane Student", "student@exampro.com", studentHash, "student"]
        });

        // 3. Create Sample Exam
        const examId = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO exams (id, title, duration, schedule_start, schedule_end, passing_score, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [examId, "Full-Stack Development Basics", 60, "2026-04-15 10:00:00", "2026-04-30 10:00:00", 70, adminId, "published"]
        });

        // 4. Create Sample Questions
        const q1Id = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO questions (id, exam_id, type, question_text, options, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [q1Id, examId, "MCQ", "What does HTML stand for?", JSON.stringify(["Hyper Text Markup Language", "Hyperlink Text Mark Language", "Home Tool Markup Language"]), "Hyper Text Markup Language", 10]
        });

        const q2Id = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO questions (id, exam_id, type, question_text, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?)",
            args: [q2Id, examId, "SHORT_ANSWER", "Which company developed Next.js?", "Vercel", 10]
        });

        const q3Id = crypto.randomUUID();
        await db.execute({
            sql: "INSERT OR IGNORE INTO questions (id, exam_id, type, question_text, coding_language, marks) VALUES (?, ?, ?, ?, ?, ?)",
            args: [q3Id, examId, "CODING", "Write a function that returns 'Hello World'.", "javascript", 20]
        });

        console.log("✅ Database initialized and seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seed();
