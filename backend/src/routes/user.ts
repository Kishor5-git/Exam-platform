import { Router, Response } from "express";
import { db } from "../config/db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Get All Students (Admin Only)
router.get("/students", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role?.toLowerCase() === "admin";
    if (!isAdmin) {
      return res.status(403).json({ error: "Access Denied. Admin authority required." });
    }

    const { rows } = await db.execute({
      sql: "SELECT id, name, email, role, created_at, profile_photo FROM users WHERE role = 'student' ORDER BY created_at DESC",
    } as any);

    res.json(rows);
  } catch (error) {
    console.error("Student discovery failure:", error);
    res.status(500).json({ error: "Failed to synchronize student directory manifold." });
  }
});

// Update User Profile Manifest
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, profile_photo } = req.body;

    if (!name && !profile_photo) {
      return res.status(400).json({ error: "No configuration coordinates provided." });
    }

    let sql = "UPDATE users SET ";
    const args: any[] = [];
    const sets = [];

    if (name) {
      sets.push("name = ?");
      args.push(name);
    }
    if (profile_photo) {
      sets.push("profile_photo = ?");
      args.push(profile_photo);
    }

    sql += sets.join(", ") + " WHERE id = ?";
    args.push(userId);

    await db.execute({ sql, args } as any);

    res.json({ message: "Identity manifestation synchronized successfully." });
  } catch (error) {
    console.error("Profile update failure:", error);
    res.status(500).json({ error: "Failed to synchronize profile configuration." });
  }
});

export default router;
