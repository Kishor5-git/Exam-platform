import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Get Admin Stats
router.get("/admin", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
  try {
    const studentsRes = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const examsRes = await db.execute("SELECT COUNT(*) as count FROM exams");
    const submissionsRes = await db.execute("SELECT COUNT(*) as count FROM attempts WHERE status = 'completed'");
    const avgScoreRes = await db.execute("SELECT AVG(score) as avg FROM attempts WHERE status = 'completed' AND score IS NOT NULL");

    const stats = {
      exams: Number((examsRes.rows[0] as any).count) || 0,
      students: Number((studentsRes.rows[0] as any).count) || 0,
      submissions: Number((submissionsRes.rows[0] as any).count) || 0,
      average: Math.round(Number((avgScoreRes.rows[0] as any).avg) || 0) + "%"
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get Student Stats
router.get("/student", authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    // 1. Basic Counts
    const completedRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND status = 'completed'",
      args: [userId]
    } as any);
    const avgScoreRes = await db.execute({
      sql: "SELECT AVG(score) as avg FROM attempts WHERE user_id = ? AND status = 'completed' AND score IS NOT NULL",
      args: [userId]
    } as any);

    // 2. Latest Manifest
    const latestRes = await db.execute({
      sql: `SELECT a.*, e.title as exam_title 
            FROM attempts a 
            JOIN exams e ON a.exam_id = e.id 
            WHERE a.user_id = ? AND a.status = 'completed' 
            ORDER BY a.end_time DESC LIMIT 1`,
      args: [userId]
    } as any);

    // 3. Global Rank Synthesis (Based on average score)
    const allAveragesRes = await db.execute(`
      SELECT user_id, AVG(score) as avg_score 
      FROM attempts 
      WHERE status = 'completed' 
      GROUP BY user_id 
      ORDER BY avg_score DESC
    `);
    
    const rankIndex = allAveragesRes.rows.findIndex((r: any) => r.user_id === userId);
    const rank = rankIndex === -1 ? "-" : `#${rankIndex + 1}`;

    const latest = latestRes.rows[0] as any;
    let grade = "-";
    if (latest) {
      const score = latest.score;
      if (score >= 90) grade = "A+";
      else if (score >= 80) grade = "A";
      else if (score >= 70) grade = "B";
      else if (score >= 60) grade = "C";
      else if (score >= 50) grade = "D";
      else grade = "F";
    }

    const completedCount = Number((completedRes.rows[0] as any).count) || 0;
    const avgScore = Math.round(Number((avgScoreRes.rows[0] as any).avg) || 0);
    
    // 6. High-Fidelity Analytics Manifest (Passing Rate & Credits)
    const extraRes = await db.execute({
      sql: `SELECT 
              SUM(score) as total_credits,
              COUNT(CASE WHEN score >= 40 THEN 1 END) as passed_count
            FROM attempts WHERE user_id = ? AND status = 'completed'`,
      args: [userId]
    } as any);
    
    const extra = extraRes.rows[0] as any;
    const totalCredits = Number(extra.total_credits) || 0;
    const passedMissions = Number(extra.passed_count) || 0;
    const passRate = completedCount > 0 ? Math.round((passedMissions / completedCount) * 100) : 0;
    const masteryLevel = Math.floor(totalCredits / 500) + 1;

    res.json({
      exams_completed: completedCount,
      average_score: avgScore + "%",
      total_credits: totalCredits.toLocaleString(),
      passing_rate: passRate + "%",
      mastery_level: masteryLevel,
      latest_result: latest ? {
        score: latest.score + "%",
        grade,
        exam_title: latest.exam_title,
        submitted_at: latest.end_time
      } : null,
      global_rank: rank
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch student statistics" });
  }
});

// Get Global Leaderboard Manifest
router.get("/leaderboard", authenticate, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        AVG(a.score) as avg_score, 
        COUNT(a.id) as completed_exams
      FROM users u
      JOIN attempts a ON u.id = a.user_id
      WHERE a.status = 'completed'
      GROUP BY u.id
      ORDER BY avg_score DESC
    `;
    
    const results = await db.execute(query);
    
    const leaderboard = results.rows.map((row: any, index: number) => {
      const score = Math.round(Number(row.avg_score) || 0);
      let grade = "F";
      if (score >= 90) grade = "A+";
      else if (score >= 80) grade = "A";
      else if (score >= 70) grade = "B";
      else if (score >= 60) grade = "C";
      else if (score >= 50) grade = "D";

      return {
        rank: index + 1,
        name: row.name,
        score: score + "%",
        grade,
        completed: row.completed_exams,
        initials: row.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      };
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard failure:", error);
    res.status(500).json({ error: "Failed to synthesize global leaderboard manifest." });
  }
});

export default router;
