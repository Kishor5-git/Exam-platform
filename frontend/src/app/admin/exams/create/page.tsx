"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { 
  ChevronRight, 
  Settings, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Rocket,
  Code,
  Type,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useRef } from "react";

export default function CreateExamPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState({
    title: "",
    duration: 60,
    passing_score: 40,
    schedule_start: "",
    schedule_end: ""
  });

  const to12h = (isoString: string) => {
    if (!isoString || !isoString.includes('T')) return { time: "12:00", meridian: "AM" };
    const time24 = isoString.split('T')[1];
    const [h, m] = time24.split(":").map(Number);
    const meridian = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { time: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, meridian };
  };

  const to24h = (time12: string, meridian: string) => {
    let [h, m] = time12.split(":").map(Number);
    if (isNaN(h)) h = 12;
    if (isNaN(m)) m = 0;
    if (meridian === "PM" && h < 12) h += 12;
    if (meridian === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [questions, setQuestions] = useState<any[]>([]);

  const addQuestion = (type: "mcq" | "short" | "coding") => {
    const newQuestion = {
      id: Date.now(),
      type,
      question_text: "",
      marks: type === "coding" ? 5 : 1,
      options: type === "mcq" ? ["", "", "", ""] : [],
      correct_answer: "",
      explanation: ""
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const downloadTemplate = () => {
    const templateData = [
      { 
        "Question": "What is Python?", 
        "Type": "MCQ", 
        "Option 1": "A Snake", 
        "Option 2": "A Programing Language", 
        "Option 3": "A Car", 
        "Option 4": "A Food", 
        "Correct Answer": "A Programing Language",
        "Marks": 1,
        "Explanation": "Python is a high-level interpreted programming language."
      },
      { 
        "Question": "Write a function to add two numbers.", 
        "Type": "CODING", 
        "Language": "python",
        "Correct Answer": "def add(a, b):\n    return a + b",
        "Marks": 5,
        "Explanation": "Standard addition function."
      },
      { 
        "Question": "What is the capital of France?", 
        "Type": "SHORT", 
        "Correct Answer": "Paris",
        "Marks": 2,
        "Explanation": "Paris is the capital and most populous city of France."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Manifest");
    XLSX.writeFile(wb, "Assessment_Blueprint_Template.xlsx");
    toast.success("Assessment blueprint template exported.");
  };

  const [activeSectorIngest, setActiveSectorIngest] = useState<string | null>(null);

  const handleSectorIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const tid = toast.loading(`Synthesizing sector probes from ${file.name}...`);
    try {
      const response = await fetch(`/api/exams/ingest`, {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("RAW_INGESTION_RESPONSE:", text);
        throw new Error(`Sector Manifest Corrupt: ${text.substring(0, 100)}...`);
      }
      
      const imported = data.questions.map((q: any) => ({
        ...q,
        // If we triggered from a specific sector, force the type manifest
        type: activeSectorIngest || q.type, 
        isPending: true
      }));

      setQuestions([...questions, ...imported]);
      toast.success(`Sector manifold synchronized: ${imported.length} probes Manifested.`, { id: tid });
    } catch (error: any) {
      const msg = error.message || "Ingestion Manifold Failure: Remote sector unreachable.";
      toast.error(msg, { id: tid, duration: 5000 });
      console.error("INGESTION_ANOMALY_TRACE:", error);
    }
    setActiveSectorIngest(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateStep1 = () => {
    if (!examData.title.trim()) {
      toast.error("Assessment Title is mandatory.");
      return false;
    }
    const start = new Date(examData.schedule_start);
    const end = new Date(examData.schedule_end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Temporal Manifest Corrupted: Ensure both Opening and Closing dates are valid.");
      return false;
    }

    if (end <= start) {
      toast.error("Temporal Paradox: Closing window must follow the opening window.");
      return false;
    }
    if (examData.duration <= 0) {
      toast.error("Mission Duration must be a positive integer.");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    // 1. Surgical Pruning of Empty/Ghost Probes
    const validQuestions = questions.filter(q => {
      const hasText = q.question_text && q.question_text.trim() !== "";
      const hasAnswer = q.correct_answer && String(q.correct_answer).trim() !== "";
      // For MCQs, also ensure at least one option exists
      if (q.type === "mcq") {
        return hasText && hasAnswer && q.options.some((o: string) => o && o.trim() !== "");
      }
      return hasText && hasAnswer;
    });

    if (validQuestions.length === 0) {
      toast.error("Payload Manifest Empty: Ensure you have at least one complete assessment probe.");
      return;
    }

    // 2. Intelligence Validation for Partial Probes
    const partialQ = questions.find(q => {
      const hasText = q.question_text && q.question_text.trim() !== "";
      const hasAnswer = q.correct_answer && String(q.correct_answer).trim() !== "";
      // A partial probe is one that has text but missing answer, or vice-versa
      return (hasText && !hasAnswer) || (!hasText && hasAnswer);
    });

    if (partialQ) {
      toast.error(`Structural Friction: Question "${partialQ.question_text.substring(0, 20)}..." is partially Manifested. Ensure both text and answer are complete.`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Executing Deployment Protocol...");
    try {
      // 1. Create Exam Blueprint
      const { data: exam } = await api.post("exams", examData);
      
      // 2. Transmit Question Dataset (Syncing with Pruned Manifest)
      await api.post(`exams/${exam.id}/questions/bulk`, { 
          questions: validQuestions.map(q => ({
              ...q,
              type: q.type === "mcq" ? "MCQ" : q.type === "short" ? "SHORT_ANSWER" : "CODING",
              options: q.type === "mcq" ? JSON.stringify(q.options.filter((o: string) => o.trim() !== "")) : null
          }))
      });

      toast.success("Assessment Link Established and Live!", { id: toastId });
      router.push("/admin/exams");
    } catch (error: any) {
      console.error("AXIOS_DEFEAT_PROTOTYPE:", error.response?.data || error.message || error);
      // Stringify for deep-sector visibility in some overlays
      if (typeof error === 'object') {
        console.error("DETAILED_ANOMALY_TRACE:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      const msg = error.response?.data?.error || error.response?.data?.message || "Deployment protocol failed: Communications link lost.";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">Create <span className="gradient-text">New Assessment</span></h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Commissioning Phase: Step {step} of 2</p>
           </div>
           <div className="flex gap-4">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="btn-secondary px-6">Back</button>
              )}
               <button 
                  onClick={step === 1 ? () => validateStep1() && setStep(2) : handleCreate} 
                  disabled={loading}
                  className="btn-primary px-8 flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-95"
               >
                {step === 1 ? "Configure Payload" : "Deploy Commission"} <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-8 border-white/5 space-y-6">
                <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight text-indigo-400">
                  <Settings className="w-5 h-5" /> Core Parameters
                </h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Assessment Title</label>
                      <input 
                        type="text" 
                        value={examData.title}
                        onChange={(e) => setExamData({...examData, title: e.target.value})}
                        placeholder="e.g. Advanced Quantum Computing Mid-term" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 transition-all font-bold" 
                      />
                   </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Duration (Minutes)</label>
                          <input 
                            type="number" 
                            value={examData.duration || ""}
                            onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 0})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 transition-all font-bold" 
                            placeholder="60"
                          />
                       </div>
                    </div>
                </div>
              </div>

              <div className="glass-card p-8 border-white/5 space-y-6">
                <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight text-indigo-400">
                  <Rocket className="w-5 h-5" /> Schedule Protocols
                </h3>
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex justify-between">
                            Window Opening
                            {examData.schedule_start && <span className="text-indigo-400 normal-case">{new Date(examData.schedule_start).toLocaleString([], {hour: '2-digit', minute:'2-digit', hour12: true})}</span>}
                         </label>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input 
                              type="date" 
                              value={examData.schedule_start.split('T')[0] || ""}
                              onChange={(e) => {
                                const time = examData.schedule_start.split('T')[1] || "12:00";
                                const newStart = `${e.target.value}T${time}`;
                                
                                // Auto-calculate 24h offset for closure
                                const offsetDate = new Date(newStart);
                                offsetDate.setDate(offsetDate.getDate() + 1);
                                const newEnd = offsetDate.toISOString().slice(0, 16);

                                setExamData({
                                  ...examData, 
                                  schedule_start: newStart,
                                  schedule_end: examData.schedule_end || newEnd
                                });
                              }}
                              className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold" 
                            />
                            <div className="md:col-span-2 flex gap-2">
                               <div className="flex-1 flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                                  <select 
                                    value={to12h(examData.schedule_start).time.split(':')[0]}
                                    onChange={(e) => {
                                      const date = examData.schedule_start.split('T')[0] || new Date().toISOString().split('T')[0];
                                      const minute = to12h(examData.schedule_start).time.split(':')[1];
                                      const meridian = to12h(examData.schedule_start).meridian;
                                      const newTime24 = to24h(`${e.target.value}:${minute}`, meridian);
                                      setExamData({...examData, schedule_start: `${date}T${newTime24}`});
                                    }}
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-center appearance-none cursor-pointer hover:text-indigo-400 transition-colors"
                                  >
                                    {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h} className="bg-[#0a0a0a]">{h}</option>)}
                                  </select>
                                  <span className="flex items-center text-gray-700">:</span>
                                  <select 
                                    value={to12h(examData.schedule_start).time.split(':')[1]}
                                    onChange={(e) => {
                                      const date = examData.schedule_start.split('T')[0] || new Date().toISOString().split('T')[0];
                                      const hour = to12h(examData.schedule_start).time.split(':')[0];
                                      const meridian = to12h(examData.schedule_start).meridian;
                                      const newTime24 = to24h(`${hour}:${e.target.value}`, meridian);
                                      setExamData({...examData, schedule_start: `${date}T${newTime24}`});
                                    }}
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-center appearance-none cursor-pointer hover:text-indigo-400 transition-colors"
                                  >
                                    {["00", "15", "30", "45"].concat(Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')).filter(m => !["00", "15", "30", "45"].includes(m))).sort().map(m => (
                                      <option key={m} value={m} className="bg-[#0a0a0a]">{m}</option>
                                    ))}
                                  </select>
                               </div>
                               <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                                  {["AM", "PM"].map(m => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const date = examData.schedule_start.split('T')[0] || new Date().toISOString().split('T')[0];
                                        const time12 = to12h(examData.schedule_start).time;
                                        const newTime24 = to24h(time12, m);
                                        setExamData({...examData, schedule_start: `${date}T${newTime24}`});
                                      }}
                                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${to12h(examData.schedule_start).meridian === m ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex justify-between">
                            Window Closing
                            {examData.schedule_end && <span className="text-indigo-400 normal-case">{new Date(examData.schedule_end).toLocaleString([], {hour: '2-digit', minute:'2-digit', hour12: true})}</span>}
                         </label>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input 
                              type="date" 
                              value={examData.schedule_end.split('T')[0] || ""}
                              onChange={(e) => {
                                const time = examData.schedule_end.split('T')[1] || "00:00";
                                setExamData({...examData, schedule_end: `${e.target.value}T${time}`});
                              }}
                              className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold" 
                            />
                            <div className="md:col-span-2 flex gap-2">
                               <div className="flex-1 flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                                  <select 
                                    value={to12h(examData.schedule_end).time.split(':')[0]}
                                    onChange={(e) => {
                                      const date = examData.schedule_end.split('T')[0] || new Date().toISOString().split('T')[0];
                                      const minute = to12h(examData.schedule_end).time.split(':')[1];
                                      const meridian = to12h(examData.schedule_end).meridian;
                                      const newTime24 = to24h(`${e.target.value}:${minute}`, meridian);
                                      setExamData({...examData, schedule_end: `${date}T${newTime24}`});
                                    }}
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-center appearance-none cursor-pointer hover:text-indigo-400 transition-colors"
                                  >
                                    {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h} className="bg-[#0a0a0a]">{h}</option>)}
                                  </select>
                                  <span className="flex items-center text-gray-700">:</span>
                                  <select 
                                    value={to12h(examData.schedule_end).time.split(':')[1]}
                                    onChange={(e) => {
                                      const date = examData.schedule_end.split('T')[0] || new Date().toISOString().split('T')[0];
                                      const hour = to12h(examData.schedule_end).time.split(':')[0];
                                      const meridian = to12h(examData.schedule_end).meridian;
                                      const newTime24 = to24h(`${hour}:${e.target.value}`, meridian);
                                      setExamData({...examData, schedule_end: `${date}T${newTime24}`});
                                    }}
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-center appearance-none cursor-pointer hover:text-indigo-400 transition-colors"
                                  >
                                    {["00", "15", "30", "45"].concat(Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')).filter(m => !["00", "15", "30", "45"].includes(m))).sort().map(m => (
                                      <option key={m} value={m} className="bg-[#0a0a0a]">{m}</option>
                                    ))}
                                  </select>
                               </div>
                               <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                                  {["AM", "PM"].map(m => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const date = examData.schedule_end.split('T')[0] || new Date().toISOString().split('T')[0];
                                        const time12 = to12h(examData.schedule_end).time;
                                        const newTime24 = to24h(time12, m);
                                        setExamData({...examData, schedule_end: `${date}T${newTime24}`});
                                      }}
                                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${to12h(examData.schedule_end).meridian === m ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-6 text-center lg:text-left">
               <div className="glass-card p-8 border-indigo-500/20 bg-indigo-500/5">
                  <HelpCircle className="w-10 h-10 text-indigo-400 mb-4 mx-auto lg:mx-0" />
                  <h4 className="font-bold mb-2">Configuration Tip</h4>
                  <p className="text-sm text-gray-500 leading-relaxed italic">Ensure the closing window is at least equal to the opening window plus the duration for optimal student accessibility.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-4 p-2 bg-white/5 rounded-2xl w-fit mx-auto sticky top-4 z-50 backdrop-blur-md">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleSectorIngest} 
                 className="hidden" 
                 accept=".xlsx, .xls, .pdf" 
               />
               <button 
                 onClick={() => {
                   setActiveSectorIngest(null);
                   fileInputRef.current?.click();
                 }}
                 className="px-6 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
               >
                  <Rocket className="w-4 h-4" /> Global Ingest (Mixed)
               </button>
               <span className="text-[10px] text-gray-600 font-medium italic my-auto hidden lg:block"> AI Discovery Manifold Active </span>
               <button 
                 onClick={downloadTemplate}
                 className="text-[10px] font-black uppercase tracking-tighter text-gray-500 hover:text-indigo-400 transition-colors my-auto"
               >
                 Download Template
               </button>
               <div className="w-px h-6 bg-white/10 my-auto mx-2 hidden md:block" />
               <button onClick={() => addQuestion("mcq")} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> + MCQ
               </button>
               <button onClick={() => addQuestion("short")} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Type className="w-4 h-4 text-indigo-400" /> + Short
               </button>
               <button onClick={() => addQuestion("coding")} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Code className="w-4 h-4 text-amber-400" /> + Coding
               </button>
            </div>

            <div className="space-y-12">
              {["mcq", "short", "coding"].map((type) => {
                const sectorQuestions = questions.filter(q => q.type === type);
                const typeLabel = type === "mcq" ? "Multiple Choice Probes" : type === "short" ? "Descriptive Responses" : "Logic & Algorithm Dev";
                const TypeIcon = type === "mcq" ? CheckCircle2 : type === "short" ? Type : Code;
                const iconColor = type === "mcq" ? "text-emerald-400" : type === "short" ? "text-indigo-400" : "text-amber-400";

                return (
                  <div key={type} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                       <h3 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-3 ${iconColor}`}>
                          <TypeIcon className="w-6 h-6" /> {typeLabel}
                          <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-gray-400 border border-white/10 ml-2">
                             {sectorQuestions.length} Elements
                          </span>
                       </h3>
                       <div className="flex items-center gap-4">
                          <button 
                            onClick={() => addQuestion(type as any)}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                          >
                             <Plus className="w-3 h-3" /> Manual Add
                          </button>
                          <button 
                            onClick={() => {
                              setActiveSectorIngest(type);
                              fileInputRef.current?.click();
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-all flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                          >
                             <Rocket className="w-3 h-3" /> Import {type.toUpperCase()} (XLSX/PDF)
                          </button>
                       </div>
                    </div>

                    <div className="space-y-6">
                      {sectorQuestions.length === 0 ? (
                        <div className="py-12 text-center glass-card border-dashed border-white/5 bg-white/[0.01]">
                          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest italic">Sector Inactive. No {type.toUpperCase()} blueprints Manifested.</p>
                        </div>
                      ) : (
                        sectorQuestions.map((q, idx) => (
                          <div key={q.id} className="glass-card p-8 border-white/10 relative group hover:border-indigo-500/20 transition-all">
                            <button 
                              onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                              className="absolute top-8 right-8 text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                               <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-black">{idx + 1}</span>
                               <span className="text-[10px] font-black uppercase bg-white/5 px-2 py-1 rounded text-gray-500 tracking-widest italic">{q.type} manifest</span>
                            </div>

                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-500 uppercase italic">Question Text</label>
                                  <textarea 
                                    value={q.question_text}
                                    onChange={(e) => updateQuestion(q.id, "question_text", e.target.value)}
                                    placeholder="Enter the query payload description..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 h-24 transition-all font-medium text-white"
                                  />
                               </div>

                               {q.type === "mcq" && (
                                 <div className="space-y-4">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {q.options.map((opt: string, optIdx: number) => (
                                       <div key={optIdx} className="flex items-center gap-3 group/opt">
                                         <button 
                                           onClick={() => updateQuestion(q.id, "correct_answer", opt)}
                                           className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${q.correct_answer === opt && opt !== "" ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-white/10 hover:border-indigo-500/50'}`}
                                         >
                                            {q.correct_answer === opt && opt !== "" && <CheckCircle2 className="w-3 h-3 text-white" />}
                                         </button>
                                         <div className="flex-1 flex items-center gap-2">
                                           <input 
                                             type="text" 
                                             value={opt}
                                             onChange={(e) => {
                                               const newOpts = [...q.options];
                                               newOpts[optIdx] = e.target.value;
                                               updateQuestion(q.id, "options", newOpts);
                                             }}
                                             placeholder={`Choice ${String.fromCharCode(65 + optIdx)}`}
                                             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm" 
                                           />
                                           <button 
                                             onClick={() => {
                                               const newOpts = q.options.filter((_: any, i: number) => i !== optIdx);
                                               updateQuestion(q.id, "options", newOpts);
                                             }}
                                             className="opacity-0 group-hover/opt:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                   <button 
                                     onClick={() => updateQuestion(q.id, "options", [...q.options, ""])}
                                     className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mt-4"
                                   >
                                      <Plus className="w-3 h-3" /> Append Choice Vector
                                   </button>
                                 </div>
                               )}

                               {(q.type === "short" || q.type === "coding") && (
                                  <div className="space-y-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase italic">Reference Answer</label>
                                        <textarea 
                                          value={q.correct_answer}
                                          onChange={(e) => updateQuestion(q.id, "correct_answer", e.target.value)}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 h-20 transition-all font-mono text-xs"
                                          placeholder={q.type === "coding" ? "// Paste reference code here..." : "Enter expected keywords or solution..."}
                                        />
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase italic">Explantion Manifest (Knowledge Transfer)</label>
                                        <textarea 
                                          value={q.explanation}
                                          onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 h-16 transition-all text-xs text-gray-400 font-medium"
                                          placeholder="Explain the logic behind the correct manifestation..."
                                        />
                                     </div>
                                  </div>
                               )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
