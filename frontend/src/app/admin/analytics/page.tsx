"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, PieChart, Info, AlertTriangle, FileSpreadsheet, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState("Week");
  const [allResults, setAllResults] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get("results/all");
        setAllResults(data);
      } catch (error) {
        // Silent recovery - distribution defaults to 0
      } finally {
        setStatsLoading(false);
      }
    };
    fetchResults();
  }, []);

  const distribution = {
    excellent: allResults.length ? Math.round((allResults.filter((r: any) => r.score >= 90).length / allResults.length) * 100) : 0,
    great: allResults.length ? Math.round((allResults.filter((r: any) => r.score >= 70 && r.score < 90).length / allResults.length) * 100) : 0,
    passing: allResults.length ? Math.round((allResults.filter((r: any) => r.score >= 50 && r.score < 70).length / allResults.length) * 100) : 0,
    avg: allResults.length ? Math.round(allResults.reduce((acc: number, curr: any) => acc + curr.score, 0) / allResults.length) : 0
  };

  const getProcessedStudentData = () => {
    if (allResults.length === 0) return [];
    const studentData: Record<string, { name: string, total: number, count: number }> = {};
    allResults.forEach((r: any) => {
      if (!studentData[r.user_id]) studentData[r.user_id] = { name: r.name, total: 0, count: 0 };
      studentData[r.user_id].total += r.score;
      studentData[r.user_id].count += 1;
    });

    return Object.values(studentData)
      .map(s => ({ name: s.name.split(" ")[0], avg: Math.round(s.total / s.count) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10); // Optimal density for vertical manifest
  };

  const getChartData = () => {
    const data = getProcessedStudentData();
    if (data.length === 0) return Array(7).fill(0);
    return data.map(s => s.avg);
  };

  const getChartLabels = () => {
    const data = getProcessedStudentData();
    if (data.length === 0) return ["S-1", "S-2", "S-3", "S-4", "S-5", "S-6", "S-7"];
    return data.map(s => s.name);
  };

  const exportPDF = async () => {
    setExportLoading(true);
    const toastId = toast.loading("Synthesizing PDF documentation...");
    try {
      const { data: results } = await api.get("results/all");
      const doc = new jsPDF() as any;
      doc.text("Academic Analytics: Submission Protocol", 20, 10);
      doc.autoTable({
        head: [['Student', 'Assessment', 'Score (%)', 'Timestamp']],
        body: results.map((r: any) => [r.name, r.exam_title, r.score, new Date(r.end_time).toLocaleString()]),
      });
      doc.save("mission_report_alpha.pdf");
      toast.success("PDF Signal Dispatched!", { id: toastId });
    } catch (error) {
       toast.error("PDF synthesis failure.", { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  const exportExcel = async () => {
    setExportLoading(true);
    const toastId = toast.loading("Generating Excel data manifest...");
    try {
      const { data: results } = await api.get("results/all");
      const ws = XLSX.utils.json_to_sheet(results);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Submissions");
      XLSX.writeFile(wb, "academic_data_export.xlsx");
      toast.success("Excel Matrix Exported!", { id: toastId });
    } catch (error) {
       toast.error("Excel generation failure.", { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Advanced <span className="gradient-text">Analytics</span></h1>
            <p className="text-gray-400">Deep dive into assessment data and student performance trends.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={exportExcel} className="btn-secondary py-2 px-6 text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
             </button>
             <button onClick={exportPDF} className="btn-primary py-2 px-8 text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                Synthesize PDF
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-8 border-white/5 space-y-10">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 tracking-tight uppercase">
                  <TrendingUp className="w-5 h-5 text-indigo-400" /> Academic Mastery Trends
                </h3>
                <div className="flex gap-2">
                  {['Day', 'Week', 'Month'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => {
                        setTimeRange(t);
                        setSelectedBar(null);
                      }}
                      className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest transition-all ${t === timeRange ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-2 pt-10 px-4">
                {getChartData().map((h, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedBar(i === selectedBar ? null : i)}
                    className="flex-1 group relative cursor-pointer"
                  >
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-indigo-500 text-white text-[8px] font-bold rounded transition-opacity whitespace-nowrap ${selectedBar === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {h}% Avg Mastery
                    </div>
                    <div 
                      className={`w-full transition-all rounded-t-lg origin-bottom shadow-[0_0_15px_rgba(99,102,241,0.2)] 
                        ${selectedBar === i ? 'bg-indigo-400 scale-y-110' : 'bg-gradient-to-t from-indigo-500/40 to-indigo-500 group-hover:scale-y-105'}
                      `} 
                      style={{ height: `${h}%` }}
                    />
                    <div className={`mt-3 text-[10px] font-black uppercase text-center tracking-tighter transition-colors ${selectedBar === i ? 'text-indigo-400' : 'text-gray-600'}`}>
                      {getChartLabels()[i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Student Performance Graph */}
            <div className="pt-10 border-t border-white/5 space-y-6">
              <h3 className="font-bold flex items-center gap-2 tracking-tight uppercase">
                <Users className="w-5 h-5 text-indigo-400" /> Individual Performance Manifest
              </h3>
              <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar space-y-6">
                 {(() => {
                    const studentData: Record<string, { name: string, total: number, count: number }> = {};
                    allResults.forEach((r: any) => {
                       if (!studentData[r.user_id]) studentData[r.user_id] = { name: r.name, total: 0, count: 0 };
                       studentData[r.user_id].total += r.score;
                       studentData[r.user_id].count += 1;
                    });
                    return Object.values(studentData)
                       .sort((a, b) => (b.total/b.count) - (a.total/a.count))
                       .map((s, i) => {
                          const avg = Math.round(s.total / s.count);
                          return (
                             <div key={i} className="space-y-2 group">
                                <div className="flex justify-between items-center px-1">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-400 transition-colors">{s.name}</span>
                                   <span className="text-[10px] font-black text-indigo-300">{avg}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${avg}%` }}
                                      className={`h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] ${avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-indigo-500' : avg >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                   />
                                </div>
                             </div>
                          );
                       });
                 })()}
                 {allResults.length === 0 && <p className="text-[10px] text-gray-600 italic uppercase font-black text-center py-10 italic">No individual data manifested yet.</p>}
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-white/5 space-y-6">
            <h3 className="font-bold flex items-center gap-2 tracking-tight uppercase">
              <PieChart className="w-5 h-5 text-indigo-400" /> Score Distribution
            </h3>
            <div className="flex flex-col items-center justify-center h-48 relative group">
               {allResults.length === 0 ? (
                  <div className="text-center">
                     <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mb-4 mx-auto">
                        <TrendingUp className="w-8 h-8 text-gray-700" />
                     </div>
                     <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic">Awaiting Field Data</p>
                  </div>
               ) : (
                  <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500/10 relative transition-transform group-hover:scale-110 duration-500">
                     <div 
                        className="absolute inset-0 rounded-full border-[12px] border-emerald-500 border-l-transparent border-b-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                        style={{ transform: `rotate(${45 + (distribution.avg * 3.6)}deg)` }}
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black italic group-hover:text-emerald-400 transition-colors">{distribution.avg}%</span>
                     </div>
                  </div>
               )}
            </div>
            <div className="space-y-3 pt-6 border-t border-white/5">
               <div className="flex items-center justify-between text-xs font-bold p-2 hover:bg-emerald-500/5 rounded-lg transition-all cursor-crosshair">
                  <span className="text-emerald-400">Excellent (90+)</span>
                  <span>{distribution.excellent}%</span>
               </div>
               <div className="flex items-center justify-between text-xs font-bold p-2 hover:bg-indigo-500/5 rounded-lg transition-all cursor-crosshair">
                  <span className="text-indigo-400">Great (70-90)</span>
                  <span>{distribution.great}%</span>
               </div>
               <div className="flex items-center justify-between text-xs font-bold text-gray-500 p-2 hover:bg-white/5 rounded-lg transition-all cursor-crosshair">
                  <span className="">Passing (50-70)</span>
                  <span>{distribution.passing}%</span>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <div className="glass-card p-8 border-white/5">
              <h3 className="font-bold flex items-center gap-2 tracking-tight uppercase mb-6">
                 <Trophy className="w-5 h-5 text-amber-500" /> Elite Cohort
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {(() => {
                    const studentStats: Record<string, { name: string, total: number, count: number }> = {};
                    allResults.forEach((r: any) => {
                       if (!studentStats[r.user_id]) studentStats[r.user_id] = { name: r.name, total: 0, count: 0 };
                       studentStats[r.user_id].total += r.score;
                       studentStats[r.user_id].count += 1;
                    });
                    return Object.values(studentStats)
                       .map(s => ({ name: s.name, avg: Math.round(s.total / s.count) }))
                       .sort((a, b) => b.avg - a.avg)
                       .slice(0, 6) // Show top 6 in a 3-column grid
                       .map((item, i) => (
                          <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/20">
                                   0{i+1}
                                </div>
                                <p className="text-xs font-bold">{item.name}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{item.avg}% Mastery</p>
                                <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                   <div className="h-full bg-emerald-500" style={{ width: `${item.avg}%` }} />
                                </div>
                             </div>
                          </div>
                       ));
                 })()}
              </div>
              {allResults.length === 0 && <p className="text-[10px] text-gray-600 italic uppercase font-black text-center py-10">Awaiting Cohort Performance Data...</p>}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
