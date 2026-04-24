import { Router, Response } from "express";
import { db } from "../config/db";
import { authenticate, AuthRequest } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

// Create notifications table if not exists (Lazy Init)
const initTable = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
initTable();

// Get user notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const notifications = await db.execute({
      sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      args: [userId]
    } as any);
    res.json(notifications.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await db.execute({
      sql: "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      args: [id, userId]
    } as any);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Purge all notifications
router.delete("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    await db.execute({
      sql: "DELETE FROM notifications WHERE user_id = ?",
      args: [userId]
    } as any);
    res.json({ message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

/**
 * Helper function to create notification for a specific user
 */
export const createNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
        await db.execute({
            sql: "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), userId, title, message, type]
        } as any);
    } catch (e) {
        console.error("Failed to inject notification manifold", e);
    }
};

/**
 * Helper function to notify all students
 */
export const notifyAllStudents = async (title: string, message: string, type: string) => {
    try {
        const students = await db.execute("SELECT id FROM users WHERE role = 'student'");
        for (const student of students.rows) {
            await createNotification((student as any).id, title, message, type);
        }
    } catch (e) {
        console.error("Mass notification sequence failed", e);
    }
}

export default router;
