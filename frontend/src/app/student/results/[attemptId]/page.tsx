"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import confetti from "canvas-confetti";

export default function DetailedResultPage() {
  const { attemptId } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`results/my-results`);
        // Find this specific attempt result
        const specificResult = data.find((r: any) => r.id === attemptId);
        if (specificResult) {
          setResult(specificResult);
          if (specificResult.score >= 40) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#8b5cf6', '#d946ef', '#0ea5e9']
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch detailed result manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <DashboardLayout role="student">
       <div className="flex flex-center items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
       </div>
    </DashboardLayout>
  );

  if (!result) return (
    <DashboardLayout role="student">
       <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Mission Manifest Not Found</h2>
          <button onClick={() => router.push('/student/results')} className="mt-6 btn-secondary px-8 py-3">Back to Registry</button>
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 border-white/5 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">Success Manifested</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">Assessment Sector: {result.exam_title}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Score</p>
               <p className="text-6xl font-black gradient-text">{result.score}%</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authoritative Grade</p>
               <p className={`text-6xl font-black ${result.score >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>{result.grade}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Obtained</p>
               <p className="text-6xl font-black text-white">{result.marks_obtained}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass-panel p-8 border-white/5 space-y-6">
              <h3 className="font-black uppercase tracking-tight flex items-center gap-3">
                 < Award className="w-5 h-5 text-indigo-400" /> Mastery Breakdown
              </h3>
              <div className="space-y-4">
                 {[
                   { label: "Temporal Efficiency", val: "High", color: "text-emerald-400" },
                   { label: "Probe Accuracy", val: `${result.score}%`, color: "text-indigo-400" },
                   { label: "Status", val: "Finalized", color: "text-gray-400" }
                 ].map((stat, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                      <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-panel p-8 border-white/5 flex flex-col justify-center text-center space-y-6">
              <div className="p-6 bg-indigo-500/10 rounded-3xl mx-auto">
                 <TrendingUp className="w-12 h-12 text-indigo-400" />
              </div>
              <div>
                 <h3 className="font-black uppercase tracking-tight mb-2">Next Mission Directive</h3>
                 <p className="text-gray-500 text-sm italic">"The frontier of excellence is infinite. Continue your pursuit of mastery in the next specialized sector."</p>
              </div>
              <button 
                onClick={() => router.push('/student/exams')}
                className="btn-primary py-4 px-8 uppercase font-black tracking-widest text-xs flex items-center justify-center gap-2 group"
              >
                Return to Frontiers <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
