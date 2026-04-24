import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { authenticate, AuthRequest } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

// Get Current User Manifest
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await db.execute({
      sql: "SELECT id, name, email, role, profile_photo, created_at FROM users WHERE id = ?",
      args: [userId]
    } as any);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: "Identity not discovered." });
    }

    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Identity recovery failure:", error);
    res.status(500).json({ error: "Internal server error during identity retrieval." });
  }
});

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("Registration attempt:", { name, email, role });

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // Check if user exists
    console.log("Checking if user exists...");
    const existing = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    } as any);

    if (existing.rows && existing.rows.length > 0) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

    await db.execute({
      sql: "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      args: [id, name, email, hashedPassword, role || "student"]
    } as any);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    console.error("Register error DETAILS:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    } as any);

    if (!result.rows || result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password as string);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ id: user.id as string, email: user.email as string, role: user.role as string });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_photo: user.profile_photo
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Google Login (Auth Manifest Integration)
router.post("/google-login", async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required for identity mapping." });
    }

    // Check if user exists, if not create one
    let result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    } as any);

    let user;
    if (!result.rows || result.rows.length === 0) {
      // Create a new user for this Google identity
      const id = crypto.randomUUID();
      const placeholderPassword = await hashPassword(crypto.randomBytes(16).toString('hex'));
      
      await db.execute({
        sql: "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
        args: [id, name || email.split('@')[0], email, placeholderPassword, "student"]
      } as any);

      result = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [id]
      } as any);
    }
    
    user = result.rows[0];
    const token = generateToken({ id: user.id as string, email: user.email as string, role: user.role as string });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_photo: user.profile_photo
      }
    });
  } catch (error: any) {
    console.error("Google Login Protocol Error:", error);
    res.status(500).json({ error: "Identity federation failed." });
  }
});


export default router;
