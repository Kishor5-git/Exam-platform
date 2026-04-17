"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock, 
  Trophy,
  AlertCircle,
  HelpCircle,
  BarChart3
} from "lucide-react";
import api from "@/services/api";
import { motion } from "framer-motion";

export default function ExamReview() {
  const { examId, attemptId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await api.get(`results/my-review/${attemptId}`);
        setData(data);
      } catch (error) {
        console.error("Failed to fetch review manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [attemptId]);

  if (loading) return (
    <DashboardLayout role="student">
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout role="student">
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold">Review Manifold Unavailable</h1>
        <button onClick={() => router.back()} className="mt-6 btn-secondary">Go Back</button>
      </div>
    </DashboardLayout>
  );

  const { attempt, review } = data;
  const correctCount = review.filter((r: any) => r.is_correct).length;

  return (
    <DashboardLayout role="student">
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/student/results')}
              className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tight">Performance <span className="gradient-text">Manifest</span></h1>
            <p className="text-gray-400 font-medium">Detailed evaluation of your assessment manifestation.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="glass-panel px-6 py-4 border-white/5 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Final Score</span>
                <span className={`text-2xl font-black ${attempt.score >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>{attempt.score}%</span>
             </div>
             <div className="glass-panel px-6 py-4 border-white/5 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Accuracy</span>
                <span className="text-2xl font-black text-indigo-400">{correctCount}/{review.length}</span>
             </div>
          </div>
        </div>

        {/* Detailed Review Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
            <BarChart3 className="w-6 h-6 text-indigo-500" /> Response Evaluation
          </h2>
          
          <div className="space-y-6">
            {review.map((item: any, idx: number) => {
              const options = JSON.parse(item.options || "[]");
              return (
                <motion.div 
                  key={item.question_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-panel p-8 border-l-4 transition-all ${
                    item.is_correct 
                      ? 'border-l-emerald-500 bg-emerald-500/[0.02] border-white/5' 
                      : item.student_response 
                        ? 'border-l-red-500 bg-red-500/[0.02] border-white/5'
                        : 'border-l-gray-700 bg-white/[0.01] border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-black text-gray-400 border border-white/10">
                        {idx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{item.question_text}</h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                       <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                         item.is_correct ? 'text-emerald-400' : 'text-red-400'
                       }`}>
                         {item.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                         {item.is_correct ? 'Correct' : 'Incorrect'}
                       </span>
                       <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Value: {item.marks} Point</span>
                    </div>
                  </div>

                  {/* Options Comparison */}
                  {item.type === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {options.map((opt: string, oIdx: number) => {
                        const isStudent = item.student_response === opt;
                        const isCorrect = item.correct_answer === opt;
                        
                        let borderColor = "border-white/5";
                        let bgColor = "bg-white/5";
                        let textColor = "text-gray-400";

                        if (isCorrect) {
                          borderColor = "border-emerald-500/50";
                          bgColor = "bg-emerald-500/10";
                          textColor = "text-emerald-400";
                        } else if (isStudent) {
                          borderColor = "border-red-500/50";
                          bgColor = "bg-red-500/10";
                          textColor = "text-red-400";
                        }

                        return (
                          <div 
                            key={opt}
                            className={`p-4 rounded-xl border-2 ${borderColor} ${bgColor} ${textColor} text-sm font-bold flex items-center justify-between group`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black border ${
                                isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                            </div>
                            {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                            {isStudent && !isCorrect && <XCircle className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Open Response Comparison */}
                  {item.type !== 'MCQ' && (
                    <div className="space-y-4 mb-6">
                       <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Your Outcome</span>
                          <p className={`font-bold ${item.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.student_response || <span className="italic opacity-50">No Response Manifested.</span>}
                          </p>
                       </div>
                       {!item.is_correct && (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                             <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest block mb-2">Authoritative Key</span>
                             <p className="font-bold text-emerald-400">{item.correct_answer}</p>
                          </div>
                       )}
                    </div>
                  )}

                  {/* Authoritative Explanation */}
                  {item.explanation && (
                    <div className="mt-6 flex gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                       <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                       </div>
                       <div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Knowledge Manifest</span>
                          <p className="text-gray-400 text-sm font-medium leading-relaxed">{item.explanation}</p>
                       </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Closing Action */}
        <div className="pt-10 border-t border-white/5 flex justify-center">
           <button 
             onClick={() => router.push('/student/dashboard')}
             className="btn-primary px-12 py-4 flex items-center gap-3"
           >
              Return to Command Center <ArrowLeft className="w-4 rotate-180" />
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
