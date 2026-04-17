"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Users, Search, Filter, ShieldCheck, X, Mail, Calendar, User as UserIcon, CheckCircle, Clock, TrendingUp, FileSpreadsheet, RotateCcw, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentsManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  const handleViewSheet = async (attemptId: string) => {
    setSheetLoading(true);
    try {
      const { data } = await api.get(`results/attempt/${attemptId}`);
      setSheetData(data);
      setSelectedAttempt({ id: attemptId });
    } catch (error) {
       toast.error("Failed to load response sheet");
    } finally {
      setSheetLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get("users/students");
        setStudents(data);
      } catch (error) {
        // Silent recovery - student list will remain empty
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSort = (type: string) => {
    setSortBy(type);
    const sorted = [...students];
    if (type === "newest") sorted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (type === "oldest") sorted.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (type === "name") sorted.sort((a: any, b: any) => a.name.localeCompare(b.name));
    setStudents(sorted);
    setShowFilter(false);
    toast.success(`Sorted by ${type.replace("-", " ")}`);
  };

  const handleResetAttempt = async (examId: string) => {
    if (!selectedStudent) return;
    const toastId = toast.loading("Resetting attempt parameters...");
    try {
      await api.delete(`results/user/${selectedStudent.id}/exam/${examId}`);
      toast.success("Attempt purged. Retake protocol authorized.", { id: toastId });
      // Refresh results
      const { data } = await api.get(`results/user/${selectedStudent.id}`);
      setUserResults(data);
    } catch (error) {
      toast.error("Retake authorization failed.", { id: toastId });
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Joined Date"];
    const rows = students.map((s: any) => [s.id, s.name, s.email, s.created_at]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_directory_export.csv");
    document.body.appendChild(link);
    link.click();
    toast.success("CSV Export Dispatched!");
  };

  const handleOpenProfile = async (student: any) => {
    setSelectedStudent(student);
    setResultsLoading(true);
    try {
      const { data } = await api.get(`results/user/${student.id}`);
      setUserResults(data);
    } catch (error) {
      toast.error("Failed to load performance data");
    } finally {
      setResultsLoading(false);
    }
  };

  const handleVerify = (name: string) => {
    toast.success(`Security protocol completed. Profile for ${name} has been verified and whitelisted.`);
  };

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Student <span className="gradient-text">Directory</span></h1>
          <p className="text-gray-400">Manage student access and track global participation.</p>
        </div>

        <div className="flex gap-4">
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 glass-card px-4 py-3 flex items-center gap-3 border-white/5 focus-within:border-indigo-500/30 transition-all">
            <Search className="w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by name, ID or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full py-1 text-sm" 
            />
          </form>
          <div className="flex gap-4">
             <button 
              onClick={exportToCSV}
              className="glass-card px-6 py-3 border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm font-bold hover:bg-emerald-500/5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
            <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`glass-card px-6 py-3 border-white/5 flex items-center gap-2 text-sm font-bold transition-all ${showFilter ? "bg-white/10 border-indigo-500/30" : "hover:bg-white/5"}`}
            >
              <Filter className="w-4 h-4" /> Filter
            </button>

            <AnimatePresence>
              {showFilter && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-48 glass-card border-white/10 shadow-2xl z-50 p-2 bg-[#0a0a0a]/90 backdrop-blur-xl"
                >
                  <div className="p-2 mb-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Sort Protocol</p>
                  </div>
                  {[
                    { id: "newest", label: "Newest Joined" },
                    { id: "oldest", label: "Oldest Joined" },
                    { id: "name", label: "Name (A-Z)" }
                  ].map(option => (
                    <button 
                      key={option.id}
                      onClick={() => handleSort(option.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === option.id ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-gray-400"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b border-white/5">
                <th className="px-8 py-4">Student</th>
                <th className="px-8 py-4">Identity</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Joined Date</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse italic text-xs">Synchronizing Student Data...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest italic text-xs">No active students found in the grid.</td>
                </tr>
              ) : (
                filteredStudents.map((s: any) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpenProfile(s)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono tracking-tighter">ID: {s.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-400">{s.email}</td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-black bg-white/5 px-2 py-1 rounded text-indigo-400 border border-white/5">{s.exams_taken}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-2 py-1 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        active
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-bold tracking-tight">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenProfile(s)}
                        className="text-xs font-black text-indigo-400 hover:underline uppercase tracking-widest transition-all hover:text-indigo-300"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden border-white/10 shadow-2xl bg-[#0a0a0a]"
            >
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
                 <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all text-white">
                    <X className="w-5 h-5" />
                 </button>
                 <div className="absolute -bottom-10 left-8">
                    <div className="w-24 h-24 rounded-2xl bg-[#0a0a0a] border-4 border-[#0a0a0a] shadow-xl flex items-center justify-center">
                       <div className="w-full h-full rounded-xl bg-indigo-500/20 flex items-center justify-center text-3xl font-black text-indigo-400">
                          {selectedStudent.name[0]}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-14 px-8 pb-8 space-y-8">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{selectedStudent.name}</h2>
                    <p className="text-gray-500 text-xs font-bold font-mono">PILOT-ID: {selectedStudent.id}</p>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Digital Identity
                       </p>
                       <p className="text-sm font-bold text-gray-300">{selectedStudent.email}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Commission Date
                       </p>
                       <p className="text-sm font-bold text-gray-300">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Rank Status
                       </p>
                       <p className="text-sm font-black text-emerald-400 uppercase italic">Certified Student</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-indigo-400" /> Performance History
                    </h3>
                    <div className="space-y-2">
                       {resultsLoading ? (
                          <div className="py-6 text-center text-xs text-gray-600 animate-pulse font-bold uppercase tracking-widest">Scanning academic memory...</div>
                       ) : userResults.length === 0 ? (
                          <div className="py-6 text-center text-[10px] text-gray-700 uppercase font-black italic">No campaign results found.</div>
                       ) : (
                          userResults.map((res: any, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/res">
                                <div className="flex items-center gap-4">
                                   <div>
                                      <p className="text-sm font-bold">{res.exam_title}</p>
                                      <p className="text-[10px] text-gray-500 uppercase">{new Date(res.end_time).toLocaleString()}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-6">
                                   <div className="text-right">
                                      <p className="text-lg font-black text-indigo-400 italic">{res.score}%</p>
                                      <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Completion Success</p>
                                   </div>
                                   <div className="flex items-center gap-2 opacity-0 group-hover/res:opacity-100 transition-all">
                                      <button 
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewSheet(res.id);
                                         }}
                                         title="View Answer Sheet"
                                         className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-all"
                                      >
                                         <Eye className="w-4 h-4" />
                                      </button>
                                      <button 
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetAttempt(res.exam_id);
                                         }}
                                         title="Grant Retake"
                                         className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"
                                      >
                                         <RotateCcw className="w-4 h-4" />
                                      </button>
                                   </div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 <div className="flex justify-end pt-4">
                    <button onClick={() => setSelectedStudent(null)} className="btn-secondary px-8 py-2 text-sm font-bold">Dismiss Link</button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       <AnimatePresence>
         {selectedAttempt && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
               <motion.div 
                  initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                  className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden border-white/10 shadow-3xl bg-[#050505] flex flex-col"
               >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Full <span className="gradient-text">Answer Sheet</span></h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Deployment Unit: {selectedAttempt.id}</p>
                     </div>
                     <button onClick={() => setSelectedAttempt(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                     {sheetData.map((item, i) => (
                        <div key={i} className="space-y-4">
                           <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400 shrink-0 border border-indigo-500/20">
                                 {i + 1}
                              </div>
                              <div className="space-y-4 flex-1">
                                 <h4 className="font-bold text-lg leading-snug">{item.question_text}</h4>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Student Response</p>
                                       <p className={`font-bold ${item.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {item.student_answer || "NO RESPONSE DETECTED"}
                                       </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Reference Key</p>
                                       <p className="font-bold text-indigo-300">{item.reference_answer}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase ${item.is_correct ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                       {item.is_correct ? 'Verified Correct' : 'Incorrect Logic'}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Marks Allocated: <span className="text-white font-bold">{item.is_correct ? item.total_marks : 0}/{item.total_marks}</span></span>
                                 </div>
                              </div>
                           </div>
                           {i < sheetData.length - 1 && <div className="h-px bg-white/5" />}
                        </div>
                     ))}
                  </div>

                  <div className="p-6 border-t border-white/5 flex justify-end shrink-0">
                     <button onClick={() => setSelectedAttempt(null)} className="btn-primary px-10 py-2 font-bold text-sm">Close Protocol</button>
                  </div>
               </motion.div>
            </div>
         )}
       </AnimatePresence>
    </DashboardLayout>
  );
}
