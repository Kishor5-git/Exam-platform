import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { authenticate, AuthRequest, authorize } from "../middleware/auth";

const router = Router();

// Get Student Results (History)
router.get("/my-results", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const results = await db.execute({
      sql: "SELECT a.*, e.title, e.passing_score FROM attempts a JOIN exams e ON a.exam_id = e.id WHERE a.user_id = ? AND a.status = 'completed' ORDER BY a.end_time DESC",
      args: [userId]
    } as any);
    res.json(results.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Get All Results (Admin)
router.get("/all", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const results = await db.execute(`
      SELECT a.*, u.name, e.title as exam_title 
      FROM attempts a 
      JOIN users u ON a.user_id = u.id 
      JOIN exams e ON a.exam_id = e.id 
      WHERE a.status = 'completed' 
      ORDER BY a.end_time DESC 
      LIMIT 5
    `);
    res.json(results.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch all results" });
  }
});

// Get Specific User's Results (Admin)
router.get("/user/:userId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const results = await db.execute({
      sql: `SELECT a.*, e.title as exam_title 
            FROM attempts a 
            JOIN exams e ON a.exam_id = e.id 
            WHERE a.user_id = ? 
            ORDER BY a.end_time DESC`,
      args: [userId]
    } as any);
    res.json(results.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch student results" });
  }
});

// Reset Attempt (Grant Retake)
router.delete("/user/:userId/exam/:examId", authenticate, authorize(["admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, examId } = req.params;
    await db.execute({
      sql: "DELETE FROM attempts WHERE user_id = ? AND exam_id = ?",
      args: [userId, examId]
    } as any);
    res.json({ message: "Attempt reset successfully. Student can now retake the exam." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reset attempt" });
  }
});



// Get Student's Own Review Manifest
router.get("/my-review/:attemptId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toLowerCase() === "admin";

    // 1. Verify Attempt Ownership Manifest
    const attemptRes = await db.execute({
      sql: "SELECT * FROM attempts WHERE id = ?",
      args: [attemptId]
    } as any);

    if (!attemptRes.rows || attemptRes.rows.length === 0) {
      return res.status(404).json({ error: "Attempt manifest not found." });
    }

    const attempt = attemptRes.rows[0] as any;
    if (attempt.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Clearance Denied. You do not have authority to review this manifestation." });
    }

    // 2. Aggregate Review Vectors (Merged Questions + Student Answers)
    const reviewDetail = await db.execute({
      sql: `SELECT q.id as question_id, q.question_text, q.type, q.options, q.correct_answer, q.explanation, q.marks, 
                   ans.response as student_response, 
                   (ans.response IS NOT NULL AND LOWER(TRIM(ans.response)) = LOWER(TRIM(q.correct_answer))) as is_correct
            FROM questions q
            LEFT JOIN answers ans ON q.id = ans.question_id AND ans.attempt_id = ?
            WHERE q.exam_id = ?`,
      args: [attemptId, attempt.exam_id]
    } as any);

    res.json({
      attempt,
      review: reviewDetail.rows
    });
  } catch (error: any) {
    console.error("REVIEW_DISCOVERY_ANOMALY:", error);
    res.status(500).json({ error: "Failed to synchronize review manifest." });
  }
});

// Get Full Answer Sheet Detail (Admin)

export default router;
