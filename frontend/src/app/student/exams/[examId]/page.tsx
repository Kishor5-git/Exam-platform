"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Timer as TimerIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Send, 
  AlertCircle,
  Code,
  CheckCircle,
  Play,
  Terminal,
  Cpu,
  Monitor
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import { toast } from "react-hot-toast";

// Coding Editor Imports
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";

export default function ExamPage() {
  const { examId } = useParams();
  console.log("Assessment Active Frontier ID:", examId);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize Exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.post(`attempts/${examId}/start`);
        setAttemptId(data.attempt.id);
        const qList = data.questions.map((q: any) => ({
          ...q,
          options: JSON.parse(q.options),
          test_cases: q.test_cases ? JSON.parse(q.test_cases) : []
        }));
        setQuestions(qList);
        
        // Restore saved answers if index exists
        if (data.savedAnswers) {
          const restored: Record<string, string> = {};
          data.savedAnswers.forEach((ans: any) => {
            restored[ans.question_id] = ans.response;
          });
          setAnswers(restored);
        }

        // Set Timer (Defensive Temporal Synthesis)
        const durationFromManifest = data.remainingSeconds || (data.duration ? data.duration * 60 : 0);
        
        if (durationFromManifest > 0) {
          setTimeLeft(durationFromManifest);
        } else {
          // Absolute Fallback: Default to 30 mins if manifest is missing
          setTimeLeft(30 * 60);
        }
        
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load exam. Please try again.");
        router.push("/student/dashboard");
      }
    };
    fetchExam();
  }, [examId]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, loading]);

  // Autosave Logic (Simplified for brevity)
  const saveAnswer = async (qId: string, value: string) => {
    try {
      if (attemptId) {
        await api.post(`attempts/${attemptId}/save`, { questionId: qId, response: value });
      }
    } catch (e) {
      console.error("Autosave failed");
    }
  };

  const handleSubmit = useCallback(async (isForced = false) => {
    if (!isForced && !confirm("Are you sure you want to submit? This manifest cannot be re-opened.")) return;
    try {
      if (attemptId) {
        await api.post(`attempts/${attemptId}/submit`);
        toast.success(isForced ? "Environment breach detected. Exam Manifested for safety." : "Exam submitted successfully!");
        router.push(`/student/results/${attemptId}`);
      }
    } catch (error) {
      toast.error("Submission anomaly detected.");
    }
  }, [attemptId, router]);

  // Proximity Fail-safe: Auto-submit if student "comes out" of the exam environment
  useEffect(() => {
    const handleEnvironmentalBreach = () => {
      // Check if the environment is still authoritative
      if ((document.visibilityState === "hidden" || !document.hasFocus()) && attemptId && !loading) {
        console.warn("Environmental breach detected. Executing emergency submission protocol...");
        handleSubmit(true); // Forced submission
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleEnvironmentalBreach);
    window.addEventListener("blur", handleEnvironmentalBreach);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", handleEnvironmentalBreach);
      window.removeEventListener("blur", handleEnvironmentalBreach);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [attemptId, loading, handleSubmit]);
  
  const handleAnswerChange = (value: string) => {
    const qId = questions[currentIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: value }));
    saveAnswer(qId, value);
  };

  const [userLanguages, setUserLanguages] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<any[] | null>(null);

  const handleRunCode = async () => {
    const qId = questions[currentIndex].id;
    const code = answers[qId] || "";
    const lang = userLanguages[qId] || questions[currentIndex].coding_language?.toLowerCase() || "javascript";
    
    setIsRunning(true);
    setConsoleOutput(null);
    setTestResults(null);
    
    try {
      const { data } = await api.post("/execute", {
        language: lang,
        code: code
      });
      
      let output = data.stdout || data.stderr;
      if (!output && data.signal) output = `Terminated by signal: ${data.signal}`;
      if (!output) output = "Execution completed with no output manifest.";
      setConsoleOutput(output);
    } catch (error: any) {
      setConsoleOutput(`[CRITICAL_FAILURE]: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    const qId = questions[currentIndex].id;
    const code = answers[qId] || "";
    const lang = userLanguages[qId] || questions[currentIndex].coding_language?.toLowerCase() || "javascript";
    
    setIsRunning(true);
    setConsoleOutput(null);
    setTestResults(null);
    
    try {
      const { data } = await api.post("/execute/test", {
        questionId: qId,
        language: lang,
        code: code
      });
      
      setTestResults(data.results);
      if (data.results.length === 0) setConsoleOutput("No authoritative test cases or reference blueprints defined for this probe.");
    } catch (error: any) {
      setConsoleOutput(`[TEST_VALIDATION_FAILURE]: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-bold">Securing Session...</p>
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Exam Header */}
      <header className="glass-card m-4 p-4 border-white/5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center font-black">E</div>
          <div>
            <h1 className="font-bold text-lg hidden sm:block">Advanced Systems Quiz</h1>
            <p className="text-xs text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-6 py-2 rounded-full border ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
          <TimerIcon className="w-5 h-5" />
          <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={() => handleSubmit()}
          className="btn-primary py-2 px-6 flex items-center gap-2"
        >
          Submit <Send className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 glass-card p-10 border-white/5 relative overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-indigo-400 border border-indigo-500/20">
                  {currentQ.marks} Marks • {currentQ.type}
                </span>
                <button 
                  onClick={() => setFlags(p => ({ ...p, [currentQ.id]: !p[currentQ.id] }))}
                  className={`p-2 rounded-lg transition-all ${flags[currentQ.id] ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-white/5 text-gray-500'}`}
                >
                  <Flag className="w-5 h-5" fill={flags[currentQ.id] ? "currentColor" : "none"} />
                </button>
              </div>

              <h2 className="text-2xl font-bold leading-relaxed">
                {currentQ.question_text}
              </h2>

              {/* MCQ Options */}
              {currentQ.type === 'MCQ' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {currentQ.options.map((option: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerChange(option)}
                      className={`p-6 text-left rounded-2xl border transition-all text-lg flex items-center gap-4 ${
                        answers[currentQ.id] === option 
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                        answers[currentQ.id] === option ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {currentQ.type === 'SHORT_ANSWER' && (
                <div className="pt-4">
                  <textarea 
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    placeholder="Type your answer here..."
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                </div>
              )}
              {currentQ.type === 'CODING' && (
                <div className="pt-4 space-y-4">
                   <div className="flex items-center justify-between gap-2 text-sm text-gray-400 px-6 py-4 bg-white/5 border border-white/5 rounded-t-2xl">
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                           <Cpu className="w-4 h-4 text-indigo-400" />
                           <span className="font-black uppercase tracking-widest text-[10px]">Universal IDE Manifold</span>
                        </div>
                        <select 
                          value={userLanguages[currentQ.id] || currentQ.coding_language?.toLowerCase() || "javascript"}
                          onChange={(e) => setUserLanguages(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all text-gray-300"
                        >
                          <option value="javascript" className="bg-black">JavaScript</option>
                          <option value="python" className="bg-black">Python</option>
                          <option value="java" className="bg-black">Java</option>
                          <option value="cpp" className="bg-black">C++</option>
                          <option value="go" className="bg-black">Go</option>
                          <option value="ruby" className="bg-black">Ruby</option>
                          <option value="php" className="bg-black">PHP</option>
                        </select>
                     </div>
                     <div className="flex items-center gap-3">
                        <button 
                           onClick={handleRunCode}
                           disabled={isRunning}
                           className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-lg transition-all font-bold text-xs"
                        >
                           {isRunning ? "Running..." : <><Play className="w-3 h-3" /> Run</>}
                        </button>
                        <button 
                           onClick={handleRunTests}
                           disabled={isRunning}
                           className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        >
                           {isRunning ? "Synthesizing..." : <><CheckCircle className="w-3 h-3" /> Run Tests</>}
                        </button>
                     </div>
                   </div>
                   <div className="relative group">
                     <Editor
                        value={answers[currentQ.id] || ""}
                        onValueChange={code => handleAnswerChange(code)}
                        highlight={code => highlight(code, languages[userLanguages[currentQ.id] || currentQ.coding_language?.toLowerCase() || 'javascript'], userLanguages[currentQ.id] || currentQ.coding_language?.toLowerCase() || 'javascript')}
                        padding={24}
                        className="font-mono text-sm bg-[#0a0a0a] border-x border-b border-white/10 rounded-b-2xl min-h-[400px] outline-none focus:ring-1 focus:ring-indigo-500/30"
                        style={{
                          fontFamily: '"Fira Code", "Fira Mono", monospace',
                        }}
                      />
                   </div>

                   {/* Console Output & Test Results */}
                   <AnimatePresence>
                     {(consoleOutput || testResults) && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-black border border-white/10 rounded-2xl font-mono text-xs space-y-4"
                       >
                         <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-white/5 pb-2">
                           <Terminal className="w-3 h-3" /> Output Manifest
                         </div>
                         
                         {consoleOutput && <pre className="whitespace-pre-wrap text-indigo-300">{consoleOutput}</pre>}
                         
                         {testResults && (
                           <div className="space-y-3">
                              {testResults.map((tr, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${tr.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="font-black uppercase tracking-widest text-[8px]">Test Case {i+1}</span>
                                      <span className={`font-black uppercase tracking-widest text-[8px] ${tr.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tr.passed ? 'Passed' : 'Failed'}
                                      </span>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 text-[10px]">
                                      <div><span className="text-gray-500">Input:</span> <code className="text-white">{tr.input || "None"}</code></div>
                                      <div><span className="text-gray-500">Expected:</span> <code className="text-emerald-400">{tr.expected}</code></div>
                                      <div className="col-span-2"><span className="text-gray-500">Actual:</span> <code className={tr.passed ? "text-emerald-400" : "text-red-400"}>{tr.actual}</code></div>
                                   </div>
                                </div>
                              ))}
                           </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(p => p - 1)}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            <button 
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(p => p + 1)}
              className="btn-primary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-full lg:w-80 glass-card p-6 border-white/5 flex flex-col gap-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4">Question Palette</h3>
          
          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-4 gap-2 overflow-y-auto max-h-[400px] lg:max-h-none pr-2 custom-scrollbar">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black transition-all relative ${
                  currentIndex === i 
                  ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-110 z-10' 
                  : ''
                } ${
                  answers[q.id] 
                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40' 
                  : (flags[q.id] ? 'bg-black border-2 border-amber-500/50 text-amber-500' : 'bg-[#1a1a1a] text-gray-500 border border-white/5')
                }`}
              >
                {i + 1}
                {flags[q.id] && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-black" />}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-white/5 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-emerald-500" /> <span className="text-gray-400">Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-amber-500" /> <span className="text-gray-400">Flagged for Review</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-white/10" /> <span className="text-gray-400">Not Visited</span>
            </div>
          </div>
          
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4" /> Exam Policy
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Your session is being monitored. Switching tabs or minimizing the window will be logged. Auto-save is active.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
