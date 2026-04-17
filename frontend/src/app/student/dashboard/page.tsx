"use client";

import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Timer, 
  Star,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, statsRes, leaderboardRes] = await Promise.all([
          api.get("exams"),
          api.get("stats/student"),
          api.get("stats/leaderboard")
        ]);
        setExams(examsRes.data);
        setStats(statsRes.data);
        setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCountdown = (targetDate: string) => {
    const target = new Date(targetDate).getTime();
    const diff = target - now.getTime();
    if (diff <= 0) return "Starting Now";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-10 pb-10">
        {/* Welcome Section with Hero Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 glass-panel p-10 border-white/5 bg-gradient-to-br from-[#6366f1]/20 via-transparent to-transparent flex flex-col justify-center min-h-[340px]"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                   System Status: Active
                </div>
                <h1 className="text-5xl font-black tracking-tighter leading-none">
                  Welcome Back, <span className="gradient-text">Pioneer</span>
                </h1>
                <p className="text-gray-400 max-w-md font-medium text-lg">
                  Your current global standing is <span className="text-white font-black">{stats?.global_rank || "-"}</span>.
                  The frontiers of knowledge are expanding. Continue your journey in the specialized assessment sectors.
                </p>
                <div className="pt-6">
                   <Link href="/student/exams" className="btn-primary py-3 px-8 text-xs font-black uppercase tracking-widest flex items-center gap-2 group">
                      Explore Active Frontiers <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Latest Result Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-32 h-32 text-indigo-500" />
            </div>
            <div className="relative z-10 h-full flex flex-col">
               <h3 className="font-black uppercase tracking-widest text-xs text-indigo-400 mb-8">Latest Result</h3>
               {stats?.latest_result ? (
                 <div className="space-y-6 flex-1 flex flex-col justify-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-black mb-1">{stats.latest_result.exam_title}</p>
                      <div className="text-6xl font-black tracking-tighter">{stats.latest_result.score}%</div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Grade</span>
                          <span className="text-3xl font-black text-emerald-400">{stats.latest_result.grade}</span>
                       </div>
                       <Link href="/student/results" className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                       </Link>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-center text-center items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-600 uppercase">No completed missions yet</p>
                 </div>
               )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Performance Sector */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
              <Star className="w-6 h-6 text-indigo-400" /> Mastery Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Completion Rate", val: `${stats?.passing_rate || 0}%`, icon: CheckCircle2, sub: "Assessments finalized" },
                { label: "Elite Standing", val: `#${stats?.global_rank || "-"}`, icon: Trophy, sub: "Global leaderboard rank" },
                { label: "Total Missions", val: stats?.total_exams || 0, icon: Clock, sub: "Completed frontiers" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel p-6 border-white/5"
                >
                  <stat.icon className="w-5 h-5 text-indigo-500 mb-4" />
                  <div className="text-3xl font-black mb-1">{stat.val}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[9px] text-gray-600 font-bold mt-2 italic">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Mastery & Leaderboard */}
          <div className="space-y-10">
            <h2 className="text-2xl font-black uppercase tracking-tight">Mastery Statistics</h2>
            <div className="glass-panel p-8 space-y-6">
              {[
                { label: "Completion Rate", val: stats?.exams_completed || 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Global Ranking", val: stats?.global_rank || "-", icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Avg. Precision", val: stats?.average_score || "0%", icon: Star, color: "text-indigo-400", bg: "bg-indigo-500/10" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 ${item.bg} rounded-xl`}><item.icon className={`w-5 h-5 ${item.color}`} /></div>
                     <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-xl font-black tracking-tighter">{item.val}</span>
                </div>
              ))}
            </div>

            <div className="glass-panel p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black uppercase tracking-widest text-xs">Peak Performers</h3>
                  <Link href="#" className="text-[10px] font-black text-indigo-400 uppercase">Full Index</Link>
               </div>
               <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-[10px] font-black text-gray-600 uppercase">No pioneers found</p>
                    </div>
                  ) : (
                    leaderboard.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-all">
                        <span className={`w-8 text-center font-black text-lg ${p.rank <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>#{p.rank}</span>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:border-indigo-500/40 transition-all flex items-center justify-center font-bold text-[10px]">
                           {p.initials}
                        </div>
                        <div className="flex-1">
                           <span className="block text-sm font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{p.name}</span>
                           <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{p.completed} Exams</span>
                        </div>
                        <div className="text-right">
                           <span className="block text-sm font-black text-indigo-400">{p.score}</span>
                           <span className="block text-[10px] font-black text-emerald-400">{p.grade}</span>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const i_PEAK_PERFORMERS = [
  { pos: 1, name: "Sarah Connor", score: "98%", color: "text-amber-400", initials: "SC" },
  { pos: 2, name: "Marcus Bloom", score: "95%", color: "text-gray-400", initials: "MB" },
  { pos: 3, name: "Elena K.", score: "92%", color: "text-amber-700", initials: "EK" }
];
