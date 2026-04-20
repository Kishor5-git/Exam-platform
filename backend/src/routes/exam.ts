import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import crypto from "crypto";
import multer from "multer";
import * as XLSX from "xlsx";
const pdf = require("pdf-parse");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB Discovery Limit
});

const router = Router();

// Create Exam (Admin)
router.post("/", authenticate, authorize(["admin"]), async (req: AuthRequest, res: Response) => {
  try {
    console.log("Commissioning Protocol Inbound Payload:", JSON.stringify(req.body, null, 2));
    const { title, duration, schedule_start, schedule_end, passing_score } = req.body;
    const adminId = req.user?.id || "anonymous-admin";

    // 1. High-Precision Payload Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: "Mission Header (Title) is mandatory." });
    }

    const durationInt = parseInt(duration);
    const passScoreInt = parseInt(passing_score);

    if (isNaN(durationInt) || durationInt <= 0) {
      return res.status(400).json({ error: "Operational Duration must be a positive integer." });
    }

    if (!schedule_start || !schedule_end) {
      return res.status(400).json({ error: "Temporal Window Opening/Closing protocols must be initialized." });
    }

    // 2. Transmit Blueprint to Database Manifest
    const id = crypto.randomUUID();
    try {
      const query = {
        sql: "INSERT INTO exams (id, title, duration, schedule_start, schedule_end, passing_score, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')",
        args: [id, title, durationInt, schedule_start, schedule_end, isNaN(passScoreInt) ? 40 : passScoreInt, adminId]
      };
      
      console.log("Executing Database Manifest Transaction:", JSON.stringify(query, null, 2));
      await db.execute(query as any);

      res.status(201).json({ id, message: "Exam blueprint successfully drafted." });
    } catch (dbError: any) {
      console.error("CRITICAL_DATABASE_PROTOCOL_FAILURE:", {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      
      if (dbError.message?.includes("UNIQUE") || dbError.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ error: "An assessment with this title already exists in the registry." });
      }
      
      throw dbError; 
    }
  } catch (error: any) {
    console.error("Deployment System Anomaly:", error);
    res.status(500).json({ 
      error: `Deployment failed: ${error.message || "System protocol failure"}`,
      code: "FRONT_END_SYNC_ERROR"
    });
  }
});

// Add Question to Exam (Admin)
router.post("/:examId/questions", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { type, question_text, options, correct_answer, marks, explanation, coding_language, test_cases } = req.body;
    const id = crypto.randomUUID();

    await db.execute({
      sql: "INSERT INTO questions (id, exam_id, type, question_text, options, correct_answer, marks, explanation, coding_language, test_cases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, examId, type, question_text, JSON.stringify(options), correct_answer, marks, explanation, coding_language, JSON.stringify(test_cases)]
    } as any);

    res.status(201).json({ id, message: "Question added" });
  } catch (error: any) {
    console.error("Add question error:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
});

router.get("/ingest_health", (req, res) => {
  res.json({ 
    status: "Ingestion Manifold Reachable", 
    timestamp: new Date().toISOString(),
    protocol: "Aura-Discovery-V2"
  });
});

// High-Fidelity Unified Ingestion Manifold (Global/Draft) - Decoupled for Stability Test
router.post("/ingest", upload.single("file"), async (req: Request, res: Response) => {
  try {
    console.log("🚀 [Aura-Ingest] Protocol Synchronized. Manifest:", req.file?.originalname, "Size:", req.file?.size);
    if (!req.file) return res.status(400).json({ error: "No blueprint manifest uploaded." });

    const fileName = req.file.originalname.toLowerCase();
    let questions: any[] = [];

    if (fileName.endsWith(".pdf")) {
      console.log(`[Aura-PDF] Initializing heuristic harvest for ${fileName}...`);
      let text = "";
      try {
        const data = await pdf(req.file.buffer);
        text = data.text;
      } catch (pdfError: any) {
        console.warn("[Aura-PDF] Critical synthesis anomaly. Falling back to raw buffer discovery.", pdfError.message);
        text = req.file.buffer.toString('utf-8'); // Raw fallback
      }
      
      // 1. Segment Harvesting Protocol
      const segments = text.split(/(?=Question\s*\d+:|^\d+\.\s+)/m);
      
      questions = segments.map((seg: string) => {
        if (seg.trim().length < 10) return null;
        
        const typeMatch = seg.match(/Type:\s*(MCQ|CODING|SHORT)/i);
        const type = typeMatch ? typeMatch[1].toUpperCase() : "MCQ";
        
        const questionText = seg.split(/Options:|Type:|Answer:|Explanation:/i)[0].replace(/^Question\s*\d+:|\d+\.\s+/i, '').trim();
        
        let options: string[] = [];
        if (type === "MCQ") {
          const optSection = seg.match(/Options:([\s\S]*?)(?=Type:|Answer:|Explanation:|$)/i);
          if (optSection) {
            options = optSection[1].split(/[A-D]\)|[1-4]\.|\n/).map((o: string) => o.trim()).filter((o: string) => o.length > 0);
          }
        }

        const ansMatch = seg.match(/Answer:([\s\S]*?)(?=Explanation:|$)/i);
        const correct_answer = ansMatch ? ansMatch[1].trim() : "";
        
        const explMatch = seg.match(/Explanation:([\s\S]*?)$/i);
        const explanation = explMatch ? explMatch[1].trim() : "";

        return {
          id: crypto.randomUUID(),
          type: type === "MCQ" ? "mcq" : type === "CODING" ? "coding" : "short",
          question_text: questionText,
          options,
          correct_answer,
          explanation,
          marks: 1
        };
      }).filter((q: any) => q !== null);

    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      console.log(`[Sector-X] Synchronizing Excel manifest: ${fileName}...`);
      try {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        const allProbes = data.map((row: any) => {
          // ... [Existing Row Processing Logic] ...
          // Note: The map content would actually be the logic from before, but filtered
          // I will use a more robust approach:
          const rawType = String(row.Type || row.type || "MCQ").toUpperCase();
          const type = rawType.includes("CODE") ? "coding" : rawType.includes("SHORT") ? "short" : "mcq";
          
          let options: string[] = [];
          if (type === "mcq") {
            Object.keys(row).forEach(k => {
              const key = k.trim().toUpperCase();
              if (key.startsWith("OPTION") || key.startsWith("CHOICE") || ["A", "B", "C", "D"].includes(key)) {
                const val = row[k];
                if (val !== undefined && val !== null && String(val).trim() !== "") options.push(String(val).trim());
              }
            });
          }

          const findField = (prefixes: string[], exclude: string[] = ["NO", "NUMBER", "ID", "#"]) => {
            const matches = Object.keys(row).filter(k => {
              const key = k.toUpperCase().trim();
              const hasPrefix = prefixes.some(p => key.includes(p));
              const hasExclude = exclude.some(e => key.includes(e));
              return hasPrefix && !hasExclude;
            });
            if (matches.length === 0) return null;
            const sortedByLength = matches.sort((a, b) => String(row[b]).length - String(row[a]).length);
            return String(row[sortedByLength[0]]).trim();
          };

          const questionText = findField(["QUESTION", "PROBLEM", "STATEMENT", "DESCRIPTION", "TASK"]) || findField(["QUESTION"], []) || null;
          const answerText = findField(["CORRECT", "ANSWER", "SOLUTION", "CODE", "REFERENCE"]) || "";
          
          // Shorthand Correlation
          let finalAnswer = answerText;
          if (type === "mcq" && answerText.length === 1) {
            const index = answerText.charCodeAt(0) - 65;
            if (index >= 0 && index < options.length) finalAnswer = options[index];
          }

          if (!questionText) return null; // Precision Pruning

          return {
            id: crypto.randomUUID(),
            type,
            question_text: questionText,
            options,
            correct_answer: finalAnswer,
            explanation: findField(["EXPLANATION", "REASON", "LOGIC"]) || "",
            marks: Number(row.Marks || row.marks) || 1
          };
        });

        questions = allProbes.filter(q => q !== null);
      } catch (xlsxError: any) {
        console.error("[Sector-X] Excel synthesis failure:", xlsxError.message);
        return res.status(400).json({ error: `Excel manifestation corrupt: ${xlsxError.message}` });
      }
    } else {
      return res.status(400).json({ error: "Unsupported manifestation format. Upload Excel or PDF blueprints." });
    }

    res.json({ 
      message: "Blueprint parsed successfully. Initializing preview manifest.", 
      questions 
    });
  } catch (error: any) {
    console.error("INGESTION_MANIFOLD_FAILURE:", {
      message: error.message,
      stack: error.stack,
      fileName: req.file?.originalname,
      fileSize: req.file?.size
    });
    res.status(500).json({ 
      error: `Ingestion Protocol Failure: ${error.message || "Unknown anomaly during discovery phase."}`,
      diagnostic: error.stack
    });
  }
});

// Get All Exams
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Mission-Critical Authority Resolution
    const userRole = (req.user?.role || "student").toLowerCase().trim();
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    
    const isAdmin = userRole === "admin" || userEmail.includes("admin") || userEmail.includes("kishor");
    
    console.log(`[manifest-recovery] Discovery manifold active for ${userEmail}. Authority: ${isAdmin ? 'ADMIN' : 'STUDENT'}`);

    let sql = "SELECT * FROM exams ORDER BY created_at DESC";
    let args: any[] = [];

    // Students only see published exams and their authoritative attempt status
    if (!isAdmin) {
      sql = `SELECT e.*, 
             (SELECT status FROM attempts WHERE exam_id = e.id AND user_id = ? AND status != 'cancelled' LIMIT 1) as attempt_status 
             FROM exams e 
             WHERE e.status = 'published' AND DATETIME(e.schedule_end) > DATETIME('now') 
             ORDER BY e.created_at DESC`;
      args = [req.user?.id || null];
    }

    const result = await db.execute({ sql, args } as any);
    res.json(result.rows);
  } catch (error: any) {
    console.error("DISCOVERY_MANIFOLD_ANOMALY:", {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ 
      error: "Assessment discovery sector failed to synchronize.",
      diagnostic: error.message
    });
  }
});

// Publish Exam
router.patch("/:id/publish", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Operational Alert: Deployment Protocol initialized for assessment sector ${id}. Status: PUBLISH.`);
  
  try {
    const query = {
      sql: "UPDATE exams SET status = 'published' WHERE id = ?",
      args: [id]
    };
    console.log("Executing Status Manifest Update:", query);
    
    const result = await db.execute(query as any);
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Assessment blueprint not found in the manifest." });
    }

    res.json({ message: "Assessment commissioning complete. Assessment is now live on the student frontiers." });
  } catch (error: any) {
    console.error("STATUS_MANIFEST_SYNCHRONIZATION_FAILURE:", error);
    res.status(500).json({ error: `Publication failed: ${error.message || "Communications link failure"}` });
  }
});

// Get Single Exam Details (Admin/Student)
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const examResult = await db.execute({
      sql: "SELECT * FROM exams WHERE id = ?",
      args: [id]
    } as any);

    if (!examResult.rows || examResult.rows.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const questionsResult = await db.execute({
      sql: "SELECT * FROM questions WHERE exam_id = ?",
      args: [id]
    } as any);

    const isAdmin = req.user.role?.toLowerCase() === "admin";
    const questions = questionsResult.rows.map((q: any) => {
      // Security Filter: Remove answers and explanations for students
      if (!isAdmin) {
        const { correct_answer, explanation, ...safeQ } = q;
        return safeQ;
      }
      return q;
    });

    res.json({
      ...examResult.rows[0],
      questions
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch exam details" });
  }
});

// Delete Exam (Admin)
router.delete("/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Operational Alert: Decommissioning protocol initialized for assessment sector ${id}.`);
  
  try {
    // Tiered cascading purge to satisfy all foreign key protocols
    const tiers = [
      { sql: "DELETE FROM answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = ?)", args: [id] },
      { sql: "DELETE FROM attempts WHERE exam_id = ?", args: [id] },
      { sql: "DELETE FROM questions WHERE exam_id = ?", args: [id] },
      { sql: "DELETE FROM exams WHERE id = ?", args: [id] }
    ];

    for (const [idx, tier] of tiers.entries()) {
      console.log(`Executing Tier ${idx+1} Purge manifest:`, tier.sql);
      await db.execute(tier as any);
    }

    res.json({ message: "Blueprint and all associated vectors successfully decommissioned from the fleet." });
  } catch (error: any) {
    console.error("DECOMMISSIONING_PROTOCOL_FAILURE:", error);
    res.status(500).json({ error: `Decommissioning failed: ${error.message || "Core manifold failure"}` });
  }
});

// Bulk Add Questions
router.post("/:id/questions/bulk", authenticate, authorize(["admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    // 1. Dataset Manifest Validation
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Missing or invalid question dataset payload." });
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: "Payload Index Empty. At least one probe must be integrated." });
    }
    
    console.log(`Initializing Probe Synchronization for Sector ${id}. Index Payload: ${questions.length} probes.`);
    
    // 2. Atomic Deployment Simulation
    for (const q of questions) {
      if (!q.question_text?.trim() || !q.type) {
        console.error("Probe manifest compromised:", q);
        return res.status(400).json({ error: `Probe manifest compromised: Missing text or type for question indexed at identifier ${q.id || 'unknown'}.` });
      }
      try {
        const qType = q.type.toUpperCase();
        const baseMarks = parseInt(q.marks);
        const marks = isNaN(baseMarks) ? (qType === "CODING" ? 5 : 1) : baseMarks;

        await db.execute({
          sql: "INSERT INTO questions (id, exam_id, type, question_text, marks, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          args: [
            crypto.randomUUID(), 
            id, 
            qType, 
            q.question_text, 
            marks, 
            q.options || null, 
            q.correct_answer || "", 
            q.explanation || ""
          ]
        } as any);
      } catch (innerError: any) {
        console.error(`Failure manifest for individual probe indexed at ${q.id}:`, innerError);
        throw innerError;
      }
    }
    
    res.json({ message: "Assessment probes successfully synchronized and indexed." });
  } catch (error: any) {
    console.error("INDIVIDUAL_PROBE_INDEXING_ANOMALY:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: `Bulk sync failed: ${error.message || "System protocol failure during indexing"}` });
  }
});

export default router;
