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
  CheckCircle2,
  TrendingUp,
  Monitor,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "@/services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



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

  // Isolated Countdown Component for Performance
  const Countdown = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState("");
    
    useEffect(() => {
      const update = () => {
        const target = new Date(targetDate).getTime();
        const diff = target - Date.now();
        if (diff <= 0) {
          setTimeLeft("Starting Now");
          return;
        }
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      };
      update();
      const timer = setInterval(update, 1000);
      return () => clearInterval(timer);
    }, [targetDate]);

    return <>{timeLeft}</>;
  };

  const chartData = useMemo(() => ({
    labels: stats?.trends?.map((t: any, i: number) => `Exam ${i + 1}`) || [],
    datasets: [
      {
        label: 'Score Progression',
        data: stats?.trends?.map((t: any) => t.score) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  }), [stats?.trends]);

  const upcomingExams = useMemo(() => exams.filter(e => new Date(e.schedule_start) > new Date()).slice(0, 3), [exams]);
  const recentExams = useMemo(() => exams.filter(e => new Date(e.schedule_start) < new Date()).slice(0, 3), [exams]);

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { label: "Missions", val: stats?.exams_completed || 0, icon: CheckCircle2, sub: "Total attempts" },
                { label: "Passing Rate", val: stats?.passing_rate || "0%", icon: TrendingUp, sub: "Authority accuracy" },
                { label: "Avg Score", val: stats?.average_score || "0%", icon: Monitor, sub: "Historical average" },
                { label: "Peak Score", val: stats?.highest_score || "0%", icon: Trophy, sub: "Personal threshold" },
                { label: "Rank", val: stats?.global_rank || "-", icon: Star, sub: "Global standing" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel p-6 border-white/5 bg-white/5 hover:border-indigo-500/30 transition-all group"
                >
                  <stat.icon className="w-5 h-5 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-black mb-1 tracking-tighter group-hover:text-indigo-400 transition-colors">{stat.val}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[9px] text-gray-600 font-bold mt-2 italic">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Exam Results Table */}
            <div className="glass-panel p-8 border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" /> Recent Exam Results
                  </h3>
                  <Link href="/student/results" className="text-[10px] font-black text-indigo-400 uppercase hover:underline">View All</Link>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/5">
                       <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Exam Name</th>
                       <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Score</th>
                       <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Grade</th>
                       <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                       <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {stats?.recent_results?.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="py-10 text-center">
                            <p className="text-[10px] font-black text-gray-600 uppercase">No recent missions detected</p>
                         </td>
                       </tr>
                     ) : (
                       stats?.recent_results?.map((res: any, i: number) => (
                         <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="py-4 text-xs font-bold uppercase tracking-tight">{res.exam_name}</td>
                           <td className="py-4 text-sm font-black text-indigo-400">{res.score}%</td>
                           <td className="py-4 font-black">
                              <span className={`text-xs px-2 py-1 rounded bg-white/5 border border-white/10 ${res.grade === 'F' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {res.grade}
                              </span>
                           </td>
                           <td className="py-4 text-[10px] text-gray-500 font-bold">{new Date(res.date).toLocaleDateString()}</td>
                           <td className="py-4 text-right">
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {res.status}
                              </span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Performance Trend Chart */}
            <div className="glass-panel p-8 border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Performance Trend
                  </h3>
                  <span className="text-[10px] font-black text-gray-500 uppercase">Score progression sequence</span>
               </div>
               <div className="h-[240px]">
                  <Line 
                    data={chartData} 
                    options={{
                       responsive: true,
                       maintainAspectRatio: false,
                       scales: {
                         y: { 
                           beginAtZero: true, 
                           max: 100,
                           grid: { color: 'rgba(255, 255, 255, 0.05)' },
                           ticks: { color: '#666', font: { weight: 'bold', size: 10 } }
                         },
                         x: { 
                           grid: { display: false },
                           ticks: { color: '#666', font: { weight: 'bold', size: 10 } }
                         }
                       },
                       plugins: { 
                         legend: { display: false },
                         tooltip: {
                           backgroundColor: '#111',
                           titleFont: { size: 10 },
                           bodyFont: { size: 12, weight: 'bold' },
                           padding: 12,
                           borderColor: 'rgba(99, 102, 241, 0.2)',
                           borderWidth: 1
                         }
                       }
                    }}
                  />
               </div>
            </div>

            {/* Upcoming & Recent History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                     <Calendar className="w-4 h-4" /> Upcoming Frontiers
                  </h3>
                  <div className="space-y-4">
                     {upcomingExams.map((e: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <div>
                             <p className="text-sm font-black uppercase">{e.title}</p>
                             <p className="text-[10px] text-gray-500 font-bold">{new Date(e.schedule_start).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-indigo-400 uppercase">Starts in</p>
                             <p className="text-xs font-black tracking-tighter"><Countdown targetDate={e.schedule_start} /></p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Recent Missions
                  </h3>
                  <div className="space-y-4">
                     {recentExams.map((e: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 opacity-60">
                          <div>
                             <p className="text-sm font-black uppercase">{e.title}</p>
                             <p className="text-[10px] text-gray-500 font-bold">{new Date(e.schedule_start).toLocaleDateString()}</p>
                          </div>
                          <Link href={`/student/exams/${e.id}`} className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-all">
                             <ArrowRight className="w-4 h-4" />
                          </Link>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Mastery & Leaderboard */}
          <div className="space-y-10">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
               <AlertCircle className="w-6 h-6 text-indigo-400" /> Notifications
            </h2>
            <div className="glass-panel p-6 space-y-4">
               {[
                 { msg: "New exam 'Advanced Java' published", time: "2h ago", icon: BookOpen },
                 { msg: "Results for 'System Design' now available", time: "5h ago", icon: Star },
                 { msg: "Welcome to the new Analytics portal", time: "1d ago", icon: TrendingUp }
               ].map((n, i) => (
                 <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
                    <div className="p-2 bg-indigo-500/10 rounded-lg h-fit"><n.icon className="w-4 h-4 text-indigo-400" /></div>
                    <div>
                       <p className="text-xs font-bold text-gray-300 leading-tight">{n.msg}</p>
                       <p className="text-[8px] font-black text-gray-500 uppercase mt-1">{n.time}</p>
                    </div>
                 </div>
               ))}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight">Mastery Statistics</h2>
            <div className="glass-panel p-8 space-y-6">
              {[
                { label: "Missions manifest", val: stats?.exams_completed || 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Global Ranking", val: stats?.global_rank || "—", icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Total Credits", val: stats?.total_credits || 0, icon: Star, color: "text-indigo-400", bg: "bg-indigo-500/10" }
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
