"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Trophy, 
  ChevronRight, 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import confetti from "canvas-confetti";

export default function ResultsHistory() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, leaderboardRes] = await Promise.all([
          api.get("results/my-results"),
          api.get("stats/leaderboard")
        ]);
        setResults(resultsRes.data);
        setLeaderboard(leaderboardRes.data);
        
        // Trigger celebration if latest mission was successful
        if (resultsRes.data.length > 0) {
          const latest = resultsRes.data[0];
          if (latest.score >= 40) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#8b5cf6', '#d946ef', '#0ea5e9']
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch results manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">Performance History</h1>
            <p className="text-gray-400">Track your progress and review past examinations.</p>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <BarChart className="w-4 h-4" /> Comprehensive Analytics
          </button>
        </div>

        {/* Highlight Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-amber-500/10 rounded-xl"><Trophy className="w-6 h-6 text-amber-500" /></div>
               <span className="text-gray-400 font-medium">Global Rank</span>
             </div>
             <p className="text-4xl font-black text-amber-400">#124</p>
             <p className="text-xs text-amber-500/60 mt-2 font-bold uppercase tracking-widest">Top 5% of all students</p>
          </div>
          <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-emerald-500/10 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
               <span className="text-gray-400 font-medium">Passing Rate</span>
             </div>
             <p className="text-4xl font-black text-emerald-400">92%</p>
             <p className="text-xs text-emerald-500/60 mt-2 font-bold uppercase tracking-widest">+4% vs last term</p>
          </div>
          <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-indigo-500/10 rounded-xl"><FileText className="w-6 h-6 text-indigo-500" /></div>
               <span className="text-gray-400 font-medium">Total Credits</span>
             </div>
             <p className="text-4xl font-black text-indigo-400">2,450</p>
             <p className="text-xs text-indigo-500/60 mt-2 font-bold uppercase tracking-widest">Mastery Level 4</p>
          </div>
        </div>

        {/* Results List */}
        <div className="glass-card border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h2 className="text-xl font-bold">Recent Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-[10px] uppercase font-black tracking-widest bg-white/[0.02]">
                  <th className="p-6">Examination Protocol</th>
                  <th className="p-6">Timeline</th>
                  <th className="p-6">Precision</th>
                  <th className="p-6">Authority</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Zero manifestations discovered in the archives.</p>
                    </td>
                  </tr>
                ) : (
                  results.map((r: any, i) => {
                    const isPass = Number(r.score) >= 40;
                    return (
                      <motion.tr 
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => router.push(`/student/exams/${r.exam_id}/review/${r.id}`)}
                      >
                        <td className="p-6">
                           <span className="font-black uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{r.title}</span>
                        </td>
                        <td className="p-6 text-sm text-gray-400 font-bold">{new Date(r.end_time).toLocaleDateString()}</td>
                        <td className="p-6 font-black text-lg text-indigo-400">{r.score}%</td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            isPass ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {isPass ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => router.push(`/student/exams/${r.exam_id}/review/${r.id}`)}
                                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Review Feed
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); window.print(); }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-white"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Season Leaderboard Section */}
        <div className="glass-panel p-8 border-white/5 bg-gradient-to-br from-[#0ea5e9]/5 to-transparent">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
              <Trophy className="w-6 h-6 text-amber-500" /> Professional Standings
            </h2>
            <div className="text-[10px] font-black uppercase text-gray-500 bg-white/5 px-4 py-1.5 rounded-full">
              Live Manifestation
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaderboard.length === 0 ? (
               <div className="col-span-full py-10 text-center text-gray-600 font-black uppercase text-xs">Waiting for pioneers to manifest results...</div>
            ) : (
              leaderboard.slice(0, 8).map((p, i) => (
                <div key={i} className="glass-card p-4 flex items-center gap-4 hover:border-white/20 transition-all border-white/5 bg-white/[0.01]">
                  <div className={`text-2xl font-black ${p.rank === 1 ? 'text-amber-400' : p.rank === 2 ? 'text-gray-300' : p.rank === 3 ? 'text-amber-700' : 'text-gray-600'} w-10`}>
                    #{p.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-[10px] border border-white/10">{p.initials}</div>
                  <div className="flex-1 overflow-hidden">
                     <div className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</div>
                     <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] font-black text-indigo-400">{p.score}</span>
                        <span className="text-[8px] font-black text-emerald-500">{p.grade}</span>
                     </div>
                  </div>
                </div>
              ))
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
