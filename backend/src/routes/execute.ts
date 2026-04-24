import { Request, Response, Router } from "express";
import axios from "axios";
import { db } from "../config/db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

const languageMapping: Record<string, number> = {
  'javascript': 93, // Node.js 18.15.0
  'python': 92,     // Python 3.11.2
  'java': 91,       // OpenJDK 17
  'cpp': 76,        // C++ (GCC 9.2.0)
  'c': 75,          // C (GCC 9.2.0)
  'go': 60,         // Go (1.13.5)
  'php': 68,        // PHP (7.4.1)
  'ruby': 72,       // Ruby (2.7.0)
};

const executeOnJudge0 = async (language: string, code: string, stdin: string = "") => {
  const langKey = language.toLowerCase();
  const languageId = languageMapping[langKey] || 93;
  
  let processedCode = code;
  // Java requirement: public class name MUST usually be Main for simple execution
  if (langKey === 'java') {
    processedCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
    // If no public class found, just try to append
    if (processedCode === code && !code.includes('public class')) {
        // Very basic fallback
    }
  }

  try {
    const response = await axios.post(JUDGE0_URL, {
      language_id: languageId,
      source_code: processedCode,
      stdin: stdin
    }, { timeout: 15000 });

    const data = response.data;
    return {
      stdout: data.stdout,
      stderr: data.stderr,
      compile_output: data.compile_output,
      message: data.message,
      status: data.status?.description,
      statusId: data.status?.id
    };
  } catch (error: any) {
    console.error("[Judge0-Connector] API Trace Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Execution engine unreachable.");
  }
};

// Health Discovery Manifold
router.get("/health", (req, res) => {
  res.json({ status: "Execution Sector Active", timestamp: new Date().toISOString() });
});

// Direct Execution Manifest
router.post("/", async (req: Request, res: Response) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and Code manifest required for execution." });
  }

  try {
    const result = await executeOnJudge0(language, code, stdin || "");
    res.json(result);
  } catch (error: any) {
    console.error("[Sector-X] Direct Execution Failure:", error.message);
    res.status(500).json({ error: error.message });
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
      let expectedOutput = String(tc.output || "").trim();

      if (tc.output === "AUTO_DERIVE_FROM_ADMIN_BLUEPRINT") {
        try {
           const adminExec = await executeOnJudge0(language, (question as any).correct_answer, tc.input || "");
           expectedOutput = (adminExec.stdout || "").trim();
        } catch (e) {
           expectedOutput = "ADMIN_REFERENCE_ERROR";
        }
      }

      try {
         const studentExec = await executeOnJudge0(language, code, tc.input || "");

         const actualOutput = (studentExec.stdout || "").trim();
         const stderr = studentExec.stderr || studentExec.compile_output || "";
         
         results.push({
           input: tc.input,
           expected: expectedOutput,
           actual: actualOutput || (stderr ? `[ERROR]: ${stderr}` : ""),
           passed: actualOutput === expectedOutput && !studentExec.stderr && !studentExec.compile_output
         });
      } catch (e: any) {
         results.push({
           input: tc.input,
           expected: expectedOutput,
           actual: `[CRITICAL_EXECUTION_FAILURE]: ${e.message}`,
           passed: false
         });
      }
    }

    res.json({ results });
  } catch (error: any) {
    console.error("[Sector-X] Authoritative Validation Defeat:", error);
    res.status(500).json({ 
      error: "System manifold failure during validation.",
      details: error.message
    });
  }
});

export default router;
