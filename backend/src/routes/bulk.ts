import { Router, Request, Response } from "express";
import multer from "multer";
import { parseExcel, validateQuestions } from "../utils/bulkUpload";
import { db } from "../config/db";
import { authenticate, authorize } from "../middleware/auth";
import crypto from "crypto";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validate Bulk Upload
router.post("/validate", authenticate, authorize(["admin"]), upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const rawData = parseExcel(req.file.buffer);
    const { valid, errors } = validateQuestions(rawData);

    res.json({ questions: valid, errorCount: errors.length, errors });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse file" });
  }
});

// Execute Bulk Upload
router.post("/upload", authenticate, authorize(["admin"]), async (req: any, res: Response) => {
  try {
    const { questions, examId } = req.body;
    if (!examId) return res.status(400).json({ error: "Exam ID required" });

    const results = {
        success: 0,
        failed: 0,
        details: [] as any[]
    };

    for (const q of questions) {
        try {
            const id = crypto.randomUUID();
            await db.execute({
                sql: `INSERT INTO questions (id, exam_id, type, question_text, options, correct_answer, marks, explanation, coding_language, test_cases)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    id, 
                    examId, 
                    q.type, 
                    q.question_text, 
                    q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
                    q.correct_answer,
                    q.marks,
                    q.explanation,
                    q.coding_language,
                    q.test_cases ? (typeof q.test_cases === 'string' ? q.test_cases : JSON.stringify(q.test_cases)) : null
                ]
            } as any);
            results.success++;
        } catch (err: any) {
            results.failed++;
            results.details.push({ question: q.question_text, error: err.message });
        }
    }

    res.json({ message: "Bulk upload complete", results });
  } catch (error) {
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
});

export default router;
