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

    // Detailed Analytics for Charts
    const examParticipationRes = await db.execute(`
      SELECT 
        e.title, 
        COUNT(a.id) as participation,
        AVG(a.score) as avg_score,
        MAX(a.score) as highest_score,
        MIN(a.score) as lowest_score,
        COUNT(CASE WHEN a.score >= e.passing_score THEN 1 END) * 100.0 / COUNT(a.id) as pass_percentage
      FROM exams e 
      LEFT JOIN attempts a ON e.id = a.exam_id AND a.status = 'completed'
      GROUP BY e.id 
      ORDER BY participation DESC LIMIT 5
    `);

    const submissionTrendsRes = await db.execute(`
       SELECT strftime('%Y-%m-%d', end_time) as date, COUNT(*) as count 
       FROM attempts 
       WHERE status = 'completed' 
       GROUP BY date 
       ORDER BY date DESC LIMIT 7
    `);

    const passFailRes = await db.execute(`
       SELECT 
         COUNT(CASE WHEN score >= 40 THEN 1 END) as passed,
         COUNT(CASE WHEN score < 40 THEN 1 END) as failed
       FROM attempts WHERE status = 'completed'
    `);

    const pendingRes = await db.execute("SELECT COUNT(*) as count FROM attempts WHERE status != 'completed'");
    const activeExamsRes = await db.execute("SELECT COUNT(*) as count FROM exams WHERE schedule_start <= datetime('now') AND schedule_end >= datetime('now')");
    
    // Recent Activity
    const recentSubmissionsRes = await db.execute(`
      SELECT a.*, u.name as student_name, e.title as exam_title 
      FROM attempts a 
      JOIN users u ON a.user_id = u.id 
      JOIN exams e ON a.exam_id = e.id 
      ORDER BY a.end_time DESC LIMIT 5
    `);

    const recentExamsRes = await db.execute("SELECT * FROM exams ORDER BY created_at DESC LIMIT 5");
    const recentStudentsRes = await db.execute("SELECT name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC LIMIT 5");

    // Top Performers
    const topPerformersRes = await db.execute(`
      SELECT u.name, AVG(a.score) as avg_score, COUNT(a.id) as exams_count
      FROM users u
      JOIN attempts a ON u.id = a.user_id
      WHERE a.status = 'completed'
      GROUP BY u.id
      ORDER BY avg_score DESC LIMIT 5
    `);

    const stats = {
      exams: Number((examsRes.rows[0] as any).count) || 0,
      students: Number((studentsRes.rows[0] as any).count) || 0,
      submissions: Number((submissionsRes.rows[0] as any).count) || 0,
      active_exams: Number((activeExamsRes.rows[0] as any).count) || 0,
      pending_evaluations: Number((pendingRes.rows[0] as any).count) || 0,
      average: Math.round(Number((avgScoreRes.rows[0] as any).avg) || 0) + "%",
      participationData: examParticipationRes.rows,
      trends: submissionTrendsRes.rows.reverse(),
      passFail: passFailRes.rows[0],
      topPerformers: topPerformersRes.rows,
      recent_activity: {
        submissions: recentSubmissionsRes.rows,
        exams: recentExamsRes.rows,
        students: recentStudentsRes.rows
      }
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

    // 2. Recent Results & Latest Manifest
    const recentRes = await db.execute({
      sql: `SELECT a.*, e.title as exam_title 
            FROM attempts a 
            JOIN exams e ON a.exam_id = e.id 
            WHERE a.user_id = ? AND a.status = 'completed' 
            ORDER BY a.end_time DESC LIMIT 5`,
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

    const recentResults = recentRes.rows.map((row: any) => {
      const score = row.score;
      let grade = "F";
      if (score >= 90) grade = "A+";
      else if (score >= 80) grade = "A";
      else if (score >= 70) grade = "B";
      else if (score >= 60) grade = "C";
      else if (score >= 50) grade = "D";
      return {
        exam_name: row.exam_title,
        score: score,
        grade,
        date: row.end_time,
        status: row.status
      };
    });

    const latest = recentResults[0];

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

    // 7. Trend Data (Last 5 scores)
    const trendsRes = await db.execute({
      sql: `SELECT score, end_time 
            FROM attempts 
            WHERE user_id = ? AND status = 'completed' 
            ORDER BY end_time ASC LIMIT 5`,
      args: [userId]
    } as any);

    // 8. Highest Score
    const highestRes = await db.execute({
      sql: "SELECT MAX(score) as highest FROM attempts WHERE user_id = ? AND status = 'completed'",
      args: [userId]
    } as any);

    res.json({
      exams_completed: completedCount,
      average_score: avgScore + "%",
      highest_score: (highestRes.rows[0] as any).highest || 0 + "%",
      total_credits: totalCredits.toLocaleString(),
      passing_rate: passRate + "%",
      passed_missions: passedMissions,
      failed_missions: completedCount - passedMissions,
      mastery_level: masteryLevel,
      latest_result: latest ? {
        score: latest.score + "%",
        grade: latest.grade,
        exam_title: latest.exam_name,
        submitted_at: latest.date
      } : null,
      recent_results: recentResults,
      global_rank: rank,
      trends: trendsRes.rows
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
