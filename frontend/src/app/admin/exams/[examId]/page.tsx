"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  BookOpen,
  Send,
  Calendar,
  Clock,
  Layout,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Code2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import { useRef } from "react";

export default function ExamDetails() {
  const { examId } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState({
    type: "MCQ",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    marks: 10,
    coding_language: "javascript"
  });

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`exams/${examId}`);
      setExam(data);
    } catch (error) {
      toast.error("Failed to fetch blueprint details");
      router.push("/admin/exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [examId]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Adding probe...");
    try {
      await api.post(`exams/${examId}/questions`, newQuestion);
      toast.success("Probe integrated!", { id: toastId });
      setShowManual(false);
      setNewQuestion({
        type: "MCQ",
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 10,
        coding_language: "javascript"
      });
      fetchDetails();
    } catch (error) {
      toast.error("Integration failed", { id: toastId });
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadLoading(true);
    const toastId = toast.loading("Streaming bulk data...");

    try {
      await api.post(`exams/${examId}/upload-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Bulk integration complete!", { id: toastId });
      fetchDetails();
    } catch (error: any) {
      toast.error("Bulk sync failed", { id: toastId });
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to decommission this blueprint?")) return;
    try {
      await api.delete(`exams/${examId}`);
      toast.success("Blueprint decommissioned");
      router.push("/admin/exams");
    } catch (error) {
       toast.error("Decommissioning failed");
    }
  };

  const handlePublish = async () => {
    try {
      await api.patch(`exams/${examId}/publish`);
      toast.success("Blueprint published to frontiers!");
      setExam({...exam, status: 'published'});
    } catch (error) {
      toast.error("Publication failed");
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse font-black uppercase tracking-widest">Decoding Blueprint...</div>;

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        <div className="flex items-center justify-between">
          <Link href="/admin/exams" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:underline group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Fleet
          </Link>
          <button onClick={handleDelete} className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all">
             <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-10">
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Layout className="w-48 h-48" />
               </div>
               <div className="relative z-10">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${
                    exam.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {exam.status} Blueprint
                  </span>
                  <h1 className="text-5xl font-black mb-6 italic tracking-tighter uppercase">{exam.title}</h1>
                  <div className="flex flex-wrap gap-8 text-sm font-bold text-gray-500">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" /> {new Date(exam.schedule_start).toLocaleString()}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> {exam.duration}m Duration</span>
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> {exam.questions?.length || 0} Questions</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Question Palette</h2>
                  <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleExcelUpload} className="hidden" accept=".xlsx, .xls" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all font-bold text-xs flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> {uploadLoading ? "Syncing..." : "Excel Import"}
                    </button>
                    <button 
                      onClick={() => setShowManual(!showManual)}
                      className="btn-primary py-2 px-6 flex items-center gap-2 text-xs"
                    >
                       <Plus className="w-4 h-4" /> {showManual ? "Cancel" : "Add Manual"}
                    </button>
                  </div>
               </div>

               {showManual && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   className="glass-panel p-8 border-indigo-500/30 overflow-hidden"
                 >
                   <form onSubmit={handleManualAdd} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Type</label>
                           <select 
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500/30"
                             value={newQuestion.type}
                             onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                           >
                             <option value="MCQ">MCQ (Multiple Choice)</option>
                             <option value="SHORT_ANSWER">Short Answer</option>
                             <option value="CODING">Coding Sandbox</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Marks</label>
                           <input 
                             type="number" 
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500/30"
                             value={newQuestion.marks || ""}
                             onChange={(e) => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 0})}
                           />
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Question Statement</label>
                         <textarea 
                           required
                           className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:ring-1 focus:ring-indigo-500/30"
                           value={newQuestion.question_text}
                           onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                         />
                      </div>

                      {newQuestion.type === "MCQ" && (
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Options & Correct Selection</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {newQuestion.options.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                   <input 
                                     type="text" 
                                     required
                                     placeholder={`Option ${i+1}`}
                                     className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500/30"
                                     value={opt}
                                     onChange={(e) => {
                                       const copy = [...newQuestion.options];
                                       copy[i] = e.target.value;
                                       setNewQuestion({...newQuestion, options: copy});
                                     }}
                                   />
                                   <button 
                                     type="button"
                                     onClick={() => setNewQuestion({...newQuestion, correct_answer: opt})}
                                     className={`p-3 rounded-xl border transition-all ${newQuestion.correct_answer === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-700'}`}
                                   >
                                      <CheckCircle className="w-5 h-5" />
                                   </button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs">Integrate Probe</button>
                   </form>
                 </motion.div>
               )}
               
               <div className="space-y-4">
                  {exam.questions?.length === 0 ? (
                    <div className="p-20 text-center glass-panel border-dashed border-white/10">
                       <p className="text-gray-600 font-black uppercase text-xs tracking-[0.3em]">No probes detected in this sector.</p>
                    </div>
                  ) : (
                    exam.questions?.map((q: any, i: number) => {
                      const optionsArr = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                      return (
                        <div key={q.id} className="glass-panel p-8 border-white/5 space-y-6 group">
                           <div className="flex items-start justify-between">
                              <div className="flex items-center gap-6">
                                 <span className="text-3xl font-black text-white/5 group-hover:text-indigo-500/40 transition-colors">#{i+1}</span>
                                 <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    {q.type === 'MCQ' ? <HelpCircle className="w-4 h-4 text-indigo-400" /> : q.type === 'CODING' ? <Code2 className="w-4 h-4 text-purple-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-lg italic tracking-tight uppercase">{q.question_text}</h4>
                                    <div className="flex gap-4 mt-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{q.type}</span>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{q.marks} Marks</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </div>

                           {q.type === 'MCQ' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-20">
                               {optionsArr.map((opt: string, optIdx: number) => (
                                 <div 
                                   key={optIdx} 
                                   className={`p-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-between ${
                                     q.correct_answer === opt 
                                     ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                     : 'bg-white/5 border-white/5 text-gray-500'
                                   }`}
                                 >
                                    <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                    {q.correct_answer === opt && <CheckCircle className="w-4 h-4" />}
                                 </div>
                               ))}
                             </div>
                           )}

                           {(q.type === 'SHORT_ANSWER' || q.type === 'CODING') && (
                             <div className="pl-20 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Answer</label>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-indigo-300">
                                   {q.correct_answer}
                                </div>
                             </div>
                           )}

                           {q.explanation && (
                             <div className="pl-20 border-t border-white/5 pt-4">
                                <p className="text-[10px] text-gray-500 italic"><span className="font-black normal-case">Explanation:</span> {q.explanation}</p>
                             </div>
                           )}
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 space-y-6">
             <div className="glass-panel p-8 border-white/5 space-y-8">
                <h3 className="font-black uppercase tracking-widest text-xs text-indigo-400">Mission Control</h3>
                 <div className="space-y-6">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed italic">Confirm all payload question vectors are initialized before synchronizing with the production frontier.</p>
                 </div>
                {exam.status === 'draft' && (
                  <button 
                    onClick={handlePublish}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-tighter"
                  >
                    Go Live <Send className="w-4 h-4" />
                  </button>
                )}
             </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
