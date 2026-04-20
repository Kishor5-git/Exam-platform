"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Zap,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function StudentExams() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get("exams");
        setExams(data);
      } catch (error: any) {
        console.error("DISCOVERY_PROTOCOL_ANOMALY:", error.response?.data || error.message);
        // Silently handle - the UI will show the "No frontiers detected" state
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Available Frontiers</h1>
          <p className="text-gray-400 font-medium">Identify your target assessment and manifest success.</p>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse font-black uppercase text-xs">Scanning Frontiers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-panel border-white/5">
                <p className="text-gray-600 font-black uppercase tracking-widest text-[10px]">Zero active assessment frontiers detected.</p>
              </div>
            ) : (
              exams.map((exam, i) => {
                const isCompleted = exam.attempt_status === 'completed';
                return (
                  <motion.div 
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`glass-card p-6 border-white/5 transition-all flex flex-col group ${isCompleted ? 'opacity-70 grayscale-[0.5]' : 'hover:border-indigo-500/30 cursor-pointer'}`}
                    onClick={() => !isCompleted && router.push(`/student/exams/${exam.id}`)}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            {exam.duration}m
                         </div>
                         {isCompleted && (
                           <div className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                              Mission Manifested
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-4">
                      {exam.description || "Manifest your expertise in this authoritative assessment protocol."}
                    </p>

                    <div className="flex items-center gap-2 mb-6">
                      <div className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md">
                        Single Attempt Sovereign
                      </div>
                      {isCompleted ? (
                        <div className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 text-white border border-white/20 rounded-md">
                          Sector Locked
                        </div>
                      ) : (
                        <div className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md">
                          No Re-entry
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] font-black">{exam.questions_count || 0} Probes</span>
                        </div>
                        <div className={`flex items-center gap-1 ${isCompleted ? 'text-gray-500' : 'text-emerald-400'}`}>
                          <Zap className="w-3 h-3" />
                          <span className="text-[10px] font-black">{isCompleted ? 'Decommissioned' : 'Active'}</span>
                        </div>
                      </div>
                      {!isCompleted && <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
