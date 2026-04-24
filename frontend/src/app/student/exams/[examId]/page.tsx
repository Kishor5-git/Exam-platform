"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import Editor, { useMonaco } from "@monaco-editor/react";

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
  const [detailedOutput, setDetailedOutput] = useState<{
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    message?: string | null;
    status?: string | null;
  } | null>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const monaco = useMonaco();
  const consoleRef = useRef<HTMLDivElement>(null);
  const [userLanguages, setUserLanguages] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [hoveredQ, setHoveredQ] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Track visited questions correctly
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      setVisited(prev => new Set([...Array.from(prev), questions[currentIndex].id]));
    }
  }, [currentIndex, questions]);

  const handleSubmit = useCallback(async (isForced = false, message?: string) => {
    if (!isForced && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }
    
    setSubmitting(true);
    setShowSubmitConfirm(false);
    
    try {
      if (attemptId) {
        console.log("Submitting attempt:", attemptId);
        await api.post(`attempts/${attemptId}/submit`);
        toast.success(message || (isForced ? "Environment breach detected. Exam Manifested for safety." : "Exam submitted successfully!"));
        router.push(`/student/results/${attemptId}`);
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error(error.response?.data?.error || "Submission anomaly detected.");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, router, showSubmitConfirm]);

  const saveAnswer = useCallback(async (qId: string, value: string) => {
    try {
      if (attemptId) {
        await api.post(`attempts/${attemptId}/save`, { questionId: qId, response: value });
      }
    } catch (e) {
      console.error("Autosave failed");
    }
  }, [attemptId]);

  // Auto-scroll to console
  useEffect(() => {
    if ((consoleOutput || testResults || detailedOutput) && consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, testResults, detailedOutput]);

  // Local Storage Resiliency
  useEffect(() => {
    const saved = localStorage.getItem(`exam_backup_${examId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Backup restoration failed");
      }
    }
  }, [examId]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_backup_${examId}`, JSON.stringify(answers));
    }
  }, [answers, examId]);

  const [timerState, setTimerState] = useState<'normal' | 'warning' | 'critical'>('normal');
  const notifiedIntervals = useRef<Set<number>>(new Set());
  const endTimeRef = useRef<number | null>(null);

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
        
        if (data.savedAnswers) {
          const restored: Record<string, string> = {};
          data.savedAnswers.forEach((ans: any) => {
            restored[ans.question_id] = ans.response;
          });
          setAnswers(restored);
        }

        const remaining = data.remainingSeconds || (data.duration ? data.duration * 60 : 1800);
        endTimeRef.current = Date.now() + remaining * 1000;
        setTimeLeft(remaining);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load exam context.");
        router.push("/student/dashboard");
      }
    };
    fetchExam();
  }, [examId]);

  // Precise Timer Logic with Drift Correction
  useEffect(() => {
    if (loading || !endTimeRef.current) return;

    const runTimer = () => {
      const now = Date.now();
      const left = Math.max(0, Math.round((endTimeRef.current! - now) / 1000));
      setTimeLeft(left);

      // Warning States
      if (left <= 60) setTimerState('critical');
      else if (left <= 300) setTimerState('warning');
      else setTimerState('normal');

      // Notifications
      const minutes = Math.floor(left / 60);
      const seconds = left % 60;
      
      if (seconds === 0 && [10, 5, 1].includes(minutes) && !notifiedIntervals.current.has(minutes)) {
        notifiedIntervals.current.add(minutes);
        toast(
          `System Alert: ${minutes} minute${minutes > 1 ? 's' : ''} remaining in assessment session.`,
          {
            icon: '⏳',
            style: {
              borderRadius: '10px',
              background: minutes === 1 ? '#ef4444' : '#f59e0b',
              color: '#fff',
              fontWeight: 'bold',
            },
          }
        );
      }

      if (left === 0) {
        handleSubmit(true, "Temporal limit reached. Assessment synchronized automatically.");
      }
    };

    const interval = setInterval(runTimer, 1000);
    runTimer(); // Immediate execution

    return () => clearInterval(interval);
  }, [loading, handleSubmit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const qIds = Object.keys(answers);
      qIds.forEach(qId => {
        // Only save if it's the current question to avoid bulk hammering
        if (questions[currentIndex]?.id === qId) {
           saveAnswer(qId, answers[qId]);
        }
      });
    }, 2000); // 2s debounce
    return () => clearTimeout(timer);
  }, [answers, currentIndex, questions, saveAnswer]);

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
  };

  const formatCode = () => {
    if (monaco) {
      // Execute the formatting command in the active editor
      const editor = (window as any).monacoEditorInstance;
      if (editor) {
        editor.getAction('editor.action.formatDocument').run();
      }
    }
  };



  const handleRunCode = async () => {
    const qId = questions[currentIndex].id;
    const code = answers[qId] || "";
    const lang = userLanguages[qId] || questions[currentIndex].coding_language?.toLowerCase() || "javascript";
    
    setIsRunning(true);
    setConsoleOutput(null);
    setDetailedOutput(null);
    setTestResults(null);
    
    try {
      const { data } = await api.post("/execute", {
        language: lang,
        code: code,
        stdin: customInput
      });
      
      setDetailedOutput(data);
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
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

        <div className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500 shadow-lg ${
          timerState === 'critical' 
          ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-red-500/20 animate-pulse' 
          : timerState === 'warning' 
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-amber-500/10' 
          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10'
        }`}>
          <TimerIcon className={`w-5 h-5 ${timerState === 'critical' ? 'animate-bounce' : ''}`} />
          <span className={`text-2xl font-black tabular-nums tracking-tight ${timerState === 'critical' ? 'scale-110' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button 
          onClick={() => handleSubmit()}
          disabled={submitting}
          className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Synchronizing..." : (
            <>Submit <Send className="w-4 h-4" /></>
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 glass-card p-6 md:p-10 border-white/5 relative overflow-y-auto custom-scrollbar">
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
                           onClick={formatCode}
                           className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-500 border border-white/10 rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider"
                        >
                           <Code className="w-3 h-3" /> Format
                        </button>
                        <button 
                           onClick={handleRunCode}
                           disabled={isRunning}
                           className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-lg transition-all font-bold text-xs"
                        >
                           {isRunning ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Play className="w-3 h-3" />} Run Code
                        </button>
                        <button 
                           onClick={handleRunTests}
                           disabled={isRunning}
                           className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        >
                           {isRunning ? <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />} Run Tests
                        </button>
                     </div>
                   </div>
                   <div className="relative group rounded-b-2xl overflow-hidden border-x border-b border-white/10" style={{ minHeight: '400px' }}>
                     <Editor
                        onMount={(editor: any) => { (window as any).monacoEditorInstance = editor; }}
                        height="400px"
                        language={userLanguages[currentQ.id] || currentQ.coding_language?.toLowerCase() || 'javascript'}
                        theme="vs-dark"
                        value={answers[currentQ.id] || ""}
                        onChange={(code: string | undefined) => handleAnswerChange(code || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          fontFamily: '"Fira Code", "Fira Mono", monospace',
                          padding: { top: 24, bottom: 24 },
                          scrollBeyondLastLine: false,
                          formatOnPaste: true,
                          formatOnType: true,
                          automaticLayout: true,
                          tabSize: 4,
                          insertSpaces: true,
                          suggestOnTriggerCharacters: true
                        }}
                        className="bg-[#0a0a0a]"
                      />
                   </div>

                   {/* Custom Input Block */}
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
                       <Terminal className="w-3 h-3" /> Custom Input (stdin)
                     </div>
                     <textarea 
                       value={customInput}
                       onChange={(e) => setCustomInput(e.target.value)}
                       className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-xs outline-none focus:border-indigo-500/50 transition-all text-gray-300"
                       placeholder="Enter input here..."
                     />
                   </div>

                    <AnimatePresence>
                     {(consoleOutput || testResults || detailedOutput) && (
                       <motion.div 
                        ref={consoleRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-black border border-white/10 rounded-2xl font-mono text-xs space-y-4"
                       >
                         <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-white/5 pb-2">
                           <Terminal className="w-3 h-3" /> Output Manifest
                         </div>
                         
                         {consoleOutput && <pre className="whitespace-pre-wrap text-red-400">{consoleOutput}</pre>}

                         {detailedOutput && (
                           <div className="space-y-4">
                             {detailedOutput.status && (
                               <div className={`text-[10px] uppercase font-black px-2 py-1 inline-block rounded ${
                                 detailedOutput.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                               }`}>
                                 Status: {detailedOutput.status}
                               </div>
                             )}

                             {detailedOutput.compile_output && (
                               <div className="space-y-2">
                                 <div className="text-amber-500 font-bold uppercase tracking-widest text-[8px]">Compilation Log:</div>
                                 <pre className="whitespace-pre-wrap text-amber-200/70 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 overflow-x-auto">
                                   {detailedOutput.compile_output}
                                 </pre>
                               </div>
                             )}

                             {detailedOutput.stdout && (
                               <div className="space-y-2">
                                 <div className="text-indigo-400 font-bold uppercase tracking-widest text-[8px]">Standard Output:</div>
                                 <pre className="whitespace-pre-wrap text-indigo-100 bg-white/5 p-3 rounded-lg border border-white/5 overflow-x-auto">
                                   {detailedOutput.stdout}
                                 </pre>
                               </div>
                             )}

                             {detailedOutput.stderr && (
                               <div className="space-y-2">
                                 <div className="text-red-400 font-bold uppercase tracking-widest text-[8px]">Error Stream:</div>
                                 <pre className="whitespace-pre-wrap text-red-200 bg-red-500/5 p-3 rounded-lg border border-red-500/10 overflow-x-auto">
                                   {detailedOutput.stderr}
                                 </pre>
                               </div>
                             )}

                             {detailedOutput.message && !detailedOutput.stdout && !detailedOutput.stderr && !detailedOutput.compile_output && (
                               <pre className="text-gray-400 italic">{detailedOutput.message}</pre>
                             )}
                           </div>
                         )}
                         
                         {testResults && (
                           <div className="grid grid-cols-1 gap-3">
                              {testResults.map((tr, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${tr.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="font-black uppercase tracking-widest text-[8px] text-gray-500">Test Case {i+1}</span>
                                      <span className={`font-black uppercase tracking-widest text-[8px] ${tr.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tr.passed ? 'Passed' : 'Failed'}
                                      </span>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                                      <div>
                                        <div className="text-gray-500 mb-1">Input:</div>
                                        <code className="text-white block bg-white/5 p-2 rounded">{tr.input || "None"}</code>
                                      </div>
                                      <div>
                                        <div className="text-gray-500 mb-1">Expected:</div>
                                        <code className="text-emerald-400 block bg-emerald-500/5 p-2 rounded">{tr.expected}</code>
                                      </div>
                                      <div>
                                        <div className="text-gray-500 mb-1">Actual:</div>
                                        <code className={`${tr.passed ? "text-emerald-400" : "text-red-400"} block bg-white/5 p-2 rounded`}>{tr.actual}</code>
                                      </div>
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
        <aside className="w-full lg:w-80 glass-card p-6 border-white/5 flex flex-col gap-6 overflow-hidden">
          <div className="space-y-4">
             <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center justify-between">
                Question Palette
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">
                   Batch {Math.ceil((currentIndex + 1) / 10)}
                </span>
             </h3>
             
             {/* Progress Summary */}
             <div className="grid grid-cols-3 gap-2 pb-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-center">
                   <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-1">Answered</p>
                   <p className="text-xl font-black text-indigo-400">{Object.keys(answers).length}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-center">
                   <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Waitlist</p>
                   <p className="text-xl font-black text-white">{questions.length - Object.keys(answers).length}</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                   <p className="text-[8px] text-amber-300 font-black uppercase tracking-widest mb-1">Flagged</p>
                   <p className="text-xl font-black text-amber-400">{Object.keys(flags).filter(k => flags[k]).length}</p>
                </div>
             </div>

             {/* Filters */}
             <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'flagged', label: 'Flags' },
                  { id: 'unanswered', label: 'Missed' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPaletteFilter(f.id as any)}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                      paletteFilter === f.id ? 'bg-indigo-500 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 grid grid-cols-5 md:grid-cols-10 lg:grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar content-start">
            {questions.map((q, i) => {
              // Filtering Logic
              const isFlagged = flags[q.id];
              const isAnswered = answers[q.id];
              const isVisited = visited.has(q.id);
              
              if (paletteFilter === 'flagged' && !isFlagged) return null;
              if (paletteFilter === 'unanswered' && isAnswered) return null;

              return (
                <div key={q.id} className="relative">
                  <button
                    onClick={() => setCurrentIndex(i)}
                    onMouseEnter={() => setHoveredQ(q.id)}
                    onMouseLeave={() => setHoveredQ(null)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all group ${
                      currentIndex === i 
                      ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-105 z-20' 
                      : ''
                    } ${
                      isAnswered 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                      : (isFlagged ? 'bg-amber-500/10 border-2 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 
                         (isVisited ? 'bg-white/5 text-gray-300 border border-white/20' : 'bg-[#121212] text-gray-700 border border-white/5 opacity-50'))
                    }`}
                  >
                    {i + 1}
                    
                    {/* Hover Tooltip Overlay */}
                    <AnimatePresence>
                      {hoveredQ === q.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-3 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl z-50 pointer-events-none shadow-2xl"
                        >
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <span className="text-[8px] font-black uppercase text-indigo-400">Quest {i+1}</span>
                            <span className="text-[8px] font-black uppercase text-gray-500">{q.type}</span>
                          </div>
                          <p className="text-[10px] text-gray-300 line-clamp-3 leading-relaxed font-medium">
                            {q.question_text}
                          </p>
                          <div className="mt-2 flex gap-1">
                            {isAnswered && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            {!isVisited && <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  {isFlagged && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-black animate-pulse" />}
                </div>
              );
            })}
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-white/5 text-[9px] font-bold">
            <div className="flex items-center justify-between text-gray-600">
               <span>LEGEND:</span>
               <span className="text-indigo-400">SESSION_ACTIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-emerald-500" /> <span className="text-gray-400 uppercase tracking-tighter">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-amber-500" /> <span className="text-gray-400 uppercase tracking-tighter">Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-white/20" /> <span className="text-gray-400 uppercase tracking-tighter">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-[#121212] border border-white/5" /> <span className="text-gray-400 uppercase tracking-tighter">New</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
              <AlertCircle className="w-3 h-3" /> Security Protocol
            </div>
            <p className="text-[8px] text-gray-500 leading-relaxed font-bold uppercase">
              Encrypted channel active. Session biometric sync verified. Autosave frequency: 2hz.
            </p>
          </div>
        </aside>
      </div>
      {/* Submission Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-8 border-white/10 text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <Send className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Final Synchronization?</h3>
                <p className="text-gray-500 text-sm font-medium">
                  You are about to manifest your assessment performance. Once synchronized, the frontier will be decommissioned.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => setShowSubmitConfirm(false)}
                  className="btn-secondary py-4 uppercase font-black tracking-widest text-[10px]"
                >
                  Stay in Sector
                </button>
                <button 
                  onClick={() => handleSubmit(false)}
                  className="btn-primary py-4 uppercase font-black tracking-widest text-[10px] shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  Confirm Sync
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
