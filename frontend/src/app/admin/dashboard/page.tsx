"use client";

import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  Clock,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Download
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    exams: 0,
    students: 0,
    submissions: 0,
    average: "0%"
  });
  const [exams, setExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, examsRes, subsRes] = await Promise.all([
          api.get("stats/admin"),
          api.get("exams"),
          api.get("results/all")
        ]);
        setStats(statsRes.data);
        setAllExams(examsRes.data);
        setExams(examsRes.data.slice(0, 3));
        setSubmissions(subsRes.data);
      } catch (error) {
        // Silent recovery - data will show as 0 or empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExams = selectedDate 
    ? allExams.filter((e: any) => new Date(e.schedule_start).getDate() === selectedDate)
    : allExams.slice(0, 4);

  const downloadTemplate = () => {
    const template = [
      ["question_text", "type", "options", "correct_answer", "marks", "explanation"],
      ["What is React?", "mcq", JSON.stringify(["Library", "Framework", "Language", "Database"]), "Library", 1, "React is a UI library"],
      ["Explain Closure", "short", "", "Function bundled with its lexical environment", 2, ""],
      ["Write a sum function", "coding", "", "function sum(a,b) { return a+b; }", 5, "Basic addition"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "exam_template.xlsx");
    toast.success("Template downloaded!");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const toastId = toast.loading("Parsing administrative payload...");

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);

          if (data.length === 0) throw new Error("Manifest index is empty.");

          // Find first exam for bulk import demo
          const { data: exams } = await api.get("exams");
          if (exams.length === 0) throw new Error("Establish an assessment first.");
          const examId = exams[0].id;

          await api.post(`exams/${examId}/questions/bulk`, { questions: data });
          
          toast.success(`Injected ${data.length} records into sequence.`, { id: toastId });
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
          toast.error(err.message || "Fragmented data detected.", { id: toastId });
        } finally {
          setUploadLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error("Link failure during uplink.", { id: toastId });
      setUploadLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Mission <span className="gradient-text">Control</span></h1>
            <p className="text-gray-500 font-medium">Monitoring the pulse of your academic excellence.</p>
          </div>
          <div className="flex gap-4">
             <Link href="/admin/analytics" className="btn-secondary py-2 px-6 flex items-center gap-2 text-sm italic">
               <TrendingUp className="w-4 h-4" /> Live Analytics
             </Link>
             <Link href="/admin/exams/create" className="btn-primary py-2 px-6 flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)]">
               <Plus className="w-4 h-4" /> New Exam
             </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             [1,2,3,4].map(i => (
               <div key={i} className="glass-panel p-8 h-44 animate-pulse border-white/5 bg-white/5" />
             ))
          ) : (
            [
              { label: "Active Exams", value: stats.exams, icon: <BookOpen className="text-indigo-400" />, trend: "+2 this week", color: "from-indigo-500/10", path: "/admin/exams" },
              { label: "Global Students", value: stats.students, icon: <Users className="text-[#0ea5e9]" />, trend: "+12% vs last month", color: "from-[#0ea5e9]/10", path: "/admin/students" },
              { label: "Submissions", value: stats.submissions, icon: <CheckCircle className="text-emerald-400" />, trend: "+45 today", color: "from-emerald-500/10", path: "/admin/analytics" },
              { label: "Avg. Performance", value: stats.average, icon: <TrendingUp className="text-amber-400" />, trend: "Steady", color: "from-amber-500/10", path: "/admin/analytics" }
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group h-full"
              >
                <Link 
                  href={s.path}
                  className={`block glass-panel p-8 relative overflow-hidden group h-full bg-gradient-to-br ${s.color} to-transparent border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                      {s.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{s.trend}</div>
                      <div className="h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-2/3" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">{s.label}</h3>
                  <p className="text-4xl font-black mt-2 tracking-tighter">{s.value}</p>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar & Upcoming Exams */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Assessment Schedule
                </h2>
                 <div className="flex gap-2">
                    <button onClick={() => setSelectedDate(null)} className={`p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest ${!selectedDate ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Upcoming</button>
                    <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-gray-400 italic">Historical</button>
                 </div>
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Custom Calendar Logic */}
                 <div className="space-y-4">
                   <div className="grid grid-cols-7 gap-1">
                     {['S','M','T','W','T','F','S'].map((d, i) => (
                       <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-gray-600 pb-2">{d}</div>
                     ))}
                     {Array.from({ length: 31 }).map((_, i) => {
                       const day = i + 1;
                       const hasExam = allExams.some((e: any) => new Date(e.schedule_start).getDate() === day);
                       const isSelected = selectedDate === day;
                       const isToday = day === new Date().getDate();

                       return (
                         <div 
                           key={i} 
                           onClick={() => setSelectedDate(day)}
                           className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all relative cursor-pointer
                             ${isSelected ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 scale-110" : isToday ? "border border-indigo-500/50 text-indigo-400" : "hover:bg-white/5 text-gray-400"}
                           `}
                         >
                           {day}
                           {hasExam && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />}
                         </div>
                       )
                     })}
                   </div>
                   <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Intelligence Insight</p>
                      <p className="text-xs text-gray-500 leading-relaxed italic">
                        {selectedDate 
                          ? `Protocol check for Apr ${selectedDate}: ${filteredExams.length} active deployments detected.` 
                          : "Maximum assessment density predicted for Apr 18-20. Ensure server capacity is whitelisted."
                        }
                      </p>
                   </div>
                 </div>
 
                 <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">
                      {selectedDate ? `Deployments for April ${selectedDate}` : "Active Deployment Sequence"}
                   </p>
                   {filteredExams.length === 0 ? (
                     <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                       <p className="text-xs text-gray-500 uppercase font-black tracking-widest">No deployments on this vector</p>
                     </div>
                   ) : (
                     filteredExams.map((exam: any, i) => (
                       <Link href={`/admin/exams/${exam.id}`} key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group hover:bg-indigo-500/5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex flex-col items-center justify-center border border-indigo-500/20 group-hover:border-indigo-500/40">
                             <span className="text-[10px] font-bold text-indigo-400 uppercase leading-none">
                               {new Date(exam.schedule_start).toLocaleString('default', { month: 'short' })}
                             </span>
                             <span className="text-sm font-black mt-0.5">
                               {new Date(exam.schedule_start).getDate()}
                             </span>
                           </div>
                           <div>
                             <h4 className="text-sm font-bold group-hover:text-indigo-400 transition-colors line-clamp-1">{exam.title}</h4>
                             <div className="flex items-center gap-3 mt-0.5">
                               <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                                 <Clock className="w-2.5 h-2.5" /> {new Date(exam.schedule_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           </div>
                         </div>
                       </Link>
                     ))
                   )}
                   <Link href="/admin/exams" className="block text-center text-[10px] font-black uppercase text-indigo-400 hover:underline tracking-widest pt-2">Initialize Complete Sequence Index</Link>
                 </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="glass-card p-8 border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <h2 className="text-xl font-bold mb-4">Quick Start</h2>
              <p className="text-sm text-gray-400 mb-6">Ready to create a new assessment? Start from scratch or use a template.</p>
              <div className="space-y-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleExcelUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                 <button 
                  onClick={downloadTemplate}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/10 py-3 rounded-xl hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
                >
                   <Download className="w-3 h-3" /> Download Template
                </button>
                <Link href="/admin/exams/create" className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                   <Plus className="w-4 h-4" /> Create Exam
                </Link>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                >
                   <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> {uploadLoading ? "Inlining..." : "Import Questions"}
                </button>
              </div>
            </div>

            <div className="glass-card p-8 border-white/5">
              <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest italic">No activity recorded</p>
                  </div>
                ) : (
                  submissions.map((s: any, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 p-1 border border-white/10">
                        <img src={`https://ui-avatars.com/api/?name=${s.name}`} className="rounded-full" alt="avatar" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-500 truncate uppercase tracking-tight">{s.exam_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-indigo-400">{s.score}%</p>
                        <p className="text-[8px] text-gray-600 uppercase">
                          {new Date(s.end_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
