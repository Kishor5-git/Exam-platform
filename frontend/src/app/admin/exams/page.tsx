"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  Clock, 
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Trash2,
  Send
} from "lucide-react";
import Link from "next/link";
import api from "@/services/api";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const { data } = await api.get("exams");
      setExams(data);
    } catch (error: any) {
      console.error("Failed to fetch assessment fleet:", error);
      const msg = error.response?.data?.error || "Communications link to the assessment sector failed.";
      // Using a standard alert for now to ensure visibility
      alert(`Critical Synchronization Anomaly: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`exams/${id}/publish`);
      // Update local state for instant feedback
      setExams(exams.map((e: any) => e.id === id ? { ...e, status: 'published' } : e));
    } catch (error) {
      alert("Publication failed. Verification required.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this blueprint? Internal data vectors will be purged.")) return;
    
    const toastId = api.get === undefined ? "" : "deleting..."; // Placeholder for toast if available
    try {
      await api.delete(`exams/${id}`);
      setExams(exams.filter((e: any) => e.id !== id));
      // In a real app we'd use toast.success
    } catch (error) {
      alert("Decommissioning failed. System protocols active.");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2">Examination Management</h1>
            <p className="text-gray-400">Design, publish and monitor your assessments.</p>
          </div>
          <Link href="/admin/exams/create" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Create New Exam
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 glass-card px-4 py-2 flex items-center gap-3 border-white/5">
            <Search className="w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search by title or ID..." className="bg-transparent border-none outline-none w-full py-1" />
          </div>
          <select className="glass-card px-6 py-3 border-white/5 bg-[#0a0a0a] outline-none text-sm font-medium">
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* Exam Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-64 glass-card animate-pulse" />)
          ) : exams.length === 0 ? (
            <div className="md:col-span-3 py-20 text-center glass-card border-dashed border-white/10">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Exams Found</h3>
              <p className="text-gray-500 mb-8">Get started by creating your first online examination.</p>
              <Link href="/admin/exams/create" className="btn-secondary py-3 px-8">Create Exam</Link>
            </div>
          ) : (
            exams.map((exam: any, i) => (
              <motion.div 
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 border-white/5 group hover:border-indigo-500/30 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    exam.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {exam.status}
                  </span>
                  <button className="p-1 hover:bg-white/5 rounded"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4 group-hover:text-indigo-400 transition-colors">{exam.title}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Calendar className="w-4 h-4 text-indigo-500/50" /> 
                      <span>{new Date(exam.schedule_start).toLocaleDateString()} - {new Date(exam.schedule_end).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-indigo-500/50" /> <span>{exam.duration} Minutes Session</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Users className="w-4 h-4 text-indigo-500/50" /> <span>{exam.submissions_count || 0} Submissions</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/5 overflow-hidden">
                         <img src={`https://ui-avatars.com/api/?name=User${i}`} alt="user" />
                       </div>
                     ))}
                     <div className="w-8 h-8 rounded-full border-2 border-black bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500">
                       +12
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     {exam.status === 'draft' && (
                       <button 
                         onClick={() => handlePublish(exam.id)}
                         className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center gap-2 group/pub"
                         title="Deploy to Frontiers"
                       >
                         <Send className="w-4 h-4 group-hover/pub:translate-x-0.5 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-tighter">Go Live</span>
                       </button>
                     )}
                     <button 
                       onClick={() => handleDelete(exam.id)}
                       className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                       title="Decommission Blueprint"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                     <Link href={`/admin/exams/${exam.id}`} className="text-indigo-400 text-sm font-bold flex items-center gap-1 hover:underline">
                       Manage <ChevronRight className="w-4 h-4" />
                     </Link>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
