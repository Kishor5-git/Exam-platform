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
  Download,
  BarChart2,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    exams: 0,
    students: 0,
    submissions: 0,
    active_exams: 0,
    pending_evaluations: 0,
    average: "0%",
    participationData: [],
    trends: [],
    passFail: { passed: 0, failed: 0 },
    recent_activity: {
      submissions: [],
      exams: [],
      students: []
    }
  });
  const [exams, setExams] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
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
        setStats(statsRes.data || stats);
        setAllExams(examsRes.data || []);
        setExams((examsRes.data || []).slice(0, 3));
        setSubmissions(subsRes.data || []);
      } catch (error) {
        // Silent recovery - data will show as 0 or empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExams = selectedDate 
    ? (allExams || []).filter((e: any) => new Date(e.schedule_start).getDate() === selectedDate)
    : (allExams || []).slice(0, 4);

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

  const barData = {
    labels: stats.participationData?.map((d: any) => d.title) || [],
    datasets: [{
      label: 'Participants',
      data: stats.participationData?.map((d: any) => d.participation) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: '#6366f1',
      borderWidth: 1
    }]
  };

  const lineData = {
    labels: stats.trends?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'Submissions',
      data: stats.trends?.map((d: any) => d.count) || [],
      borderColor: '#10b981',
      tension: 0.3,
      fill: true,
      backgroundColor: 'rgba(16, 185, 129, 0.1)'
    }]
  };

  const pieData = {
    labels: ['Pass', 'Fail'],
    datasets: [{
      data: [stats.passFail?.passed || 0, stats.passFail?.failed || 0],
      backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)'],
      borderColor: ['#10b981', '#ef4444'],
      borderWidth: 1
    }]
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {loading ? (
             [1,2,3,4,5].map(i => (
               <div key={i} className="glass-panel p-8 h-44 animate-pulse border-white/5 bg-white/5" />
             ))
          ) : (
            [
              { label: "Total Exams", value: stats.exams, icon: <BookOpen className="text-indigo-400" />, trend: "Sector Active", color: "from-indigo-500/10", path: "/admin/exams" },
              { label: "Total Students", value: stats.students, icon: <Users className="text-[#0ea5e9]" />, trend: "Global Index", color: "from-[#0ea5e9]/10", path: "/admin/students" },
              { label: "Submissions", value: stats.submissions, icon: <CheckCircle className="text-emerald-400" />, trend: "Total Metrics", color: "from-emerald-500/10", path: "/admin/analytics" },
              { label: "Active Exams", value: stats.active_exams, icon: <Activity className="text-amber-400" />, trend: "Live Sessions", color: "from-amber-500/10", path: "/admin/exams" },
              { label: "Pending Eval", value: stats.pending_evaluations, icon: <Clock className="text-rose-400" />, trend: "Action Required", color: "from-rose-500/10", path: "/admin/analytics" }
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative group h-full"
              >
                <Link 
                  href={s.path}
                  className={`block glass-panel p-6 relative overflow-hidden group h-full bg-gradient-to-br ${s.color} to-transparent border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{s.label}</h3>
                      <p className="text-2xl font-black tracking-tighter leading-none">{s.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pb-2 border-t border-white/5 pt-4">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{s.trend}</span>
                     <ChevronRight className="w-3 h-3 text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 border-white/5 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" /> Participation Metrics
                     </h3>
                     <div className="h-[240px]">
                        <Bar 
                          data={barData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', font: { size: 10 } } },
                              x: { grid: { display: false }, ticks: { color: '#666', font: { size: 10 } } }
                            }
                          }} 
                        />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Submission Trends
                     </h3>
                     <div className="h-[240px]">
                        <Line 
                           data={lineData} 
                           options={{
                             responsive: true,
                             maintainAspectRatio: false,
                             plugins: { legend: { display: false } },
                             scales: {
                               y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', font: { size: 10 } } },
                               x: { grid: { display: false }, ticks: { color: '#666', font: { size: 10 } } }
                             }
                           }}
                        />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                  <div className="space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                        <PieIcon className="w-4 h-4" /> Qualifiction Pipeline
                     </h3>
                     <div className="h-[240px] flex items-center justify-center">
                        <Pie 
                          data={pieData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'right', labels: { color: '#888', font: { size: 10, weight: 'bold' } } } }
                          }}
                        />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Top Performers (Global)
                     </h3>
                     <div className="space-y-4">
                        {(!stats.topPerformers || stats.topPerformers.length === 0) ? (
                           <p className="text-[10px] text-gray-600 uppercase font-bold italic">No data available</p>
                        ) : (
                          stats.topPerformers.slice(0, 3).map((p: any, i: number) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-amber-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-500">
                                      {p.name?.split(" ").map((n:any)=>n[0]).join("")}
                                   </div>
                                   <div>
                                      <span className="text-xs font-bold uppercase tracking-tight block">{p.name}</span>
                                      <span className="text-[8px] text-gray-500 font-bold uppercase">{p.exams_count} Missions</span>
                                   </div>
                                </div>
                                <span className="text-sm font-black text-emerald-400">{Math.round(p.avg_score)}%</span>
                             </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>

               {/* Exam Detailed Analytics */}
               <div className="pt-10 border-t border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Exam Performance Insights
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Exam Manifest</th>
                          <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Participation</th>
                          <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Avg Efficiency</th>
                          <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Pass Rate</th>
                          <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Hi / Lo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {stats.participationData?.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-[10px] text-gray-600 uppercase font-black">No assessment metrics found</td></tr>
                        ) : (
                          stats.participationData.map((d: any, i: number) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                              <td className="py-4 text-xs font-bold uppercase tracking-tight">{d.title}</td>
                              <td className="py-4 text-sm font-black text-indigo-400">{d.participation}</td>
                              <td className="py-4 text-sm font-black">{Math.round(d.avg_score || 0)}%</td>
                              <td className="py-4">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {Math.round(d.pass_percentage || 0)}%
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-xs font-black text-indigo-400">{d.highest_score || 0}%</span>
                                  <span className="text-gray-700">/</span>
                                  <span className="text-xs font-black text-rose-500">{d.lowest_score || 0}%</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

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

            <div className="glass-card p-8 border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                   <Activity className="w-5 h-5 text-indigo-400" /> Recent Activity
                </h2>
                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/20 animate-pulse">Live Feed</div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">New Submissions</h3>
                  <div className="space-y-3">
                    {(!stats.recent_activity?.submissions || stats.recent_activity.submissions.length === 0) ? (
                       <p className="text-[8px] text-gray-600 uppercase italic">No recent flow detected</p>
                    ) : (
                      stats.recent_activity.submissions.slice(0, 3).map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                           <div>
                              <p className="text-xs font-bold uppercase">{s.student_name}</p>
                              <p className="text-[8px] text-indigo-400 font-bold uppercase">{s.exam_title}</p>
                           </div>
                           <span className="text-xs font-black text-emerald-400">{s.score}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Latest Registrations</h3>
                  <div className="space-y-3">
                    {(!stats.recent_activity?.students || stats.recent_activity.students.length === 0) ? (
                       <p className="text-[8px] text-gray-600 uppercase italic">No new entries</p>
                    ) : (
                      stats.recent_activity.students.slice(0, 3).map((u: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-[10px]">
                           <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400 uppercase">
                              {u.name[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold uppercase truncate">{u.name}</p>
                              <p className="text-gray-500 truncate text-[8px]">{u.email}</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Recent Exams Published</h3>
                  <div className="space-y-3">
                    {(!stats.recent_activity?.exams || stats.recent_activity.exams.length === 0) ? (
                       <p className="text-[8px] text-gray-600 uppercase italic">No recent deployments</p>
                    ) : (
                      stats.recent_activity.exams.slice(0, 2).map((e: any, i: number) => (
                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-xs font-bold uppercase line-clamp-1">{e.title}</p>
                           <p className="text-[8px] text-gray-500 font-bold uppercase">{new Date(e.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
