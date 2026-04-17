import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { authenticate, AuthRequest } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

// Start Exam Attempt
router.post("/:examId/start", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Check if attempt already exists
    const existing = await db.execute({
      sql: "SELECT * FROM attempts WHERE user_id = ? AND exam_id = ? AND status != 'cancelled'",
      args: [userId, examId]
    } as any);

    if (existing.rows && existing.rows.length > 0 && (existing.rows[0] as any).status === 'completed') {
      return res.status(400).json({ error: "Exam already submitted" });
    }

    if (existing.rows && existing.rows.length > 0 && (existing.rows[0] as any).status === 'in-progress') {
      // Resume existing attempt
      const attempt = existing.rows[0] as any;
      const examDetails = await db.execute({
        sql: "SELECT duration FROM exams WHERE id = ?",
        args: [examId]
      } as any);
      const duration = (examDetails.rows[0] as any)?.duration || 60;
      
      const startTime = new Date(attempt.start_time).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remainingSeconds = Math.max(0, (duration * 60) - elapsed);

      const questions = await db.execute({
        sql: "SELECT q.id, q.type, q.question_text, q.options, q.marks, q.coding_language FROM questions q WHERE q.exam_id = ?",
        args: [examId]
      } as any);
      const savedAnswers = await db.execute({
        sql: "SELECT question_id, response FROM answers WHERE attempt_id = ?",
        args: [attempt.id]
      } as any);

      return res.json({ 
        attempt, 
        remainingSeconds,
        questions: questions.rows, 
        savedAnswers: savedAnswers.rows 
      });
    }

    // Create new attempt
    const examDetails = await db.execute({
      sql: "SELECT duration FROM exams WHERE id = ?",
      args: [examId]
    } as any);
    const duration = (examDetails.rows[0] as any)?.duration || 60;

    const attemptId = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO attempts (id, user_id, exam_id, start_time, status) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'in-progress')",
      args: [attemptId, userId, examId]
    } as any);

    const questions = await db.execute({
      sql: "SELECT id, type, question_text, options, marks, coding_language FROM questions WHERE exam_id = ?",
      args: [examId]
    } as any);

    res.status(201).json({ 
      attempt: { id: attemptId, start_time: new Date() }, 
      remainingSeconds: duration * 60,
      questions: questions.rows 
    });
  } catch (error: any) {
    console.error("Start attempt error:", error);
    res.status(500).json({ error: "Failed to start exam" });
  }
});

// Auto-save Answer
router.post("/:attemptId/save", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { questionId, response } = req.body;
    const id = crypto.randomUUID();

    // Check if attempt is valid
    const attempt = await db.execute({
      sql: "SELECT * FROM attempts WHERE id = ? AND status = 'in-progress'",
      args: [attemptId]
    } as any);

    if (!attempt.rows || attempt.rows.length === 0) {
      return res.status(400).json({ error: "Attempt not found or already submitted" });
    }

    // Upsert answer
    await db.execute({
      sql: `INSERT INTO answers (id, attempt_id, question_id, response, last_saved) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(attempt_id, question_id) DO UPDATE SET response = EXCLUDED.response, last_saved = CURRENT_TIMESTAMP`,
      args: [id, attemptId, questionId, response]
    } as any);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Save answer error:", error);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

// Internal evaluation logic used by both manual and auto-submit
async function evaluateAttempt(attemptId: string) {
  // 1. High-Resolution Attempt Discovery
  const attemptRes = await db.execute({
    sql: "SELECT * FROM attempts WHERE id = ? AND status = 'in-progress'",
    args: [attemptId]
  } as any);

  if (!attemptRes.rows || attemptRes.rows.length === 0) return null;
  const attempt = attemptRes.rows[0] as any;

  // 2. Aggregate Evaluation Vectors
  const questionsRes = await db.execute({
    sql: "SELECT * FROM questions WHERE exam_id = ?",
    args: [attempt.exam_id]
  } as any);
  const answersRes = await db.execute({
    sql: "SELECT * FROM answers WHERE attempt_id = ?",
    args: [attemptId]
  } as any);

  const questions = questionsRes.rows;
  const studentAnswers = answersRes.rows;

  let earnedMarks = 0;
  let totalPossibleMarks = 0;

  // 3. Evaluation Manifold Execution
  questions.forEach((q: any) => {
    const qMarks = Number(q.marks) || 1;
    totalPossibleMarks += qMarks;

    const studentAns = studentAnswers.find((sa: any) => sa.question_id === q.id);
    if (studentAns) {
      const correct = String(q.correct_answer).trim().toLowerCase();
      const manifested = String(studentAns.response).trim().toLowerCase();

      if (correct === manifested) {
        earnedMarks += qMarks;
      }
    }
  });

  const finalScore = totalPossibleMarks > 0 ? Math.round((earnedMarks / totalPossibleMarks) * 100) : 0;
  
  // 4. Update Status Manifest
  await db.execute({
    sql: "UPDATE attempts SET status = 'completed', end_time = CURRENT_TIMESTAMP, score = ? WHERE id = ?",
    args: [finalScore, attemptId]
  } as any);

  return finalScore;
}

// Final Submit Route
router.post("/:attemptId/submit", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const attemptId = req.params.attemptId as string;
    const score = await evaluateAttempt(attemptId);
    
    if (score === null) {
      return res.status(404).json({ error: "Attempt manifold not found or already decommissioned." });
    }

    console.log(`[evaluation-engine] Attempt ${attemptId} synchronized. Score: ${score}%`);
    res.json({ message: "Assessment evaluation manifest complete.", score });
  } catch (error: any) {
    console.error("EVALUATION_MANIFOLD_FAILURE:", error);
    res.status(500).json({ error: "Submission failed during evaluation sync." });
  }
});

// Authoritative Background Watchdog Protocol
export const autoSubmitExpiredAttempts = async () => {
    try {
        // Find in-progress attempts where duration + 1m buffer has passed
        const expiredRes = await db.execute(`
            SELECT a.id, a.start_time, e.duration 
            FROM attempts a 
            JOIN exams e ON a.exam_id = e.id 
            WHERE a.status = 'in-progress' 
            AND datetime(a.start_time, '+' || e.duration || ' minutes', '+1 minutes') < CURRENT_TIMESTAMP
        `);

        for (const row of expiredRes.rows as any[]) {
            const attemptId = String(row.id);
            console.log(`[watchdog] Auto-submitting expired manifestation: ${attemptId}`);
            await evaluateAttempt(attemptId);
            
            // Generate notification for result availability
            const attempt = await db.execute({
                sql: "SELECT user_id, exam_id FROM attempts WHERE id = ?",
                args: [attemptId]
            } as any);
            const userId = (attempt.rows[0] as any).user_id;
            
            await db.execute({
                sql: "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)",
                args: [crypto.randomUUID(), userId, "Result Available", "Your assessment has been automatically submitted and evaluated.", "result_available"]
            } as any);
        }
    } catch (error) {
        console.error("[watchdog-failure] Global temporal scan defeated:", error);
    }
};

export default router;
