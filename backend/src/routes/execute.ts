import { Request, Response, Router } from "express";
import axios from "axios";
import { db } from "../config/db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";
const PISTON_HEADERS = {
  "User-Agent": "ExamPro-Universal-Executor/1.0",
  "Content-Type": "application/json"
};

// Health Discovery Manifold
router.get("/health", (req, res) => {
  res.json({ status: "Execution Sector Active", timestamp: new Date().toISOString() });
});

// Direct Execution Manifest
router.post("/", async (req: Request, res: Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and Code manifest required for execution." });
  }

  try {
    const response = await axios.post(PISTON_URL, {
      language: language,
      version: "*",
      files: [{ content: code }],
      stdin: ""
    }, { headers: PISTON_HEADERS, timeout: 30000 });

    if (response.data.run) {
      res.json(response.data.run);
    } else {
      res.status(502).json({ error: "Upstream execution failure." });
    }
  } catch (error: any) {
    console.error("[Sector-X] Direct Execution Failure:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Authoritative Assessment Validation Manifold
router.post("/test", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, language, code } = req.body;

    if (!questionId || !language || !code) {
       return res.status(400).json({ error: "Incomplete validation manifest (ID/Lang/Code required)." });
    }

    // 1. Fetch Authoritative Question Blueprint
    const qResult = await db.execute({
      sql: "SELECT * FROM questions WHERE id = ?",
      args: [questionId]
    } as any);

    if (!qResult || !qResult.rows || qResult.rows.length === 0) {
      return res.status(404).json({ error: "Assessment probe not found in registry." });
    }

    const question = qResult.rows[0];
    let testCases = [];
    try {
      const rawTC = (question as any).test_cases;
      testCases = typeof rawTC === 'string' ? JSON.parse(rawTC || "[]") : (rawTC || []);
    } catch (e) {
      testCases = [];
    }

    // 2. Reference Synthesis Fallback
    if ((!testCases || testCases.length === 0) && (question as any).correct_answer) {
      testCases = [{
        input: "",
        output: "AUTO_DERIVE_FROM_ADMIN_BLUEPRINT",
        isReference: true
      }];
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: "No authoritative test cases or reference solution found." });
    }

    const results = [];
    for (const tc of testCases) {
      let expectedOutput = tc.output;

      if (tc.output === "AUTO_DERIVE_FROM_ADMIN_BLUEPRINT") {
        try {
           const adminExec = await axios.post(PISTON_URL, {
             language: language,
             version: "*",
             files: [{ content: (question as any).correct_answer }],
             stdin: tc.input || ""
           }, { headers: PISTON_HEADERS, timeout: 15000 });
           expectedOutput = (adminExec.data.run?.stdout || "").trim();
        } catch (e) {
           expectedOutput = "ADMIN_REFERENCE_ERROR";
        }
      }

      try {
         const studentExec = await axios.post(PISTON_URL, {
           language: language,
           version: "*",
           files: [{ content: code }],
           stdin: tc.input || ""
         }, { headers: PISTON_HEADERS, timeout: 15000 });

         const actualOutput = (studentExec.data.run?.stdout || "").trim();
         const stderr = studentExec.data.run?.stderr || "";
         
         results.push({
           input: tc.input,
           expected: expectedOutput,
           actual: actualOutput || (stderr ? `[ERROR]: ${stderr}` : ""),
           passed: actualOutput === expectedOutput.trim() && !stderr
         });
      } catch (e) {
         results.push({
           input: tc.input,
           expected: expectedOutput,
           actual: "[CRITICAL_EXECUTION_FAILURE]",
           passed: false
         });
      }
    }

    res.json({ results });
  } catch (error: any) {
    console.error("[Sector-X] Authoritative Validation Defeat:", error);
    res.status(500).json({ 
      error: "System manifold failure during validation.",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
